"""
Data Cleaning and Outlier Handling for Environmental Sensor Telemetry
=====================================================================
Detects and filters sensor transmission errors, out-of-range anomalies,
and applies physically plausible bounds to pollutant and meteorological records.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

# Physical plausible limits for ambient environmental measurements in Bengaluru
SENSOR_BOUNDS: Dict[str, Tuple[float, float]] = {
    "PM2.5 (µg/m³)": (0.0, 500.0),
    "PM10 (µg/m³)":  (0.0, 1000.0),
    "NO (µg/m³)":    (0.0, 500.0),
    "NO2 (µg/m³)":   (0.0, 500.0),
    "NOx (ppb)":     (0.0, 500.0),
    "NH3 (µg/m³)":   (0.0, 500.0),
    "SO2 (µg/m³)":   (0.0, 500.0),
    "CO (mg/m³)":    (0.0, 50.0),
    "Ozone (µg/m³)": (0.0, 500.0),
    "AT (°C)":       (5.0, 45.0),
    "RH (%)":        (5.0, 100.0),
    "WS (m/s)":      (0.0, 30.0),
    "BP (mmHg)":     (850.0, 1050.0),
}


def sanitize_sensor_readings(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove known hardware diagnostic codes (e.g., 999.99, -999) and clip out-of-range sensor spikes.
    """
    cleaned = df.copy()

    for col in cleaned.columns:
        if cleaned[col].dtype in [np.float64, np.float32, np.int64, np.int32]:
            # Sensor fault indicator values
            cleaned.loc[cleaned[col] == 999.99, col] = np.nan
            cleaned.loc[cleaned[col] == -999.0, col] = np.nan
            cleaned.loc[cleaned[col] == -99.0, col] = np.nan

            # Apply domain-specific physical boundaries if defined
            if col in SENSOR_BOUNDS:
                lower, upper = SENSOR_BOUNDS[col]
                cleaned.loc[cleaned[col] < lower, col] = np.nan
                cleaned.loc[cleaned[col] > upper, col] = np.nan

    return cleaned


def filter_complete_cases(df: pd.DataFrame, required_cols: List[str]) -> pd.DataFrame:
    """
    Filter DataFrame to records that have valid measurements for required features.
    """
    return df.dropna(subset=required_cols).copy()
