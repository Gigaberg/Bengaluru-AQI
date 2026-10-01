"""
Evaluation Package
==================
Regression benchmarking, baseline comparisons, and tiered performance analysis.
"""

from .metrics import (
    calculate_regression_metrics,
    evaluate_predictions_by_level,
    evaluate_persistence_baseline,
)

__all__ = [
    "calculate_regression_metrics",
    "evaluate_predictions_by_level",
    "evaluate_persistence_baseline",
]
