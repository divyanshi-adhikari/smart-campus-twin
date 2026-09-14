import pandas as pd
import numpy as np

# ============================================================
# SMART CAMPUS TWIN — PATTERN ANALYSIS
# ============================================================

DATA_PATH = "dataset/combined_Room1.csv"

# ---------- Load dataset ----------
df = pd.read_csv(DATA_PATH)

# ---------- Prepare timestamp ----------
df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
df = df.sort_values("timestamp").reset_index(drop=True)

# ---------- Basic validation ----------
required_columns = [
    "timestamp",
    "occupant_count",
    "indoor_co2",
    "wifi_connected_devices"
]

missing_columns = [
    col for col in required_columns
    if col not in df.columns
]

if missing_columns:
    print("❌ Missing required columns:")
    for col in missing_columns:
        print(f"   - {col}")
    raise SystemExit

# ---------- Remove missing occupancy values ----------
df = df.dropna(subset=["occupant_count"]).copy()

# ---------- Time features ----------
df["hour"] = df["timestamp"].dt.hour
df["day_of_week"] = df["timestamp"].dt.dayofweek
df["day_name"] = df["timestamp"].dt.day_name()
df["is_weekend"] = df["day_of_week"] >= 5

# ============================================================
# OVERVIEW
# ============================================================

print("\n" + "=" * 60)
print("SMART CAMPUS TWIN — OCCUPANCY PATTERN ANALYSIS")
print("=" * 60)

print(f"Total records: {len(df)}")
print(
    f"Time range: {df['timestamp'].min()} → "
    f"{df['timestamp'].max()}"
)

print(f"Average occupancy: {df['occupant_count'].mean():.2f}")
print(f"Maximum occupancy: {df['occupant_count'].max():.0f}")

# ============================================================
# 1. OCCUPANCY BY HOUR
# ============================================================

hourly = (
    df.groupby("hour")["occupant_count"]
    .agg(["mean", "max", "count"])
    .sort_index()
)

peak_hour = hourly["mean"].idxmax()
peak_average = hourly.loc[peak_hour, "mean"]

lowest_hour = hourly["mean"].idxmin()
lowest_average = hourly.loc[lowest_hour, "mean"]

print("\n" + "=" * 60)
print("1. OCCUPANCY BY HOUR")
print("=" * 60)

print(f"Peak average occupancy hour: {peak_hour:02d}:00")
print(f"Average occupancy at peak: {peak_average:.2f}")

print(f"Lowest average occupancy hour: {lowest_hour:02d}:00")
print(f"Average occupancy at lowest: {lowest_average:.2f}")

print("\nHourly averages:")

for hour, row in hourly.iterrows():
    print(
        f"{hour:02d}:00  | "
        f"Average: {row['mean']:.2f} | "
        f"Maximum: {row['max']:.0f}"
    )

# ============================================================
# 2. WEEKDAY VS WEEKEND
# ============================================================

weekday_avg = df.loc[
    ~df["is_weekend"], "occupant_count"
].mean()

weekend_avg = df.loc[
    df["is_weekend"], "occupant_count"
].mean()

print("\n" + "=" * 60)
print("2. WEEKDAY VS WEEKEND")
print("=" * 60)

print(f"Weekday average occupancy : {weekday_avg:.2f}")
print(f"Weekend average occupancy : {weekend_avg:.2f}")

if weekday_avg > weekend_avg:
    print("Pattern: Weekdays generally have higher occupancy.")
elif weekend_avg > weekday_avg:
    print("Pattern: Weekends generally have higher occupancy.")
else:
    print("Pattern: Weekday and weekend occupancy are similar.")

# ============================================================
# 3. DAILY OCCUPANCY
# ============================================================

df["date"] = df["timestamp"].dt.date

daily = (
    df.groupby("date")["occupant_count"]
    .agg(["mean", "max", "sum"])
)

highest_day = daily["mean"].idxmax()
highest_day_avg = daily.loc[highest_day, "mean"]

lowest_day = daily["mean"].idxmin()
lowest_day_avg = daily.loc[lowest_day, "mean"]

print("\n" + "=" * 60)
print("3. DAILY OCCUPANCY")
print("=" * 60)

print(
    f"Highest average occupancy day: "
    f"{highest_day} ({highest_day_avg:.2f})"
)

print(
    f"Lowest average occupancy day: "
    f"{lowest_day} ({lowest_day_avg:.2f})"
)

# ============================================================
# 4. HIGH-OCCUPANCY PERIODS
# ============================================================

high_threshold = df["occupant_count"].quantile(0.90)

high_occupancy = df[
    df["occupant_count"] >= high_threshold
]

print("\n" + "=" * 60)
print("4. HIGH-OCCUPANCY PERIODS")
print("=" * 60)

print(f"90th percentile threshold: {high_threshold:.2f}")
print(f"High-occupancy records: {len(high_occupancy)}")

if len(high_occupancy) > 0:
    high_hour = (
        high_occupancy.groupby("hour")
        .size()
        .sort_values(ascending=False)
    )

    print(
        f"Most common high-occupancy hour: "
        f"{high_hour.index[0]:02d}:00"
    )

# ============================================================
# 5. LOW-OCCUPANCY PERIODS
# ============================================================

low_threshold = df["occupant_count"].quantile(0.25)

low_occupancy = df[
    df["occupant_count"] <= low_threshold
]

print("\n" + "=" * 60)
print("5. LOW-OCCUPANCY PERIODS")
print("=" * 60)

print(f"25th percentile threshold: {low_threshold:.2f}")
print(f"Low-occupancy records: {len(low_occupancy)}")

# ============================================================
# 6. CO2 VS OCCUPANCY
# ============================================================

co2_df = df[
    ["occupant_count", "indoor_co2"]
].dropna()

if len(co2_df) > 1:
    co2_corr = co2_df[
        "occupant_count"
    ].corr(co2_df["indoor_co2"])
else:
    co2_corr = np.nan

print("\n" + "=" * 60)
print("6. CO2 VS OCCUPANCY")
print("=" * 60)

if pd.notna(co2_corr):
    print(f"Correlation: {co2_corr:.3f}")

    if co2_corr >= 0.5:
        print("Pattern: Strong positive relationship.")
    elif co2_corr >= 0.2:
        print("Pattern: Moderate positive relationship.")
    elif co2_corr > -0.2:
        print("Pattern: Weak relationship.")
    else:
        print("Pattern: Negative relationship.")
else:
    print("Not enough data for correlation.")

# ============================================================
# 7. WIFI DEVICES VS OCCUPANCY
# ============================================================

wifi_df = df[
    ["occupant_count", "wifi_connected_devices"]
].dropna()

if len(wifi_df) > 1:
    wifi_corr = wifi_df[
        "occupant_count"
    ].corr(wifi_df["wifi_connected_devices"])
else:
    wifi_corr = np.nan

print("\n" + "=" * 60)
print("7. WIFI DEVICES VS OCCUPANCY")
print("=" * 60)

if pd.notna(wifi_corr):
    print(f"Correlation: {wifi_corr:.3f}")

    if wifi_corr >= 0.5:
        print("Pattern: Strong positive relationship.")
    elif wifi_corr >= 0.2:
        print("Pattern: Moderate positive relationship.")
    elif wifi_corr > -0.2:
        print("Pattern: Weak relationship.")
    else:
        print("Pattern: Negative relationship.")
else:
    print("Not enough data for correlation.")

# ============================================================
# 8. TOP OCCUPANCY HOURS
# ============================================================

top_hours = (
    hourly["mean"]
    .sort_values(ascending=False)
    .head(5)
)

print("\n" + "=" * 60)
print("8. TOP 5 PEAK HOURS")
print("=" * 60)

for rank, (hour, value) in enumerate(
    top_hours.items(), start=1
):
    print(
        f"{rank}. {hour:02d}:00 → "
        f"Average occupancy: {value:.2f}"
    )

# ============================================================
# KEY INSIGHTS
# ============================================================

print("\n" + "=" * 60)
print("KEY PATTERNS IDENTIFIED")
print("=" * 60)

print(
    f"• Peak occupancy occurs around {peak_hour:02d}:00 "
    f"with an average of {peak_average:.2f} occupants."
)

if weekday_avg > weekend_avg:
    print("• Occupancy is generally higher on weekdays.")
elif weekend_avg > weekday_avg:
    print("• Occupancy is generally higher on weekends.")

if pd.notna(co2_corr) and co2_corr >= 0.2:
    print(
        "• Occupancy and indoor CO2 show a positive relationship."
    )

if pd.notna(wifi_corr) and wifi_corr >= 0.2:
    print(
        "• Connected Wi-Fi devices show a positive relationship "
        "with occupancy."
    )

print(
    f"• High occupancy is defined here as "
    f"{high_threshold:.2f} occupants or above."
)

print("\n" + "=" * 60)
print("PATTERN ANALYSIS COMPLETE")
print("=" * 60)