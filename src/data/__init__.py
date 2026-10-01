"""
Data Ingestion and Management Package
======================================
Loaders for CPCB monitoring datasets and historical time-series management.
"""

from .cpcb_loader import load_station_csv, audit_station_records, aggregate_raw_directory
from .historical import HistoricalDataManager, STATIONS, FIELD_MAP, SEASON_MONTHS

__all__ = [
    "load_station_csv",
    "audit_station_records",
    "aggregate_raw_directory",
    "HistoricalDataManager",
    "STATIONS",
    "FIELD_MAP",
    "SEASON_MONTHS",
]
