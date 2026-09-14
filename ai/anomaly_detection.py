import pandas as pd
import numpy as np

# ---------- Load dataset ----------
df = pd.read_csv("dataset/combined_Room1.csv")

# ---------- Prepare data ----------
df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
df = df.sort_values("timestamp").reset_index(drop=True)

# Remove missing occupancy values
df = df.dropna(subset=["occupant_count"]).copy()

# ---------- Detect occupancy anomalies ----------
# Use rolling statistics so an observation is compared
# with the recent normal occupancy pattern.

window = 12  # 12 × 5-minute records = 1 hour

df["rolling_mean"] = (
    df["occupant_count"]
    .rolling(window=window, min_periods=6)
    .mean()
)

df["rolling_std"] = (
    df["occupant_count"]
    .rolling(window=window, min_periods=6)
    .std()
)

# Avoid zero standard deviation
df["rolling_std"] = df["rolling_std"].replace(0, np.nan)

# Z-score
df["z_score"] = (
    (df["occupant_count"] - df["rolling_mean"])
    / df["rolling_std"]
)

# Anomaly threshold
threshold = 3.0

df["is_anomaly"] = df["z_score"].abs() >= threshold

# ---------- Results ----------
anomalies = df[df["is_anomaly"]].copy()

print("=" * 60)
print("SMART CAMPUS TWIN — ANOMALY DETECTION")
print("=" * 60)

print(f"\nTotal records analyzed: {len(df)}")
print(f"Anomalies detected: {len(anomalies)}")
print(f"Anomaly rate: {(len(anomalies) / len(df) * 100):.2f}%")

if len(anomalies) > 0:

    print("\nTOP ANOMALIES")
    print("-" * 60)

    top_anomalies = anomalies.copy()
    top_anomalies["anomaly_strength"] = top_anomalies["z_score"].abs()

    top_anomalies = top_anomalies.sort_values(
        "anomaly_strength",
        ascending=False
    ).head(10)

    for _, row in top_anomalies.iterrows():

        direction = (
            "UNUSUALLY HIGH"
            if row["z_score"] > 0
            else "UNUSUALLY LOW"
        )

        print(
            f"{row['timestamp']} | "
            f"Occupancy: {int(row['occupant_count'])} | "
            f"{direction} | "
            f"Z-score: {row['z_score']:.2f}"
        )

else:
    print("\nNo significant occupancy anomalies detected.")

# ---------- Save anomaly results ----------
output_columns = [
    "timestamp",
    "occupant_count",
    "rolling_mean",
    "rolling_std",
    "z_score",
    "is_anomaly"
]

df[output_columns].to_csv(
    "dataset/occupancy_anomaly_results.csv",
    index=False
)

print("\nSaved:")
print("dataset/occupancy_anomaly_results.csv")