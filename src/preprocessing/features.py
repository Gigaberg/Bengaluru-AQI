"""
Feature Definitions and Engineering for Bengaluru AQI Models
=============================================================
Defines standard feature columns, human-readable display names,
default baseline medians, and time-series feature engineering helpers.
"""

from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

# The canonical 25 features expected by the trained ML models
MODEL_FEATURES: List[str] = [
    "PM2.5 (µg/m³)", "PM10 (µg/m³)", "NO (µg/m³)", "NO2 (µg/m³)",
    "NOx (ppb)", "NH3 (µg/m³)", "SO2 (µg/m³)", "CO (mg/m³)",
    "Ozone (µg/m³)", "Benzene (µg/m³)", "Toluene (µg/m³)",
    "AT (°C)", "RH (%)", "WS (m/s)", "WD (deg)", "TOT-RF (mm)", "BP (mmHg)",
    "Hour", "DayOfWeek", "Month", "Day",
    "PM25_lag_1h", "PM25_lag_3h", "PM25_lag_6h", "PM25_lag_24h",
]

TARGET_DIRECT: str = "PM25_next_1h"

# Display names for UI, SHAP explanations, and reporting
DISPLAY_NAMES: Dict[str, str] = {
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
    "AT (°C)":         "Temperature",
    "RH (%)":          "Humidity",
    "WS (m/s)":        "Wind Speed",
    "WD (deg)":        "Wind Direction",
    "TOT-RF (mm)":     "Rainfall",
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

# Empirical training-set medians used for imputation and fallback
DEFAULT_MEDIANS: Dict[str, float] = {
    "no": 3.38,
    "no2": 20.55,
    "nox": 19.48,
    "nh3": 11.48,
    "so2": 5.10,
    "co": 0.69,
    "o3": 27.25,
    "benzene": 0.30,
    "toluene": 1.27,
    "temp": 24.5,
    "rh": 70.0,
    "ws": 1.2,
    "wd": 180.0,
    "rf": 0.0,
    "bp": 1000.0,
}


def build_time_features(df: pd.DataFrame, timestamp_col: str = "Timestamp") -> pd.DataFrame:
    """
    Extract calendar and cyclical temporal attributes from timestamp column.
    """
    data = df.copy()
    ts = pd.to_datetime(data[timestamp_col])
    data["Hour"] = ts.dt.hour
    data["DayOfWeek"] = ts.dt.dayofweek
    data["Month"] = ts.dt.month
    data["Day"] = ts.dt.day
    data["Year"] = ts.dt.year
    return data


def generate_lag_features(
    df: pd.DataFrame,
    station_col: str = "Station",
    target_pollutant: str = "PM2.5 (µg/m³)",
    lags: List[int] = [1, 3, 6, 24],
) -> pd.DataFrame:
    """
    Create historical lag features for a pollutant partitioned by monitoring station.
    """
    data = df.copy()
    for lag in lags:
        col_name = f"PM25_lag_{lag}h"
        data[col_name] = data.groupby(station_col)[target_pollutant].shift(lag)
    return data


def generate_target_column(
    df: pd.DataFrame,
    station_col: str = "Station",
    target_pollutant: str = "PM2.5 (µg/m³)",
    lead: int = 1,
) -> pd.DataFrame:
    """
    Create next-step prediction target partitioned by station.
    """
    data = df.copy()
    data[TARGET_DIRECT] = data.groupby(station_col)[target_pollutant].shift(-lead)
    return data
