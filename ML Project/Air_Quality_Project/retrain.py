"""
retrain.py — Retrain all AQI models and save fresh pickle files.

Models trained:
  1. Random Forest  — Direct     (predict PM25_next_1h directly)
  2. XGBoost        — Direct
  3. Random Forest  — Change     (predict delta = PM25_next_1h - PM2.5_current)
  4. HistGradBoost  — Change

Run from the Air_Quality_Project directory:
    python retrain.py
"""

import pathlib, pickle, time
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE    = pathlib.Path(__file__).parent
DATA    = BASE / "data"
MODELS  = BASE / "models"
MODELS.mkdir(exist_ok=True)

TRAIN_CSV = DATA / "bengaluru_train_2019_2024.csv"
TEST_CSV  = DATA / "bengaluru_test_2025.csv"

# ---------------------------------------------------------------------------
# Feature columns — same 22 the original XGBoost was trained on
# ---------------------------------------------------------------------------
FEATURES = [
    "PM2.5 (µg/m³)", "PM10 (µg/m³)", "NO (µg/m³)", "NO2 (µg/m³)",
    "NOx (ppb)", "NH3 (µg/m³)", "SO2 (µg/m³)", "CO (mg/m³)",
    "Ozone (µg/m³)", "Benzene (µg/m³)", "Toluene (µg/m³)",
    "RH (%)", "WD (deg)", "BP (mmHg)",
    "Hour", "DayOfWeek", "Month", "Day",
    "PM25_lag_1h", "PM25_lag_3h", "PM25_lag_6h", "PM25_lag_24h",
]
TARGET_DIRECT = "PM25_next_1h"

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
print("Loading data …")
train = pd.read_csv(TRAIN_CSV)
test  = pd.read_csv(TEST_CSV)

# Drop rows where target is missing
train = train.dropna(subset=[TARGET_DIRECT])
test  = test.dropna(subset=[TARGET_DIRECT])

X_train = train[FEATURES]
y_train_direct = train[TARGET_DIRECT]
y_train_change = train[TARGET_DIRECT] - train["PM2.5 (µg/m³)"]

X_test  = test[FEATURES]
y_test_direct = test[TARGET_DIRECT]
y_test_change = test[TARGET_DIRECT] - test["PM2.5 (µg/m³)"]

print(f"Train: {len(X_train):,} rows | Test: {len(X_test):,} rows")

# ---------------------------------------------------------------------------
# Helper: evaluate and print metrics
# ---------------------------------------------------------------------------
def evaluate(name: str, y_true, y_pred):
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = mean_squared_error(y_true, y_pred) ** 0.5
    r2   = r2_score(y_true, y_pred)
    print(f"  {name:35s}  MAE={mae:.3f}  RMSE={rmse:.3f}  R²={r2:.4f}")
    return {"model": name, "mae": round(mae, 4), "rmse": round(rmse, 4), "r2": round(r2, 4)}

def save(obj, path: pathlib.Path):
    with open(path, "wb") as f:
        pickle.dump(obj, f, protocol=5)
    print(f"  Saved -> {path.name}")

# ---------------------------------------------------------------------------
# 1. Random Forest — Direct
# ---------------------------------------------------------------------------
print("\n[1/4] Training Random Forest — Direct …")
t0 = time.time()
rf_direct = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model",   RandomForestRegressor(
        n_estimators=200, max_depth=20, min_samples_leaf=4,
        n_jobs=-1, random_state=42
    )),
])
rf_direct.fit(X_train, y_train_direct)
pred = rf_direct.predict(X_test)
metrics_rf_direct = evaluate("Random Forest — Direct", y_test_direct, pred)
save(rf_direct, MODELS / "random_forest_direct.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 2. XGBoost — Direct
# ---------------------------------------------------------------------------
print("\n[2/4] Training XGBoost — Direct …")
t0 = time.time()
xgb_direct = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model",   XGBRegressor(
        n_estimators=500, learning_rate=0.05, max_depth=7,
        subsample=0.8, colsample_bytree=0.8,
        n_jobs=-1, random_state=42, verbosity=0,
        tree_method="hist",
    )),
])
xgb_direct.fit(X_train, y_train_direct)
pred = xgb_direct.predict(X_test)
metrics_xgb_direct = evaluate("XGBoost — Direct", y_test_direct, pred)
save(xgb_direct, MODELS / "xgboost_direct.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 3. Random Forest — Change
# ---------------------------------------------------------------------------
print("\n[3/4] Training Random Forest — Change …")
t0 = time.time()
# Drop rows where current PM2.5 is null (needed to compute change)
mask_train = train["PM2.5 (µg/m³)"].notna()
mask_test  = test["PM2.5 (µg/m³)"].notna()

rf_change = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model",   RandomForestRegressor(
        n_estimators=200, max_depth=20, min_samples_leaf=4,
        n_jobs=-1, random_state=42
    )),
])
rf_change.fit(X_train[mask_train], y_train_change[mask_train])
pred_delta = rf_change.predict(X_test[mask_test])
pred_pm25  = pred_delta + test.loc[mask_test, "PM2.5 (µg/m³)"].values
metrics_rf_change = evaluate("Random Forest — Change", y_test_direct[mask_test], pred_pm25)
save(rf_change, MODELS / "random_forest_change.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 4. HistGradientBoosting — Change
# ---------------------------------------------------------------------------
print("\n[4/4] Training HistGradientBoosting — Change …")
t0 = time.time()
# HGB handles NaN natively — no imputer needed, but wrap in pipeline for consistency
hgb_change = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model",   HistGradientBoostingRegressor(
        max_iter=300, learning_rate=0.05, max_depth=7,
        min_samples_leaf=20, random_state=42,
    )),
])
hgb_change.fit(X_train[mask_train], y_train_change[mask_train])
pred_delta = hgb_change.predict(X_test[mask_test])
pred_pm25  = pred_delta + test.loc[mask_test, "PM2.5 (µg/m³)"].values
metrics_hgb_change = evaluate("HistGradBoost — Change", y_test_direct[mask_test], pred_pm25)
save(hgb_change, MODELS / "hist_gradient_boosting_change.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# Save updated model_comparison.csv
# ---------------------------------------------------------------------------
results = [metrics_rf_direct, metrics_xgb_direct, metrics_rf_change, metrics_hgb_change]
comparison = pd.DataFrame(results).rename(columns={"model": "Model", "mae": "MAE", "rmse": "RMSE", "r2": "R2"})
comparison.to_csv(DATA / "model_comparison.csv", index=False)
print(f"\nUpdated model_comparison.csv")

print("\n=== All models trained and saved ===")
for r in results:
    print(f"  {r['model']:35s}  MAE={r['mae']}  RMSE={r['rmse']}  R²={r['r2']}")
