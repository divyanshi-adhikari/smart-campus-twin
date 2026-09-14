import pandas as pd

# ---------- Load raw ROBOD data ----------
df = pd.read_csv("combined_Room1.csv")
df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
df = df.sort_values("timestamp").reset_index(drop=True)

# ---------- Build target: occupancy 2 HOURS ahead ----------
# Use timestamp-based merge (exact time match) rather than row shifts
target = df[["timestamp", "occupant_count"]].copy()
target["future_timestamp"] = target["timestamp"] - pd.Timedelta(hours=2)
target = target.rename(columns={"occupant_count": "target_occupancy_2h"})
df = df.merge(
    target[["future_timestamp", "target_occupancy_2h"]],
    left_on="timestamp", right_on="future_timestamp", how="inner"
)

# ---------- Lag features using EXACT TIMESTAMPS (not row shifts) ----------
# This handles gaps correctly — if the exact time doesn't exist, value is NaN
def add_lag(df, minutes, column_name):
    lag_df = df[["timestamp", "occupant_count"]].copy()
    lag_df["lag_timestamp"] = lag_df["timestamp"] + pd.Timedelta(minutes=minutes)
    lag_df = lag_df.rename(columns={"occupant_count": column_name})
    return df.merge(
        lag_df[["lag_timestamp", column_name]],
        left_on="timestamp", right_on="lag_timestamp", how="left"
    ).drop(columns=["lag_timestamp"])

df = add_lag(df, 30, "occupant_count_lag_30min")
df = add_lag(df, 60, "occupant_count_lag_1h")
df = add_lag(df, 120, "occupant_count_lag_2h")

# ---------- Time features ----------
df["hour"] = df["timestamp"].dt.hour
df["day_of_week"] = df["timestamp"].dt.dayofweek
df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

# ---------- Final feature set ----------
features = [
    "timestamp",
    "occupant_count",
    "occupant_count_lag_30min",
    "occupant_count_lag_1h",
    "occupant_count_lag_2h",
    "hour", "day_of_week", "is_weekend",
    "indoor_co2", "air_temperature", "indoor_relative_humidity",
    "sound_pressure_level", "illuminance", "wifi_connected_devices",
    "target_occupancy_2h"
]

train = df[features].dropna().reset_index(drop=True)
train.to_csv("occupancy_training_data.csv", index=False)

print("TRAINING ROWS:", len(train))
print("COLUMNS:", train.columns.tolist())
print()
print(train.head())