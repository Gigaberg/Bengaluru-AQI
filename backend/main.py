"""
Bengaluru AQI Platform — FastAPI Backend
=========================================
Serves real ML predictions and historical data to the Next.js frontend.

Models available:
  - xgboost_direct          XGBoost — Direct    (predict PM2.5 next hour)
  - random_forest_direct    Random Forest — Direct
  - random_forest_change    Random Forest — Change (predict Δ PM2.5)
  - hist_gradient_boosting  HistGradientBoosting — Change

Data source: bengaluru_master_unprocessed.csv (CPCB hourly readings 2019–2024)
"""

import pickle
import numpy as np
import pandas as pd
import shap
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any

import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import httpx

load_dotenv()

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR   = Path(__file__).parent
MODELS_DIR = BASE_DIR.parent / "ML Project" / "Air_Quality_Project" / "models"
DATA_DIR   = BASE_DIR.parent / "ML Project" / "Air_Quality_Project" / "data"
HIST_CSV   = DATA_DIR / "bengaluru_master_unprocessed.csv"

# ---------------------------------------------------------------------------
# Model registry — id → metadata
# ---------------------------------------------------------------------------
MODEL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "xgboost_direct": {
        "label":       "XGBoost — Direct",
        "description": "XGBoost regressor predicting next-hour PM2.5 directly. Fast inference, good baseline.",
        "approach":    "direct",   # output is absolute PM2.5
        "r2": 0.460, "mae": 5.519, "rmse": 30.175,
        "pkl":  "xgboost_direct.pkl",
        "default": True,
    },
    "random_forest_direct": {
        "label":       "Random Forest — Direct",
        "description": "Random Forest regressor predicting next-hour PM2.5 directly.",
        "approach":    "direct",
        "r2": 0.643, "mae": 5.015, "rmse": 24.519,
        "pkl":  "random_forest_direct.pkl",
    },
    "random_forest_change": {
        "label":       "Random Forest — Change",
        "description": "Random Forest trained on PM2.5 delta. Adds predicted change to current value. Best RMSE.",
        "approach":    "change",   # output is Δ PM2.5; add to current pm25
        "r2": 0.728, "mae": 4.857, "rmse": 21.399,
        "pkl":  "random_forest_change.pkl",
    },
    "hist_gradient_boosting": {
        "label":       "HistGradientBoosting — Change",
        "description": "Histogram-based Gradient Boosting on PM2.5 delta. Highest R² — recommended model.",
        "approach":    "change",
        "r2": 0.820, "mae": 4.474, "rmse": 17.428,
        "pkl":  "hist_gradient_boosting_change.pkl",
        "recommended": True,
    },
}

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Bengaluru AQI Platform API",
    description="Real ML-powered air quality predictions for Bengaluru",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Station registry
# ---------------------------------------------------------------------------
STATIONS = {
    "btm":       {"id": "btm",       "name": "BTM Layout",  "lat": 12.9165, "lng": 77.6101},
    "jayanagar": {"id": "jayanagar", "name": "Jayanagar",   "lat": 12.9299, "lng": 77.5824},
    "silkboard": {"id": "silkboard", "name": "Silk Board",  "lat": 12.9172, "lng": 77.6228},
    "peenya":    {"id": "peenya",    "name": "Peenya",      "lat": 13.0329, "lng": 77.5274},
}

# Feature columns all models share
MODEL_FEATURES = [
    "PM2.5 (µg/m³)", "PM10 (µg/m³)", "NO (µg/m³)", "NO2 (µg/m³)",
    "NOx (ppb)", "NH3 (µg/m³)", "SO2 (µg/m³)", "CO (mg/m³)",
    "Ozone (µg/m³)", "Benzene (µg/m³)", "Toluene (µg/m³)",
    "RH (%)", "WD (deg)", "BP (mmHg)",
    "Hour", "DayOfWeek", "Month", "Day",
    "PM25_lag_1h", "PM25_lag_3h", "PM25_lag_6h", "PM25_lag_24h",
]

DISPLAY_NAMES = {
    "PM2.5 (µg/m³)":   "PM2.5",
    "PM10 (µg/m³)":    "PM10",
    "NO (µg/m³)":      "NO",
    "NO2 (µg/m³)":     "NO₂",
    "NOx (ppb)":       "NOx",
    "NH3 (µg/m³)":     "NH₃",
    "SO2 (µg/m³)":     "SO₂",
    "CO (mg/m³)":      "CO",
    "Ozone (µg/m³)":   "O₃",
    "Benzene (µg/m³)": "Benzene",
    "Toluene (µg/m³)": "Toluene",
    "RH (%)":          "Humidity",
    "WD (deg)":        "Wind Direction",
    "BP (mmHg)":       "Pressure",
    "Hour":            "Hour of Day",
    "DayOfWeek":       "Day of Week",
    "Month":           "Month",
    "Day":             "Day",
    "PM25_lag_1h":     "PM2.5 (1h ago)",
    "PM25_lag_3h":     "PM2.5 (3h ago)",
    "PM25_lag_6h":     "PM2.5 (6h ago)",
    "PM25_lag_24h":    "PM2.5 (24h ago)",
}

# ---------------------------------------------------------------------------
# CPCB AQI — PM2.5 sub-index
# ---------------------------------------------------------------------------
PM25_BREAKPOINTS = [
    (0.0,   30.0,  0,   50),
    (30.0,  60.0,  50,  100),
    (60.0,  90.0,  100, 200),
    (90.0,  120.0, 200, 300),
    (120.0, 250.0, 300, 400),
    (250.0, 500.0, 400, 500),
]

def pm25_to_aqi(pm25: float) -> int:
    pm25 = max(0.0, min(pm25, 500.0))
    for c_lo, c_hi, i_lo, i_hi in PM25_BREAKPOINTS:
        if c_lo <= pm25 <= c_hi:
            return int(round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo))
    return 500

def aqi_to_category(aqi: int) -> str:
    if aqi <= 50:  return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"

# ---------------------------------------------------------------------------
# Startup: load all models + historical data
# ---------------------------------------------------------------------------
_models: Dict[str, Any]      = {}   # model_id → fitted pipeline
_explainers: Dict[str, Any]  = {}   # model_id → SHAP explainer
_hist_df: Optional[pd.DataFrame] = None

@app.on_event("startup")
def load_resources():
    global _hist_df

    # Load each model in the registry
    for model_id, meta in MODEL_REGISTRY.items():
        pkl_path = MODELS_DIR / meta["pkl"]
        print(f"[startup] Loading {meta['label']} …")
        with open(pkl_path, "rb") as f:
            pipeline = pickle.load(f)
        _models[model_id] = pipeline

        # Build SHAP explainer on the final estimator inside the Pipeline
        estimator = pipeline.named_steps["model"]
        try:
            _explainers[model_id] = shap.TreeExplainer(estimator)
            print(f"[startup]   SHAP explainer ready for {model_id}")
        except Exception as e:
            print(f"[startup]   SHAP unavailable for {model_id}: {e}")

    print(f"[startup] {len(_models)} models loaded")

    # Historical data
    print(f"[startup] Loading historical data …")
    df = pd.read_csv(HIST_CSV, parse_dates=["Timestamp"])
    raw_cols = df.columns.tolist()
    clean_map = {
        raw_cols[1]:  "PM2.5 (µg/m³)", raw_cols[2]:  "PM10 (µg/m³)",
        raw_cols[3]:  "NO (µg/m³)",     raw_cols[4]:  "NO2 (µg/m³)",
        raw_cols[5]:  "NOx (ppb)",      raw_cols[6]:  "NH3 (µg/m³)",
        raw_cols[7]:  "SO2 (µg/m³)",    raw_cols[8]:  "CO (mg/m³)",
        raw_cols[9]:  "Ozone (µg/m³)",  raw_cols[10]: "Benzene (µg/m³)",
        raw_cols[11]: "Toluene (µg/m³)",
    }
    df = df.rename(columns=clean_map)
    df["aqi"] = df["PM2.5 (µg/m³)"].apply(lambda x: pm25_to_aqi(x) if pd.notna(x) else None)
    _hist_df = df
    print(f"[startup] Loaded {len(df):,} rows across {df['Station'].nunique()} stations ({df['Year'].min()}–{df['Year'].max()})")

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class PredictionInput(BaseModel):
    pm25:         float         = Field(...,    description="PM2.5 (µg/m³) — required")
    pm10:         float         = Field(...,    description="PM10 (µg/m³) — required")
    no2:          Optional[float] = Field(None, description="NO2 (µg/m³)   — defaults to training median 20.55")
    o3:           Optional[float] = Field(None, description="Ozone (µg/m³) — defaults to training median 27.25")
    co:           Optional[float] = Field(None, description="CO (mg/m³)    — defaults to training median 0.69")
    no:           Optional[float] = Field(None, description="NO (µg/m³)    — defaults to training median 3.38")
    nox:          Optional[float] = Field(None, description="NOx (ppb)     — defaults to training median 19.48")
    so2:          Optional[float] = Field(None, description="SO2 (µg/m³)   — defaults to training median 5.10")
    nh3:          Optional[float] = Field(None, description="NH3 (µg/m³)   — defaults to training median 11.48")
    benzene:      Optional[float] = Field(None, description="Benzene (µg/m³) — defaults to 0.30")
    toluene:      Optional[float] = Field(None, description="Toluene (µg/m³) — defaults to 1.27")
    rh:           Optional[float] = Field(None, description="Relative Humidity (%) — defaults to 70.0")
    wd:           Optional[float] = Field(None, description="Wind Direction (deg)  — defaults to 180.0")
    bp:           Optional[float] = Field(None, description="Barometric Pressure (mmHg) — defaults to 1000.0")
    pm25_lag_1h:  Optional[float] = Field(None, description="PM2.5 1-hour lag  — defaults to current pm25")
    pm25_lag_3h:  Optional[float] = Field(None, description="PM2.5 3-hour lag  — defaults to current pm25")
    pm25_lag_6h:  Optional[float] = Field(None, description="PM2.5 6-hour lag  — defaults to current pm25")
    pm25_lag_24h: Optional[float] = Field(None, description="PM2.5 24-hour lag — defaults to current pm25")
    model_id:     Optional[str]   = Field(None, description="Model to use (default: xgboost_direct)")

class SimulationInput(BaseModel):
    base:       PredictionInput
    reductions: dict
    model_id:   Optional[str] = Field(None, description="Model to use for simulation")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _resolve_model(model_id: Optional[str]) -> str:
    """Return a valid model_id, falling back to the default."""
    if model_id and model_id in _models:
        return model_id
    # find the default
    for mid, meta in MODEL_REGISTRY.items():
        if meta.get("default"):
            return mid
    return next(iter(_models))

def _build_feature_row(inp: PredictionInput) -> pd.DataFrame:
    now = datetime.now()
    # Training-set medians used when optional fields are omitted
    row = {
        "PM2.5 (µg/m³)":   inp.pm25,
        "PM10 (µg/m³)":    inp.pm10,
        "NO (µg/m³)":      inp.no      if inp.no      is not None else 3.38,
        "NO2 (µg/m³)":     inp.no2     if inp.no2     is not None else 20.55,
        "NOx (ppb)":       inp.nox     if inp.nox     is not None else 19.48,
        "NH3 (µg/m³)":     inp.nh3     if inp.nh3     is not None else 11.48,
        "SO2 (µg/m³)":     inp.so2     if inp.so2     is not None else 5.10,
        "CO (mg/m³)":      inp.co      if inp.co      is not None else 0.69,
        "Ozone (µg/m³)":   inp.o3      if inp.o3      is not None else 27.25,
        "Benzene (µg/m³)": inp.benzene if inp.benzene is not None else 0.30,
        "Toluene (µg/m³)": inp.toluene if inp.toluene is not None else 1.27,
        "RH (%)":          inp.rh      if inp.rh      is not None else 70.0,
        "WD (deg)":        inp.wd      if inp.wd      is not None else 180.0,
        "BP (mmHg)":       inp.bp      if inp.bp      is not None else 1000.0,
        "Hour":            now.hour,
        "DayOfWeek":       now.weekday(),
        "Month":           now.month,
        "Day":             now.day,
        "PM25_lag_1h":     inp.pm25_lag_1h  if inp.pm25_lag_1h  is not None else inp.pm25,
        "PM25_lag_3h":     inp.pm25_lag_3h  if inp.pm25_lag_3h  is not None else inp.pm25,
        "PM25_lag_6h":     inp.pm25_lag_6h  if inp.pm25_lag_6h  is not None else inp.pm25,
        "PM25_lag_24h":    inp.pm25_lag_24h if inp.pm25_lag_24h is not None else inp.pm25,
    }
    return pd.DataFrame([row], columns=MODEL_FEATURES)

def _run_prediction(inp: PredictionInput, model_id: str) -> dict:
    """Core prediction logic shared by /predict and /simulate."""
    pipeline = _models[model_id]
    meta     = MODEL_REGISTRY[model_id]
    feat_df  = _build_feature_row(inp)

    raw = float(pipeline.predict(feat_df)[0])

    if meta["approach"] == "change":
        # raw is Δ PM2.5 — add to current reading
        pm25_pred = max(0.0, inp.pm25 + raw)
    else:
        pm25_pred = max(0.0, raw)

    aqi      = pm25_to_aqi(pm25_pred)
    category = aqi_to_category(aqi)
    aqi_lo   = pm25_to_aqi(max(0.0,   pm25_pred * 0.90))
    aqi_hi   = pm25_to_aqi(min(500.0, pm25_pred * 1.10))

    return {
        "aqi":        aqi,
        "category":   category,
        "model":      meta["label"],
        "model_id":   model_id,
        "pm25_pred":  round(pm25_pred, 2),
        "confidence": [aqi_lo, aqi_hi],
    }

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "Bengaluru AQI Platform API", "version": "2.0.0"}


@app.get("/stations", tags=["stations"])
def get_stations():
    return list(STATIONS.values())


@app.get("/models", tags=["ml"])
def list_models():
    """Returns all available ML models and their metadata."""
    return [
        {
            "id":          mid,
            "label":       meta["label"],
            "description": meta["description"],
            "approach":    meta["approach"],
            "r2":          meta["r2"],
            "mae":         meta["mae"],
            "rmse":        meta["rmse"],
            "default":     meta.get("default", False),
            "recommended": meta.get("recommended", False),
        }
        for mid, meta in MODEL_REGISTRY.items()
    ]


@app.get("/historical/years", tags=["data"])
def get_available_years():
    if _hist_df is None:
        raise HTTPException(503, "Historical data not loaded yet")
    return sorted(_hist_df["Timestamp"].dt.year.unique().tolist())


@app.get("/historical", tags=["data"])
def get_historical(
    station_id: Optional[str] = Query(None),
    days:       int            = Query(30, ge=1, le=2500),
    year:       Optional[int]  = Query(None),
    month:      Optional[int]  = Query(None, ge=1, le=12),
    fields:     Optional[str]  = Query(None, description="Comma-separated list of fields to return. If omitted, returns all fields. Example: aqi,pm25,pm10"),
):
    if _hist_df is None:
        raise HTTPException(503, "Historical data not loaded yet")

    if station_id:
        if station_id not in STATIONS:
            raise HTTPException(404, f"Unknown station '{station_id}'. Valid: {list(STATIONS.keys())}")
        df = _hist_df[_hist_df["Station"] == station_id]
    else:
        df = _hist_df

    if year is not None:
        df = df[df["Timestamp"].dt.year == year]
    if month is not None:
        df = df[df["Timestamp"].dt.month == month]
    if year is None:
        cutoff = df["Timestamp"].max() - timedelta(days=days)
        df = df[df["Timestamp"] >= cutoff]

    df = df.sort_values("Timestamp")

    # Vectorized serialization — much faster than iterrows()
    # Map frontend field names to CSV column names
    FIELD_MAP = {
        "pm25":      "PM2.5 (µg/m³)",
        "pm10":      "PM10 (µg/m³)",
        "no2":       "NO2 (µg/m³)",
        "o3":        "Ozone (µg/m³)",
        "co":        "CO (mg/m³)",
        "so2":       "SO2 (µg/m³)",
        "nh3":       "NH3 (µg/m³)",
    }

    # Determine which fields to return
    requested = [f.strip() for f in fields.split(",")] if fields else list(FIELD_MAP.keys())
    # Always include stationId, timestamp, aqi
    needed_csv_cols = [FIELD_MAP[f] for f in requested if f in FIELD_MAP]
    select_cols = ["Station", "Timestamp", "aqi"] + needed_csv_cols
    select_keys = ["stationId", "timestamp", "aqi"] + [f for f in requested if f in FIELD_MAP]

    raw = df[select_cols].to_dict("records")
    out = []
    for row in raw:
        rec = {
            "stationId": row["Station"],
            "timestamp": row["Timestamp"].isoformat(),
            "aqi":       int(row["aqi"]) if pd.notna(row["aqi"]) else None,
        }
        for f, csv_col in zip([f for f in requested if f in FIELD_MAP], needed_csv_cols):
            rec[f] = float(row[csv_col]) if pd.notna(row[csv_col]) else None
        out.append(rec)
    return out


@app.post("/predict", tags=["ml"])
def predict_aqi(inp: PredictionInput):
    if not _models:
        raise HTTPException(503, "Models not loaded")
    model_id = _resolve_model(inp.model_id)
    return _run_prediction(inp, model_id)


@app.post("/explain", tags=["ml"])
def explain_prediction(inp: PredictionInput):
    if not _models:
        raise HTTPException(503, "Models not loaded")

    model_id = _resolve_model(inp.model_id)
    explainer = _explainers.get(model_id)
    if explainer is None:
        raise HTTPException(422, f"SHAP explanations not available for model '{model_id}'")

    pipeline = _models[model_id]
    feat_df  = _build_feature_row(inp)

    # Run through imputer step only before SHAP (SHAP operates on the raw estimator)
    imputer   = pipeline.named_steps["imputer"]
    X_imputed = imputer.transform(feat_df)
    sv        = explainer.shap_values(X_imputed)[0]

    result = [
        {"feature": DISPLAY_NAMES.get(col, col), "impact": round(float(v), 4)}
        for col, v in zip(MODEL_FEATURES, sv)
    ]
    result.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return result


@app.post("/simulate", tags=["ml"])
def simulate_intervention(body: SimulationInput):
    if not _models:
        raise HTTPException(503, "Models not loaded")

    model_id  = _resolve_model(body.model_id or body.base.model_id)
    base_dict = body.base.model_dump()
    base_aqi  = _run_prediction(body.base, model_id)["aqi"]

    # User-defined reduction
    field_map = {"pm25":"pm25","pm10":"pm10","no2":"no2","o3":"o3","co":"co","so2":"so2","nh3":"nh3"}
    reduced = dict(base_dict)
    for key, pct in body.reductions.items():
        if key in field_map and reduced.get(key) is not None:
            reduced[key] = reduced[key] * (1 - pct / 100.0)
    after_aqi = _run_prediction(PredictionInput(**reduced), model_id)["aqi"]

    def _scenario_aqi(**overrides):
        d = {**base_dict, **overrides}
        return _run_prediction(PredictionInput(**d), model_id)["aqi"]

    scenarios = [
        {"name": "Current",                  "description": "No interventions",                             "baseAqi": base_aqi, "newAqi": base_aqi,                                                                  "adjustments": {}},
        {"name": "Reduce Vehicle Emissions", "description": "20% cut in PM2.5 and NO₂",                    "baseAqi": base_aqi, "newAqi": _scenario_aqi(pm25=base_dict["pm25"]*0.80, no2=base_dict["no2"]*0.80),    "adjustments": {"pm25":20,"no2":20}},
        {"name": "Reduce Dust & Construction","description": "30% cut in PM10",                             "baseAqi": base_aqi, "newAqi": _scenario_aqi(pm10=base_dict["pm10"]*0.70),                               "adjustments": {"pm10":30}},
        {"name": "Combined Intervention",    "description": "Aggressive 30% cut across PM2.5, PM10, NO₂",  "baseAqi": base_aqi, "newAqi": _scenario_aqi(pm25=base_dict["pm25"]*0.70, pm10=base_dict["pm10"]*0.70, no2=base_dict["no2"]*0.70), "adjustments": {"pm25":30,"pm10":30,"no2":30}},
    ]

    return {
        "result": {"before": base_aqi, "after": after_aqi, "improvementPct": round(((base_aqi - after_aqi) / max(1, base_aqi)) * 100, 1)},
        "scenarios": scenarios,
    }


@app.get("/model-metrics", tags=["ml"])
def get_model_metrics():
    """Live metrics from the model registry (updated by retrain.py)."""
    return [
        {"model": meta["label"], "mae": meta["mae"], "rmse": meta["rmse"], "r2": meta["r2"]}
        for meta in MODEL_REGISTRY.values()
    ]
