import pandas as pd
import pathlib

# Paths
BASE = pathlib.Path(__file__).parent
DATA = BASE / "data"
RAW = BASE.parent.parent / "data" / "RAW"

# File mapping
file_mapping = {
    "raw_data_hourly_btm_layout,_bengaluru_-_cpcb_1H (1).csv": "btm",
    "raw_data_hourly_jayanagar_5th_block,_bengaluru_-_kspcb_1H.csv": "jayanagar",
    "raw_data_hourly_peenya,_bengaluru_-_cpcb_1H.csv": "peenya",
    "raw_data_hourly_silk_board,_bengaluru_-_kspcb_1H.csv": "silkboard"
}

# 1. Read and combine raw 2025 files
dfs = []
for file, station in file_mapping.items():
    print(f"Reading {file} -> {station}...")
    df = pd.read_csv(RAW / file)
    df["Station"] = station
    df["Year"] = 2025
    df["Source_File"] = file
    dfs.append(df)

df_2025 = pd.concat(dfs, ignore_index=True)

# Clean Timestamp
df_2025["Timestamp"] = pd.to_datetime(df_2025["Timestamp"], errors="coerce")
df_2025 = df_2025.dropna(subset=["Timestamp"]).sort_values(["Station", "Timestamp"])

# 2. Append to Master
print("Loading master...")
master = pd.read_csv(DATA / "bengaluru_master_unprocessed.csv")
master["Timestamp"] = pd.to_datetime(master["Timestamp"], errors="coerce")

# Drop any existing 2025 data just in case
master = master[master["Timestamp"].dt.year < 2025]

# Combine
print("Combining master with 2025 data...")
full_master = pd.concat([master, df_2025], ignore_index=True)
full_master = full_master.sort_values(["Station", "Timestamp"]).reset_index(drop=True)

# Save updated master
print("Saving updated master...")
full_master.to_csv(DATA / "bengaluru_master_unprocessed.csv", index=False)

# 3. Feature Engineering for ML
print("Generating features for ML...")
# Create time features
full_master["Hour"] = full_master["Timestamp"].dt.hour
full_master["DayOfWeek"] = full_master["Timestamp"].dt.dayofweek
full_master["Month"] = full_master["Timestamp"].dt.month
full_master["Day"] = full_master["Timestamp"].dt.day

# Create Lag Features (grouped by station)
# Sort to be absolutely sure
full_master = full_master.sort_values(["Station", "Timestamp"]).reset_index(drop=True)

# Shift by 1, 3, 6, 24 hours (assuming 1-hour frequency without gaps for simplicity,
# but we can use shift() since data is usually consecutive hourly)
def create_lags(group):
    # Standardize column name (sometimes unicode differs)
    pm25_col = [c for c in group.columns if "PM2.5" in c][0]
    group["PM25_lag_1h"] = group[pm25_col].shift(1)
    group["PM25_lag_3h"] = group[pm25_col].shift(3)
    group["PM25_lag_6h"] = group[pm25_col].shift(6)
    group["PM25_lag_24h"] = group[pm25_col].shift(24)
    # Target is next 1h
    group["PM25_next_1h"] = group[pm25_col].shift(-1)
    return group

print("Creating lag and target features...")
full_master = full_master.groupby("Station").apply(create_lags).reset_index(drop=True)

# 4. Split and Save Train/Test
print("Splitting datasets...")
train = full_master[full_master["Timestamp"].dt.year <= 2024]
test = full_master[full_master["Timestamp"].dt.year == 2025]

print(f"Train size (2019-2024): {len(train)}")
print(f"Test size (2025): {len(test)}")

train.to_csv(DATA / "bengaluru_train_2019_2024.csv", index=False)
test.to_csv(DATA / "bengaluru_test_2025.csv", index=False)

print("Done processing!")
