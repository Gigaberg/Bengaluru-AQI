"""
Bengaluru AQI Platform — FastAPI Backend
=========================================
High-performance REST API serving real ML predictions, explainable AI (SHAP),
policy simulations, and historical CPCB atmospheric telemetry.
"""

import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Ensure repository root is on Python module search path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.data.historical import HistoricalDataManager, STATIONS
from src.inference.predictor import AQIPredictor
from src.inference.explainer import SHAPExplainer
from src.models.registry import MODEL_REGISTRY

load_dotenv()

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR.parent / "ml" / "models"
DATA_DIR = BASE_DIR.parent / "ml" / "data"
HIST_CSV = DATA_DIR / "bengaluru_master.csv"

app = FastAPI(
    title="Bengaluru AQI Platform API",
    description="Real ML-powered air quality predictions for Bengaluru",
    version="2.1.0",
)

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
if raw_origins.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global Core Engines
# ---------------------------------------------------------------------------
predictor: Optional[AQIPredictor] = None
explainer: Optional[SHAPExplainer] = None
hist_mgr: Optional[HistoricalDataManager] = None


@app.on_event("startup")
def load_resources():
    global predictor, explainer, hist_mgr
    print("[startup] Initializing ML Predictor & SHAP Explainer …")
    predictor = AQIPredictor(MODELS_DIR)
    explainer = SHAPExplainer(predictor.models)
    print(f"[startup] Loaded {len(predictor.models)} models: {list(predictor.models.keys())}")

    print("[startup] Loading historical telemetry dataset …")
    hist_mgr = HistoricalDataManager.from_csv(HIST_CSV)
    if hist_mgr.df is not None and not hist_mgr.df.empty:
        print(f"[startup] Loaded {len(hist_mgr.df):,} rows across {hist_mgr.df['Station'].nunique()} stations.")


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class PredictionInput(BaseModel):
    pm25:         float           = Field(..., description="PM2.5 (µg/m³) — required")
    pm10:         float           = Field(..., description="PM10 (µg/m³) — required")
    no2:          Optional[float] = Field(None, description="NO2 (µg/m³) — defaults to training median")
    o3:           Optional[float] = Field(None, description="Ozone (µg/m³) — defaults to training median")
    co:           Optional[float] = Field(None, description="CO (mg/m³) — defaults to training median")
    no:           Optional[float] = Field(None, description="NO (µg/m³) — defaults to training median")
    nox:          Optional[float] = Field(None, description="NOx (ppb) — defaults to training median")
    so2:          Optional[float] = Field(None, description="SO2 (µg/m³) — defaults to training median")
    nh3:          Optional[float] = Field(None, description="NH3 (µg/m³) — defaults to training median")
    benzene:      Optional[float] = Field(None, description="Benzene (µg/m³) — defaults to 0.30")
    toluene:      Optional[float] = Field(None, description="Toluene (µg/m³) — defaults to 1.27")
    temp:         Optional[float] = Field(None, description="Temperature (°C) — defaults to 24.5")
    rh:           Optional[float] = Field(None, description="Relative Humidity (%) — defaults to 70.0")
    ws:           Optional[float] = Field(None, description="Wind Speed (m/s) — defaults to 1.2")
    wd:           Optional[float] = Field(None, description="Wind Direction (deg) — defaults to 180.0")
    rf:           Optional[float] = Field(None, description="Rainfall (mm) — defaults to 0.0")
    bp:           Optional[float] = Field(None, description="Barometric Pressure (mmHg) — defaults to 1000.0")
    pm25_lag_1h:  Optional[float] = Field(None, description="PM2.5 1-hour lag — defaults to current pm25")
    pm25_lag_3h:  Optional[float] = Field(None, description="PM2.5 3-hour lag — defaults to current pm25")
    pm25_lag_6h:  Optional[float] = Field(None, description="PM2.5 6-hour lag — defaults to current pm25")
    pm25_lag_24h: Optional[float] = Field(None, description="PM2.5 24-hour lag — defaults to current pm25")
    model_id:     Optional[str]   = Field(None, description="Model to use (default: xgboost_direct)")


class SimulationInput(BaseModel):
    base:       PredictionInput
    reductions: Dict[str, float]
    model_id:   Optional[str] = Field(None, description="Model to use for simulation")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "Bengaluru AQI Platform API", "version": "2.1.0"}


@app.get("/stations", tags=["stations"])
def get_stations():
    return list(STATIONS.values())


@app.get("/models", tags=["ml"])
def list_models():
    """Returns all available ML models and their benchmark metadata."""
    if predictor is None:
        raise HTTPException(503, "Predictor not initialized")
    return predictor.get_available_models()


@app.get("/historical/years", tags=["data"])
def get_available_years():
    if hist_mgr is None:
        raise HTTPException(503, "Historical data not loaded yet")
    return hist_mgr.get_available_years()


@app.get("/historical", tags=["data"])
def get_historical(
    station_id: Optional[str] = Query(None),
    days:       int           = Query(30, ge=1, le=2500),
    year:       Optional[int] = Query(None),
    month:      Optional[int] = Query(None, ge=1, le=12),
    fields:     Optional[str] = Query(None, description="Comma-separated list of fields. Example: aqi,pm25,pm10"),
    resample:   Optional[str] = Query(None, description="Resample frequency. Example: 'daily', 'D', '6h'"),
):
    if hist_mgr is None:
        raise HTTPException(503, "Historical data not loaded yet")
    if station_id and station_id not in STATIONS:
        raise HTTPException(404, f"Unknown station '{station_id}'. Valid: {list(STATIONS.keys())}")
    return hist_mgr.query(
        station_id=station_id,
        days=days,
        year=year,
        month=month,
        fields=fields,
        resample=resample,
    )


@app.post("/predict", tags=["ml"])
def predict_aqi(inp: PredictionInput):
    if predictor is None or not predictor.models:
        raise HTTPException(503, "Models not loaded")
    return predictor.predict(inp.model_dump(), inp.model_id)


@app.post("/explain", tags=["ml"])
def explain_prediction(inp: PredictionInput):
    if predictor is None or explainer is None or not predictor.models:
        raise HTTPException(503, "Models not loaded")

    model_id = predictor.resolve_model(inp.model_id)
    if not explainer.is_available(model_id):
        raise HTTPException(422, f"SHAP explanations not available for model '{model_id}'")

    feat_df = predictor.build_feature_row(inp.model_dump())
    pipeline = predictor.models[model_id]
    return explainer.explain(model_id, pipeline, feat_df)


@app.post("/simulate", tags=["ml"])
def simulate_intervention(body: SimulationInput):
    if predictor is None or not predictor.models:
        raise HTTPException(503, "Models not loaded")
    return predictor.simulate_scenarios(
        base_inputs=body.base.model_dump(),
        custom_reductions=body.reductions,
        model_id=body.model_id or body.base.model_id,
    )


@app.get("/model-metrics", tags=["ml"])
def get_model_metrics():
    """Live metrics from the model registry."""
    return [
        {"model": meta["label"], "mae": meta["mae"], "rmse": meta["rmse"], "r2": meta["r2"]}
        for meta in MODEL_REGISTRY.values()
    ]


@app.get("/projections/annual", tags=["data"])
def get_annual_projections(
    station_id: Optional[str] = Query(None),
    season:     Optional[str] = Query(None, description="Optional season: 'all', 'winter', 'summer', 'monsoon', 'post_monsoon'"),
):
    if hist_mgr is None:
        raise HTTPException(503, "Historical data not loaded yet")
    if station_id and station_id not in STATIONS:
        raise HTTPException(404, f"Unknown station '{station_id}'. Valid: {list(STATIONS.keys())}")
    return hist_mgr.get_annual_projections(station_id=station_id, season=season)
