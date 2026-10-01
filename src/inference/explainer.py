"""
Explainable AI (XAI) & SHAP Attribution Engine
===============================================
Generates local SHAP feature attributions for tree-based ensemble models
(XGBoost, Random Forest, HistGradientBoosting).
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
import shap

from ..preprocessing.features import DISPLAY_NAMES, MODEL_FEATURES


class SHAPExplainer:
    """
    Manages SHAP tree explainers for trained models.
    """

    def __init__(self, models: Dict[str, Any]):
        self.explainers: Dict[str, Any] = {}
        self._initialize_explainers(models)

    def _initialize_explainers(self, models: Dict[str, Any]) -> None:
        for model_id, pipeline in models.items():
            try:
                estimator = pipeline.named_steps.get("model")
                if estimator is not None:
                    self.explainers[model_id] = shap.TreeExplainer(estimator)
            except Exception as e:
                print(f"[SHAPExplainer] Warning: Could not create TreeExplainer for {model_id}: {e}")

    def is_available(self, model_id: str) -> bool:
        return model_id in self.explainers

    def explain(self, model_id: str, pipeline: Any, feature_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Compute SHAP values for a single input row.
        """
        if model_id not in self.explainers:
            raise ValueError(f"SHAP explainer not available for model '{model_id}'")

        explainer = self.explainers[model_id]
        imputer = pipeline.named_steps["imputer"]
        X_imputed = imputer.transform(feature_df)
        
        shap_vals = explainer.shap_values(X_imputed)[0]

        contributions = [
            {
                "feature": DISPLAY_NAMES.get(col, col),
                "impact": round(float(val), 4),
            }
            for col, val in zip(MODEL_FEATURES, shap_vals)
        ]
        contributions.sort(key=lambda item: abs(item["impact"]), reverse=True)
        return contributions
