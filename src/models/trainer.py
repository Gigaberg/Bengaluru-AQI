"""
Model Training Pipelines and Factory Functions
==============================================
Defines scikit-learn and XGBoost training workflows for both Direct PM2.5 forecasting
and Change/Delta prediction architectures.
"""

from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import pickle
import numpy as np
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor, ExtraTreesRegressor
from xgboost import XGBRegressor


def build_pipeline(estimator: Any) -> Pipeline:
    """
    Wrap an estimator with a median imputer for missing input imputation.
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", estimator),
    ])


def create_direct_estimator(model_type: str = "xgboost", **kwargs) -> Any:
    """
    Instantiate an estimator configured for direct PM2.5 prediction.
    """
    if model_type == "xgboost":
        params = {"n_estimators": 150, "max_depth": 6, "learning_rate": 0.08, "n_jobs": -1, "random_state": 42}
        params.update(kwargs)
        return XGBRegressor(**params)
    elif model_type == "random_forest":
        params = {"n_estimators": 100, "max_depth": 12, "n_jobs": -1, "random_state": 42}
        params.update(kwargs)
        return RandomForestRegressor(**params)
    else:
        raise ValueError(f"Unsupported direct model type: '{model_type}'")


def create_change_estimator(model_type: str = "hist_gradient_boosting", **kwargs) -> Any:
    """
    Instantiate an estimator configured for PM2.5 change (delta) prediction.
    """
    if model_type == "hist_gradient_boosting":
        params = {"max_iter": 150, "max_depth": 8, "learning_rate": 0.08, "random_state": 42}
        params.update(kwargs)
        return HistGradientBoostingRegressor(**params)
    elif model_type == "random_forest":
        params = {"n_estimators": 100, "max_depth": 12, "n_jobs": -1, "random_state": 42}
        params.update(kwargs)
        return RandomForestRegressor(**params)
    elif model_type == "extra_trees":
        params = {"n_estimators": 100, "max_depth": 12, "n_jobs": -1, "random_state": 42}
        params.update(kwargs)
        return ExtraTreesRegressor(**params)
    else:
        raise ValueError(f"Unsupported change model type: '{model_type}'")


def train_model(
    model_type: str,
    approach: str,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    **kwargs,
) -> Pipeline:
    """
    Train a complete ML pipeline on feature matrix and target series.
    
    Args:
        model_type: Model algorithm identifier ('xgboost', 'random_forest', 'hist_gradient_boosting', 'extra_trees').
        approach: Prediction strategy ('direct' or 'change').
        X_train: Training feature DataFrame.
        y_train: Training target series.
        **kwargs: Optional hyperparameter overrides.
        
    Returns:
        Fitted scikit-learn Pipeline.
    """
    if approach == "direct":
        estimator = create_direct_estimator(model_type, **kwargs)
    elif approach == "change":
        estimator = create_change_estimator(model_type, **kwargs)
    else:
        raise ValueError(f"Approach must be 'direct' or 'change', got '{approach}'")

    pipeline = build_pipeline(estimator)
    pipeline.fit(X_train, y_train)
    return pipeline


def save_pipeline(pipeline: Pipeline, output_path: Path) -> None:
    """
    Serialize fitted pipeline to disk.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        pickle.dump(pipeline, f)
