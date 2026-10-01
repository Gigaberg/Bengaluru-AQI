"""
Production AQI Predictor & Policy Simulation Engine
====================================================
Loads pre-trained model pipelines, constructs standardized feature vectors,
computes multi-model predictions, confidence intervals, and policy simulation matrices.
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import pickle
import numpy as np
import pandas as pd

from ..models.aqi_standards import aqi_to_category, pm25_to_aqi
from ..models.registry import MODEL_REGISTRY
from ..preprocessing.features import DEFAULT_MEDIANS, MODEL_FEATURES


class AQIPredictor:
    """
    Inference and policy simulation engine for Bengaluru AQI models.
    """

    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self.models: Dict[str, Any] = {}
        self.load_models()

    def load_models(self) -> None:
        """
        Load all available model pipelines from models_dir based on MODEL_REGISTRY.
        """
        for model_id, meta in MODEL_REGISTRY.items():
            pkl_path = self.models_dir / meta["pkl"]
            if not pkl_path.exists():
                continue
            try:
                with open(pkl_path, "rb") as f:
                    pipeline = pickle.load(f)
                self.models[model_id] = pipeline
            except Exception as e:
                print(f"[AQIPredictor] Warning: Failed to load {model_id}: {e}")

    def get_available_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": mid,
                "label": meta["label"],
                "description": meta["description"],
                "approach": meta["approach"],
                "r2": meta["r2"],
                "mae": meta["mae"],
                "rmse": meta["rmse"],
                "default": meta.get("default", False),
                "recommended": meta.get("recommended", False),
            }
            for mid, meta in MODEL_REGISTRY.items()
            if mid in self.models
        ]

    def resolve_model(self, model_id: Optional[str] = None) -> str:
        """
        Return an available model_id, falling back to default or first available.
        """
        if model_id and model_id in self.models:
            return model_id
        for mid, meta in MODEL_REGISTRY.items():
            if meta.get("default") and mid in self.models:
                return mid
        if self.models:
            return next(iter(self.models))
        raise RuntimeError("No trained models are loaded in AQIPredictor.")

    def build_feature_row(self, inputs: Dict[str, Any], timestamp: Optional[datetime] = None) -> pd.DataFrame:
        """
        Assemble the standardized 25-feature row expected by the models.
        """
        now = timestamp or datetime.now()
        pm25 = float(inputs.get("pm25", 0.0))
        pm10 = float(inputs.get("pm10", 0.0))

        row = {
            "PM2.5 (µg/m³)":   pm25,
            "PM10 (µg/m³)":    pm10,
            "NO (µg/m³)":      inputs.get("no") if inputs.get("no") is not None else DEFAULT_MEDIANS["no"],
            "NO2 (µg/m³)":     inputs.get("no2") if inputs.get("no2") is not None else DEFAULT_MEDIANS["no2"],
            "NOx (ppb)":       inputs.get("nox") if inputs.get("nox") is not None else DEFAULT_MEDIANS["nox"],
            "NH3 (µg/m³)":     inputs.get("nh3") if inputs.get("nh3") is not None else DEFAULT_MEDIANS["nh3"],
            "SO2 (µg/m³)":     inputs.get("so2") if inputs.get("so2") is not None else DEFAULT_MEDIANS["so2"],
            "CO (mg/m³)":      inputs.get("co") if inputs.get("co") is not None else DEFAULT_MEDIANS["co"],
            "Ozone (µg/m³)":   inputs.get("o3") if inputs.get("o3") is not None else DEFAULT_MEDIANS["o3"],
            "Benzene (µg/m³)": inputs.get("benzene") if inputs.get("benzene") is not None else DEFAULT_MEDIANS["benzene"],
            "Toluene (µg/m³)": inputs.get("toluene") if inputs.get("toluene") is not None else DEFAULT_MEDIANS["toluene"],
            "AT (°C)":         inputs.get("temp") if inputs.get("temp") is not None else DEFAULT_MEDIANS["temp"],
            "RH (%)":          inputs.get("rh") if inputs.get("rh") is not None else DEFAULT_MEDIANS["rh"],
            "WS (m/s)":        inputs.get("ws") if inputs.get("ws") is not None else DEFAULT_MEDIANS["ws"],
            "WD (deg)":        inputs.get("wd") if inputs.get("wd") is not None else DEFAULT_MEDIANS["wd"],
            "TOT-RF (mm)":     inputs.get("rf") if inputs.get("rf") is not None else DEFAULT_MEDIANS["rf"],
            "BP (mmHg)":       inputs.get("bp") if inputs.get("bp") is not None else DEFAULT_MEDIANS["bp"],
            "Hour":            now.hour,
            "DayOfWeek":       now.weekday(),
            "Month":           now.month,
            "Day":             now.day,
            "PM25_lag_1h":     inputs.get("pm25_lag_1h") if inputs.get("pm25_lag_1h") is not None else pm25,
            "PM25_lag_3h":     inputs.get("pm25_lag_3h") if inputs.get("pm25_lag_3h") is not None else pm25,
            "PM25_lag_6h":     inputs.get("pm25_lag_6h") if inputs.get("pm25_lag_6h") is not None else pm25,
            "PM25_lag_24h":    inputs.get("pm25_lag_24h") if inputs.get("pm25_lag_24h") is not None else pm25,
        }
        return pd.DataFrame([row], columns=MODEL_FEATURES)

    def predict(self, inputs: Dict[str, Any], model_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Run forward inference for PM2.5 and AQI sub-index.
        """
        resolved_id = self.resolve_model(model_id)
        pipeline = self.models[resolved_id]
        meta = MODEL_REGISTRY[resolved_id]
        feat_df = self.build_feature_row(inputs)

        raw = float(pipeline.predict(feat_df)[0])
        pm25_input = float(inputs.get("pm25", 0.0))

        if meta["approach"] == "change":
            pm25_pred = max(0.0, pm25_input + raw)
        else:
            pm25_pred = max(0.0, raw)

        aqi = pm25_to_aqi(pm25_pred)
        category = aqi_to_category(aqi)
        aqi_lo = pm25_to_aqi(max(0.0, pm25_pred * 0.90))
        aqi_hi = pm25_to_aqi(min(500.0, pm25_pred * 1.10))

        return {
            "aqi": aqi,
            "category": category,
            "model": meta["label"],
            "model_id": resolved_id,
            "pm25_pred": round(pm25_pred, 2),
            "confidence": [aqi_lo, aqi_hi],
        }

    def simulate_scenarios(
        self,
        base_inputs: Dict[str, Any],
        custom_reductions: Dict[str, float],
        model_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Simulate custom emissions reductions and pre-defined policy scenarios.
        """
        resolved_id = self.resolve_model(model_id)
        base_pred = self.predict(base_inputs, resolved_id)
        base_aqi = base_pred["aqi"]

        # Apply custom percentage reductions
        reduced = dict(base_inputs)
        supported_pollutants = ["pm25", "pm10", "no2", "o3", "co", "so2", "nh3"]
        for poll, pct in custom_reductions.items():
            if poll in supported_pollutants and reduced.get(poll) is not None:
                reduced[poll] = reduced[poll] * (1.0 - (pct / 100.0))

        after_pred = self.predict(reduced, resolved_id)
        after_aqi = after_pred["aqi"]

        def _scenario_aqi(**overrides) -> int:
            d = {**base_inputs, **overrides}
            return self.predict(d, resolved_id)["aqi"]

        base_pm25 = float(base_inputs.get("pm25", 0.0))
        base_pm10 = float(base_inputs.get("pm10", 0.0))
        base_no2 = float(base_inputs.get("no2") or DEFAULT_MEDIANS["no2"])

        scenarios = [
            {
                "name": "Current",
                "description": "No interventions",
                "baseAqi": base_aqi,
                "newAqi": base_aqi,
                "adjustments": {},
            },
            {
                "name": "Reduce Vehicle Emissions",
                "description": "20% cut in PM2.5 and NO₂",
                "baseAqi": base_aqi,
                "newAqi": _scenario_aqi(pm25=base_pm25 * 0.80, no2=base_no2 * 0.80),
                "adjustments": {"pm25": 20, "no2": 20},
            },
            {
                "name": "Reduce Dust & Construction",
                "description": "30% cut in PM10",
                "baseAqi": base_aqi,
                "newAqi": _scenario_aqi(pm10=base_pm10 * 0.70),
                "adjustments": {"pm10": 30},
            },
            {
                "name": "Combined Intervention",
                "description": "Aggressive 30% cut across PM2.5, PM10, NO₂",
                "baseAqi": base_aqi,
                "newAqi": _scenario_aqi(pm25=base_pm25 * 0.70, pm10=base_pm10 * 0.70, no2=base_no2 * 0.70),
                "adjustments": {"pm25": 30, "pm10": 30, "no2": 30},
            },
        ]

        improvement_pct = round(((base_aqi - after_aqi) / max(1, base_aqi)) * 100, 1)

        return {
            "result": {
                "before": base_aqi,
                "after": after_aqi,
                "improvementPct": improvement_pct,
            },
            "scenarios": scenarios,
        }
