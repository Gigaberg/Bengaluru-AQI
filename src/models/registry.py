"""
Model Registry and Metadata Definitions
========================================
Centralized catalog of production machine learning models, benchmark metrics,
and operational configurations.
"""

from typing import Any, Dict

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
