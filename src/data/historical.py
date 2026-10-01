"""
Historical Atmospheric Telemetry & Statistical Projections
===========================================================
Data retrieval, temporal filtering, time-series resampling, and multi-year
atmospheric trend projection algorithms for Bengaluru monitoring stations.
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from ..models.aqi_standards import aqi_to_category, pm25_to_aqi

# Station geographical coordinates and registry
STATIONS: Dict[str, Dict[str, Any]] = {
    "btm":       {"id": "btm",       "name": "BTM Layout",  "lat": 12.9165, "lng": 77.6101},
    "jayanagar": {"id": "jayanagar", "name": "Jayanagar",   "lat": 12.9299, "lng": 77.5824},
    "silkboard": {"id": "silkboard", "name": "Silk Board",  "lat": 12.9172, "lng": 77.6228},
    "peenya":    {"id": "peenya",    "name": "Peenya",      "lat": 13.0329, "lng": 77.5274},
}

FIELD_MAP: Dict[str, str] = {
    "pm25":      "PM2.5 (µg/m³)",
    "pm10":      "PM10 (µg/m³)",
    "no2":       "NO2 (µg/m³)",
    "o3":        "Ozone (µg/m³)",
    "co":        "CO (mg/m³)",
    "so2":       "SO2 (µg/m³)",
    "nh3":       "NH3 (µg/m³)",
    "temp":      "AT (°C)",
    "rh":        "RH (%)",
    "ws":        "WS (m/s)",
    "wd":        "WD (deg)",
    "rf":        "TOT-RF (mm)",
}

SEASON_MONTHS: Dict[str, List[int]] = {
    "winter":       [12, 1, 2],
    "summer":       [3, 4, 5],
    "monsoon":      [6, 7, 8, 9],
    "post_monsoon": [10, 11],
}


class HistoricalDataManager:
    """
    Manages historical atmospheric observations and statistical trend forecasts.
    """

    def __init__(self, df: Optional[pd.DataFrame] = None):
        self.df = df

    @classmethod
    def from_csv(cls, csv_path: Path) -> "HistoricalDataManager":
        if not csv_path.exists():
            return cls(pd.DataFrame())

        df = pd.read_csv(csv_path, parse_dates=["Timestamp"])
        raw_cols = df.columns.tolist()
        if len(raw_cols) >= 12:
            clean_map = {
                raw_cols[1]:  "PM2.5 (µg/m³)", raw_cols[2]:  "PM10 (µg/m³)",
                raw_cols[3]:  "NO (µg/m³)",     raw_cols[4]:  "NO2 (µg/m³)",
                raw_cols[5]:  "NOx (ppb)",      raw_cols[6]:  "NH3 (µg/m³)",
                raw_cols[7]:  "SO2 (µg/m³)",    raw_cols[8]:  "CO (mg/m³)",
                raw_cols[9]:  "Ozone (µg/m³)",  raw_cols[10]: "Benzene (µg/m³)",
                raw_cols[11]: "Toluene (µg/m³)",
            }
            df = df.rename(columns=clean_map)
        df["aqi"] = df["PM2.5 (µg/m³)"].apply(lambda x: pm25_to_aqi(x) if pd.notna(x) else None)
        return cls(df)

    def get_available_years(self) -> List[int]:
        if self.df is None or self.df.empty:
            return []
        return sorted(self.df["Timestamp"].dt.year.unique().tolist())

    def query(
        self,
        station_id: Optional[str] = None,
        days: int = 30,
        year: Optional[int] = None,
        month: Optional[int] = None,
        fields: Optional[str] = None,
        resample: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if self.df is None or self.df.empty:
            return []

        df = self.df
        if station_id:
            df = df[df["Station"] == station_id]

        if year is not None:
            df = df[df["Timestamp"].dt.year == year]
        if month is not None:
            df = df[df["Timestamp"].dt.month == month]
        if year is None:
            cutoff = df["Timestamp"].max() - timedelta(days=days)
            df = df[df["Timestamp"] >= cutoff]

        requested = [f.strip() for f in fields.split(",")] if fields else list(FIELD_MAP.keys())
        needed_csv_cols = [FIELD_MAP[f] for f in requested if f in FIELD_MAP]

        if resample and not df.empty:
            rule = "D" if resample.lower() in ("daily", "d") else resample
            numeric_cols = [c for c in ["aqi"] + needed_csv_cols if c in df.columns]
            df = (
                df.set_index("Timestamp")
                .groupby("Station")[numeric_cols]
                .resample(rule)
                .mean(numeric_only=True)
                .reset_index()
            )

        df = df.sort_values("Timestamp")
        select_cols = ["Station", "Timestamp", "aqi"] + [c for c in needed_csv_cols if c in df.columns]

        raw = df[select_cols].to_dict("records")
        out = []
        for row in raw:
            rec = {
                "stationId": row["Station"],
                "timestamp": row["Timestamp"].isoformat() if hasattr(row["Timestamp"], "isoformat") else str(row["Timestamp"]),
                "aqi": int(round(row["aqi"])) if pd.notna(row["aqi"]) else None,
            }
            for f, csv_col in zip([f for f in requested if f in FIELD_MAP], needed_csv_cols):
                val = row.get(csv_col)
                rec[f] = round(float(val), 2) if pd.notna(val) else None
            out.append(rec)
        return out

    def get_annual_projections(
        self,
        station_id: Optional[str] = None,
        season: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if self.df is None or self.df.empty:
            return []

        df = self.df.copy()
        if station_id:
            df = df[df["Station"] == station_id]

        if season and season.lower() in SEASON_MONTHS:
            months = SEASON_MONTHS[season.lower()]
            df = df[df["Timestamp"].dt.month.isin(months)]

        df["Year"] = df["Timestamp"].dt.year
        historical_years = sorted([y for y in df["Year"].unique() if 2019 <= y <= 2025])

        records = []
        hist_stats = []

        for y in historical_years:
            sub = df[df["Year"] == y]
            pm25 = float(sub["PM2.5 (µg/m³)"].mean()) if "PM2.5 (µg/m³)" in sub else np.nan
            pm10 = float(sub["PM10 (µg/m³)"].mean()) if "PM10 (µg/m³)" in sub else np.nan
            no2 = float(sub["NO2 (µg/m³)"].mean()) if "NO2 (µg/m³)" in sub else np.nan
            temp = float(sub["AT (°C)"].mean()) if "AT (°C)" in sub else np.nan
            rh = float(sub["RH (%)"].mean()) if "RH (%)" in sub else np.nan
            aqi_val = float(sub["aqi"].mean()) if "aqi" in sub and sub["aqi"].notna().any() else np.nan

            aqi_int = int(round(aqi_val)) if not np.isnan(aqi_val) else (pm25_to_aqi(pm25) if not np.isnan(pm25) else 0)

            entry = {
                "year": int(y),
                "type": "actual",
                "pm25": round(pm25, 1) if not np.isnan(pm25) else None,
                "pm10": round(pm10, 1) if not np.isnan(pm10) else None,
                "no2": round(no2, 1) if not np.isnan(no2) else None,
                "temp": round(temp, 1) if not np.isnan(temp) else None,
                "rh": round(rh, 1) if not np.isnan(rh) else None,
                "aqi": aqi_int,
                "category": aqi_to_category(aqi_int),
            }
            records.append(entry)
            hist_stats.append(entry)

        future_years = [2026, 2027, 2028, 2029]

        def _forecast_metric(key: str, min_val: float, max_val: float) -> Dict[int, Optional[float]]:
            vals = [e[key] for e in hist_stats if e.get(key) is not None]
            ys = [e["year"] for e in hist_stats if e.get(key) is not None]
            if len(vals) < 2:
                return {fy: None for fy in future_years}
            slope, intercept = np.polyfit(ys, vals, 1)
            preds = {}
            for fy in future_years:
                val = slope * fy + intercept
                preds[fy] = round(float(np.clip(val, min_val, max_val)), 1)
            return preds

        pm25_preds = _forecast_metric("pm25", 10.0, 100.0)
        pm10_preds = _forecast_metric("pm10", 20.0, 200.0)
        no2_preds = _forecast_metric("no2", 5.0, 80.0)
        temp_preds = _forecast_metric("temp", 15.0, 35.0)
        rh_preds = _forecast_metric("rh", 40.0, 95.0)

        for fy in future_years:
            pred_pm25 = pm25_preds[fy]
            pred_aqi = pm25_to_aqi(pred_pm25) if pred_pm25 is not None else 50
            records.append({
                "year": int(fy),
                "type": "projected",
                "pm25": pred_pm25,
                "pm10": pm10_preds[fy],
                "no2": no2_preds[fy],
                "temp": temp_preds[fy],
                "rh": rh_preds[fy],
                "aqi": pred_aqi,
                "category": aqi_to_category(pred_aqi),
            })

        return records
