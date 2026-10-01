"""
Model Evaluation and Error Diagnostics
=======================================
Performance calculation functions for continuous atmospheric regressors,
including regression statistics (RMSE, MAE, R²) and tiered air quality bin analysis.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def calculate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """
    Compute standard continuous regression benchmark statistics.
    """
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
    }


def evaluate_predictions_by_level(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    thresholds: Optional[List[Tuple[float, float, str]]] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluate regression performance across PM2.5 severity levels.
    """
    if thresholds is None:
        thresholds = [
            (0.0, 30.0, "0-30 (Good)"),
            (30.0, 60.0, "30-60 (Satisfactory)"),
            (60.0, 90.0, "60-90 (Moderate)"),
            (90.0, 120.0, "90-120 (Poor)"),
            (120.0, 250.0, "120-250 (Very Poor)"),
            (250.0, float("inf"), ">250 (Severe)"),
        ]

    results = []
    y_true_arr = np.asarray(y_true)
    y_pred_arr = np.asarray(y_pred)

    for low, high, label in thresholds:
        mask = (y_true_arr >= low) & (y_true_arr < high)
        n = int(np.sum(mask))
        if n == 0:
            continue
        mae = float(mean_absolute_error(y_true_arr[mask], y_pred_arr[mask]))
        rmse = float(np.sqrt(mean_squared_error(y_true_arr[mask], y_pred_arr[mask])))
        results.append({
            "tier": label,
            "count": n,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
        })

    return results


def evaluate_persistence_baseline(
    y_current: np.ndarray,
    y_next: np.ndarray,
) -> Dict[str, float]:
    """
    Evaluate the naive persistence baseline (predicting next hour equals current hour).
    """
    return calculate_regression_metrics(y_next, y_current)
