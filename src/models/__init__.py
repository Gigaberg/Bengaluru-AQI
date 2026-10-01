"""
Models Package
==============
NAQI standards, model registry, and training pipelines.
"""

from .aqi_standards import PM25_BREAKPOINTS, pm25_to_aqi, aqi_to_category
from .registry import MODEL_REGISTRY
from .trainer import (
    build_pipeline,
    create_direct_estimator,
    create_change_estimator,
    train_model,
    save_pipeline,
)

__all__ = [
    "PM25_BREAKPOINTS",
    "pm25_to_aqi",
    "aqi_to_category",
    "MODEL_REGISTRY",
    "build_pipeline",
    "create_direct_estimator",
    "create_change_estimator",
    "train_model",
    "save_pipeline",
]
