"""
retrain.py — Retrain all AQI models and save fresh pickle files.
================================================================
Models trained:
  1. Random Forest       — Direct  (predict PM25_next_1h directly)
  2. XGBoost             — Direct
  3. Random Forest       — Change  (predict delta = PM25_next_1h - PM2.5_current)
  4. HistGradBoost       — Change

Usage:
    python retrain.py
"""

import pathlib
import sys
import time
import numpy as np
import pandas as pd

# Add repo root to sys.path
REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.preprocessing.features import MODEL_FEATURES, TARGET_DIRECT
from src.models.trainer import train_model, save_pipeline
from src.evaluation.metrics import calculate_regression_metrics

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE = pathlib.Path(__file__).parent
DATA = BASE / "data"
MODELS = BASE / "models"
MODELS.mkdir(exist_ok=True)

TRAIN_CSV = DATA / "bengaluru_train_2019_2024.csv"
TEST_CSV  = DATA / "bengaluru_test_2025.csv"

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
print("Loading datasets …")
train = pd.read_csv(TRAIN_CSV)
test  = pd.read_csv(TEST_CSV)

# Drop rows where target is missing
train = train.dropna(subset=[TARGET_DIRECT])
test  = test.dropna(subset=[TARGET_DIRECT])

X_train = train[MODEL_FEATURES]
y_train_direct = train[TARGET_DIRECT]
y_train_change = train[TARGET_DIRECT] - train["PM2.5 (µg/m³)"]

X_test  = test[MODEL_FEATURES]
y_test_direct = test[TARGET_DIRECT]
y_test_change = test[TARGET_DIRECT] - test["PM2.5 (µg/m³)"]

print(f"Train: {len(X_train):,} rows | Test: {len(X_test):,} rows")

def report_metrics(name: str, y_true, y_pred) -> dict:
    metrics = calculate_regression_metrics(np.asarray(y_true), np.asarray(y_pred))
    print(f"  {name:35s}  MAE={metrics['mae']:.3f}  RMSE={metrics['rmse']:.3f}  R²={metrics['r2']:.4f}")
    return {"model": name, **metrics}

# ---------------------------------------------------------------------------
# 1. Random Forest — Direct
# ---------------------------------------------------------------------------
print("\n[1/4] Training Random Forest — Direct …")
t0 = time.time()
rf_direct = train_model(
    model_type="random_forest",
    approach="direct",
    X_train=X_train,
    y_train=y_train_direct,
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=4,
)
pred = rf_direct.predict(X_test)
metrics_rf_direct = report_metrics("Random Forest — Direct", y_test_direct, pred)
save_pipeline(rf_direct, MODELS / "random_forest_direct.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 2. XGBoost — Direct
# ---------------------------------------------------------------------------
print("\n[2/4] Training XGBoost — Direct …")
t0 = time.time()
xgb_direct = train_model(
    model_type="xgboost",
    approach="direct",
    X_train=X_train,
    y_train=y_train_direct,
    n_estimators=500,
    learning_rate=0.05,
    max_depth=7,
    subsample=0.8,
    colsample_bytree=0.8,
    tree_method="hist",
)
pred = xgb_direct.predict(X_test)
metrics_xgb_direct = report_metrics("XGBoost — Direct", y_test_direct, pred)
save_pipeline(xgb_direct, MODELS / "xgboost_direct.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 3. Random Forest — Change
# ---------------------------------------------------------------------------
print("\n[3/4] Training Random Forest — Change …")
t0 = time.time()
mask_train = train["PM2.5 (µg/m³)"].notna()
mask_test  = test["PM2.5 (µg/m³)"].notna()

rf_change = train_model(
    model_type="random_forest",
    approach="change",
    X_train=X_train[mask_train],
    y_train=y_train_change[mask_train],
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=4,
)
pred_delta = rf_change.predict(X_test[mask_test])
pred_pm25 = pred_delta + test.loc[mask_test, "PM2.5 (µg/m³)"].values
metrics_rf_change = report_metrics("Random Forest — Change", y_test_direct[mask_test], pred_pm25)
save_pipeline(rf_change, MODELS / "random_forest_change.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 4. HistGradientBoosting — Change
# ---------------------------------------------------------------------------
print("\n[4/4] Training HistGradientBoosting — Change …")
t0 = time.time()
hgb_change = train_model(
    model_type="hist_gradient_boosting",
    approach="change",
    X_train=X_train[mask_train],
    y_train=y_train_change[mask_train],
    max_iter=300,
    learning_rate=0.05,
    max_depth=7,
    min_samples_leaf=20,
)
pred_delta = hgb_change.predict(X_test[mask_test])
pred_pm25 = pred_delta + test.loc[mask_test, "PM2.5 (µg/m³)"].values
metrics_hgb_change = report_metrics("HistGradBoost — Change", y_test_direct[mask_test], pred_pm25)
save_pipeline(hgb_change, MODELS / "hist_gradient_boosting_change.pkl")
print(f"  Done in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# Update comparison CSV
# ---------------------------------------------------------------------------
results = [metrics_rf_direct, metrics_xgb_direct, metrics_rf_change, metrics_hgb_change]
comparison = pd.DataFrame(results).rename(columns={"model": "Model", "mae": "MAE", "rmse": "RMSE", "r2": "R2"})
comparison.to_csv(DATA / "model_comparison.csv", index=False)
print("\nUpdated model_comparison.csv")
print("\n=== Retraining Complete ===")
