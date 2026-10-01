"""
CPCB Station Dataset Loader and Ingestion Utility
=================================================
Utilities for discovering, loading, and merging historical CPCB CSV telemetry files
across monitoring stations in Bengaluru.
"""

from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd
import numpy as np


STATION_ALIASES: Dict[str, str] = {
    "btm": "BTM Layout",
    "jayanagar": "Jayanagar",
    "peenya": "Peenya",
    "silkboard": "Silk Board",
}


def load_station_csv(file_path: Path) -> pd.DataFrame:
    """
    Load a single CPCB station CSV file with normalized timestamp parsing.
    """
    df = pd.read_csv(file_path)
    if "Timestamp" in df.columns:
        df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
    return df


def audit_station_records(df: pd.DataFrame) -> Dict[str, any]:
    """
    Compute telemetry completeness and record counts for an ingested dataset.
    """
    total_records = len(df)
    missing_counts = df.isna().sum().to_dict()
    missing_pct = (df.isna().mean() * 100).round(2).to_dict()
    
    return {
        "total_records": total_records,
        "missing_counts": missing_counts,
        "missing_pct": missing_pct,
        "stations": df["Station"].unique().tolist() if "Station" in df.columns else [],
        "min_time": str(df["Timestamp"].min()) if "Timestamp" in df.columns else None,
        "max_time": str(df["Timestamp"].max()) if "Timestamp" in df.columns else None,
    }


def aggregate_raw_directory(raw_dir: Path) -> pd.DataFrame:
    """
    Load and concatenate all CPCB CSVs in a directory, tagging the station identity.
    """
    all_frames: List[pd.DataFrame] = []
    
    for csv_file in sorted(raw_dir.glob("*.csv")):
        stem = csv_file.stem.lower()
        station_key = None
        for key in STATION_ALIASES:
            if key in stem:
                station_key = key
                break
        
        df = pd.read_csv(csv_file)
        if "Timestamp" in df.columns:
            df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
        df["Station"] = station_key if station_key else stem
        all_frames.append(df)
        
    if not all_frames:
        return pd.DataFrame()
        
    combined = pd.concat(all_frames, ignore_index=True)
    return combined.sort_values(by=["Station", "Timestamp"]).reset_index(drop=True)
