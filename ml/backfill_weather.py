"""
backfill_weather.py  –  Fill missing weather columns in the master CSV
using free Open-Meteo Historical Weather API (no key required).

Usage:
    python ml/backfill_weather.py

What it does:
  1. Reads  ml/data/bengaluru_master_unprocessed.csv
  2. For each station (lat/lng), fetches hourly weather from Open-Meteo:
     - temperature_2m        → AT (°C)
     - relative_humidity_2m  → RH (%)
     - wind_speed_10m        → WS (m/s)
     - wind_direction_10m    → WD (deg)
     - precipitation         → RF (mm) / TOT-RF (mm)
  3. Fills ONLY null/missing cells (existing CPCB readings are preserved)
  4. Saves to  ml/data/bengaluru_master.csv  (the backfilled version)
"""

import pandas as pd
import requests
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).parent / "data"
INPUT_CSV  = DATA_DIR / "bengaluru_master_unprocessed.csv"
OUTPUT_CSV = DATA_DIR / "bengaluru_master.csv"

STATIONS = {
    "btm":       {"lat": 12.9165, "lng": 77.6101},
    "jayanagar": {"lat": 12.9299, "lng": 77.5824},
    "silkboard": {"lat": 12.9172, "lng": 77.6228},
    "peenya":    {"lat": 13.0329, "lng": 77.5274},
}

# Map: Open-Meteo variable → CSV column name
VARIABLE_MAP = {
    "temperature_2m":       "AT (°C)",
    "relative_humidity_2m": "RH (%)",
    "wind_speed_10m":       "WS (m/s)",
    "wind_direction_10m":   "WD (deg)",
    "precipitation":        "RF (mm)",
}

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

# ---------------------------------------------------------------------------
# Fetch from Open-Meteo
# ---------------------------------------------------------------------------
def fetch_weather(lat: float, lng: float, start: str, end: str) -> pd.DataFrame:
    """Fetch hourly weather data from Open-Meteo for a location and date range."""
    params = {
        "latitude":  lat,
        "longitude": lng,
        "start_date": start,
        "end_date":   end,
        "hourly": ",".join(VARIABLE_MAP.keys()),
        "timezone": "Asia/Kolkata",
    }
    
    print(f"    Fetching {start} to {end} ...")
    resp = requests.get(OPEN_METEO_URL, params=params, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    
    hourly = data["hourly"]
    df = pd.DataFrame({
        "Timestamp": pd.to_datetime(hourly["time"]),
    })
    for om_var, csv_col in VARIABLE_MAP.items():
        df[csv_col] = hourly[om_var]
    
    return df


def fetch_station_weather(station_id: str, lat: float, lng: float,
                          min_date: str, max_date: str) -> pd.DataFrame:
    """
    Fetch weather for a station, chunking into yearly requests
    to stay within Open-Meteo's limits. Caches locally to avoid redundant API calls.
    """
    cache_file = DATA_DIR / f".cache_weather_{station_id}.csv"
    if cache_file.exists():
        print(f"    Loading cached weather from {cache_file.name} ...")
        return pd.read_csv(cache_file, parse_dates=["Timestamp"])

    start = pd.Timestamp(min_date)
    end   = pd.Timestamp(max_date)
    
    chunks = []
    cursor = start
    while cursor <= end:
        year_end = min(pd.Timestamp(f"{cursor.year}-12-31"), end)
        chunk = fetch_weather(
            lat, lng,
            cursor.strftime("%Y-%m-%d"),
            year_end.strftime("%Y-%m-%d"),
        )
        chunks.append(chunk)
        cursor = pd.Timestamp(f"{cursor.year + 1}-01-01")
        time.sleep(0.5)  # be polite to the free API
    
    result = pd.concat(chunks, ignore_index=True)
    result = result.drop_duplicates(subset=["Timestamp"]).sort_values("Timestamp")
    result.to_csv(cache_file, index=False)
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Reading {INPUT_CSV} ...")
    df = pd.read_csv(INPUT_CSV, parse_dates=["Timestamp"])
    print(f"  {len(df):,} rows, {df['Station'].nunique()} stations")
    print(f"  Date range: {df['Timestamp'].min()} to {df['Timestamp'].max()}")
    
    # Show before-state
    weather_cols = list(VARIABLE_MAP.values())
    print("\n=== Missing values BEFORE backfill ===")
    for st in sorted(df["Station"].unique()):
        sub = df[df["Station"] == st]
        print(f"  {st}:")
        for col in weather_cols:
            if col in df.columns:
                missing = sub[col].isna().sum()
                total = len(sub)
                print(f"    {col:15s}: {missing:>6,} / {total:,} missing ({missing/total*100:.1f}%)")
    
    # Backfill each station
    filled_count = 0
    for station_id, coords in STATIONS.items():
        sub = df[df["Station"] == station_id]
        if sub.empty:
            print(f"\n  Skipping {station_id} (no rows)")
            continue
        
        min_date = sub["Timestamp"].min().strftime("%Y-%m-%d")
        max_date = sub["Timestamp"].max().strftime("%Y-%m-%d")
        
        print(f"\n  Fetching weather for {station_id} ({coords['lat']}, {coords['lng']}) ...")
        weather = fetch_station_weather(
            station_id, coords["lat"], coords["lng"], min_date, max_date
        )
        print(f"    Got {len(weather):,} hourly records")
        
        # Merge on Timestamp, fill only NaN cells
        weather_indexed = weather.set_index("Timestamp")
        
        mask = df["Station"] == station_id
        station_rows = df.loc[mask].copy()
        
        for csv_col in weather_cols:
            if csv_col not in df.columns:
                continue
            
            # Look up Open-Meteo value by matching timestamp
            om_values = station_rows["Timestamp"].map(
                lambda ts: weather_indexed.loc[ts, csv_col]
                if ts in weather_indexed.index else None
            )

            # Invalidate physical outliers & malfunctioning sensor readings before filling
            if csv_col == "AT (°C)":
                # In Bengaluru, valid ambient temperatures are ~5°C to 40°C.
                # Sensor hardware clipping (e.g. at 50.0°C), unshielded solar heating,
                # or readings diverging > 7.0°C from reanalysis are sensor glitches.
                anom_mask = (
                    (station_rows[csv_col] > 40.0) |
                    (station_rows[csv_col] < 5.0) |
                    ((station_rows[csv_col] - om_values).abs() > 7.0)
                )
                anom_count = anom_mask.sum()
                if anom_count > 0:
                    print(f"    {csv_col:15s}: detected {anom_count:,} sensor anomalies/outliers — resetting to NaN for replacement")
                    station_rows.loc[anom_mask, csv_col] = None

            before_null = station_rows[csv_col].isna().sum()
            if before_null == 0:
                continue
            
            # Fill only where original is NaN
            fill_mask = station_rows[csv_col].isna() & om_values.notna()
            station_rows.loc[fill_mask, csv_col] = om_values[fill_mask]
            
            after_null = station_rows[csv_col].isna().sum()
            filled = before_null - after_null
            filled_count += filled
            if filled > 0:
                print(f"    {csv_col:15s}: filled {filled:,} gaps ({before_null:,} -> {after_null:,} missing)")
        
        df.loc[mask] = station_rows
    
    # Also backfill TOT-RF from RF if TOT-RF is missing
    if "TOT-RF (mm)" in df.columns and "RF (mm)" in df.columns:
        tot_rf_null = df["TOT-RF (mm)"].isna()
        rf_available = df["RF (mm)"].notna()
        fill_mask = tot_rf_null & rf_available
        df.loc[fill_mask, "TOT-RF (mm)"] = df.loc[fill_mask, "RF (mm)"]
        print(f"\n  TOT-RF (mm): filled {fill_mask.sum():,} from RF (mm)")
        filled_count += fill_mask.sum()
    
    # Show after-state
    print(f"\n=== Missing values AFTER backfill ===")
    for st in sorted(df["Station"].unique()):
        sub = df[df["Station"] == st]
        print(f"  {st}:")
        for col in weather_cols:
            if col in df.columns:
                missing = sub[col].isna().sum()
                total = len(sub)
                print(f"    {col:15s}: {missing:>6,} / {total:,} missing ({missing/total*100:.1f}%)")
    
    print(f"\n  Total cells filled: {filled_count:,}")
    
    # Save
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n  Saved to {OUTPUT_CSV}")
    print(f"  Original preserved at {INPUT_CSV}")


if __name__ == "__main__":
    main()
