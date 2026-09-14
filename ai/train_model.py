import pandas as pd
import json
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# ---------- 1. Load ----------
df = pd.read_csv("dataset/occupancy_training_data.csv")
df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
df = df.sort_values("timestamp").reset_index(drop=True)
df = df.drop_duplicates(subset="timestamp").reset_index(drop=True)

if df["occupant_count"].isnull().sum() > 0:
    print("⚠ Dropping rows with missing occupant_count")
    df = df.dropna(subset=["occupant_count"]).reset_index(drop=True)
else:
    print("✅ No missing occupant_count values")

# ---------- 2. Rebuild target + lags with EXACT timestamp matching ----------
# Row-shifting (df[col].shift(n)) silently produces wrong pairs across gaps in
# the data (e.g. Sep 30 -> Dec 13 has no continuous 5-min cadence). Instead,
# look up the value at the exact required timestamp offset; if that timestamp
# doesn't exist in the data, the row gets NaN and is dropped below.
occ_by_time = df.set_index("timestamp")["occupant_count"]

df["occupant_count_lag_30min"] = (df["timestamp"] - pd.Timedelta(minutes=30)).map(occ_by_time)
df["occupant_count_lag_1h"]    = (df["timestamp"] - pd.Timedelta(hours=1)).map(occ_by_time)
df["occupant_count_lag_2h"]    = (df["timestamp"] - pd.Timedelta(hours=2)).map(occ_by_time)
df["target_occupancy_30min"]   = (df["timestamp"] + pd.Timedelta(minutes=30)).map(occ_by_time)

df["days_since_start"] = (df["timestamp"] - df["timestamp"].min()).dt.days

required_cols = [
    "occupant_count_lag_30min", "occupant_count_lag_1h", "occupant_count_lag_2h",
    "target_occupancy_30min",
]
before = len(df)
df = df.dropna(subset=required_cols).reset_index(drop=True)
after = len(df)
print(f"Rows before exact-match filtering: {before}")
print(f"Rows after exact-match filtering:  {after}  ({before - after} dropped — gaps/edges)")

features = [
    "occupant_count",
    "occupant_count_lag_30min",
    "occupant_count_lag_1h",
    "occupant_count_lag_2h",
    "hour", "day_of_week", "is_weekend",
    "indoor_co2", "air_temperature", "indoor_relative_humidity",
    "sound_pressure_level", "illuminance", "wifi_connected_devices",
    "days_since_start",
]
target = "target_occupancy_30min"

print()
print("=" * 60)
print("DATASET OVERVIEW (after exact-match filtering)")
print("=" * 60)
print(f"TOTAL ROWS: {len(df)}")
print(f"RANGE: {df['timestamp'].iloc[0]} → {df['timestamp'].iloc[-1]}")
print(f"Zero-target rows: {(df[target] == 0).mean() * 100:.1f}%")


import numpy as np

# ---------- 3. Walk-forward validation, delta target + calibrated shrinkage ----------
def walk_forward_eval(df, features, target, n_splits=3, test_size=600):
    results = []
    n = len(df)
    fold_size = (n - test_size) // n_splits
    last_model, last_X_test, last_y_test, last_preds = None, None, None, None
    all_actuals, all_preds, all_baseline = [], [], []

    df = df.copy()
    df["target_delta"] = df[target] - df["occupant_count"]

    for i in range(n_splits):
        train_end = fold_size * (i + 1)
        test_end = min(train_end + test_size, n)
        if test_end <= train_end:
            continue

        # Carve an internal validation slice out of TRAIN only (last 15%),
        # used solely to pick the shrinkage factor alpha. Test fold is never
        # touched for this choice.
        val_size = max(int(train_end * 0.15), 50)
        inner_train_end = train_end - val_size

        X_inner_train = df[features].iloc[:inner_train_end]
        y_inner_train_delta = df["target_delta"].iloc[:inner_train_end]
        X_val = df[features].iloc[inner_train_end:train_end]
        y_val = df[target].iloc[inner_train_end:train_end]
        val_current = df["occupant_count"].iloc[inner_train_end:train_end]

        calib_model = RandomForestRegressor(
            n_estimators=300, max_depth=10,
            min_samples_split=4, min_samples_leaf=2,
            random_state=42, n_jobs=-1
        )
        calib_model.fit(X_inner_train, y_inner_train_delta)
        val_pred_delta_raw = calib_model.predict(X_val)

        val_quiet_mask = (
            (X_val["occupant_count"] == 0)
            & (X_val["occupant_count_lag_30min"] == 0)
            & (X_val["occupant_count_lag_1h"] == 0)
            & (X_val["occupant_count_lag_2h"] == 0)
        ).values
        val_pred_delta_raw = val_pred_delta_raw * (~val_quiet_mask)

        best_alpha, best_val_mae = 1.0, float("inf")
        for alpha in np.arange(0.0, 1.05, 0.1):
            val_preds = val_current.values + alpha * val_pred_delta_raw
            val_mae = mean_absolute_error(y_val, val_preds)
            if val_mae < best_val_mae:
                best_val_mae, best_alpha = val_mae, alpha

        # Refit on the FULL train window (inner_train + val) now that alpha is chosen
        X_train = df[features].iloc[:train_end]
        y_train_delta = df["target_delta"].iloc[:train_end]

        X_test = df[features].iloc[train_end:test_end]
        y_test = df[target].iloc[train_end:test_end]
        test_current = df["occupant_count"].iloc[train_end:test_end]

        model = RandomForestRegressor(
            n_estimators=300, max_depth=10,
            min_samples_split=4, min_samples_leaf=2,
            random_state=42, n_jobs=-1
        )
        model.fit(X_train, y_train_delta)
        pred_delta = model.predict(X_test)

        quiet_mask = (
            (X_test["occupant_count"] == 0)
            & (X_test["occupant_count_lag_30min"] == 0)
            & (X_test["occupant_count_lag_1h"] == 0)
            & (X_test["occupant_count_lag_2h"] == 0)
        ).values
        pred_delta = pred_delta * (~quiet_mask) * best_alpha   # <-- calibrated shrinkage applied

        preds = test_current.values + pred_delta

        mae = mean_absolute_error(y_test, preds)
        rmse = mean_squared_error(y_test, preds) ** 0.5
        r2 = r2_score(y_test, preds)
        baseline_p_mae = mean_absolute_error(y_test, test_current)

        fold_result = {
            "fold": i + 1,
            "train_rows": len(X_train),
            "test_rows": len(X_test),
            "test_start": str(df["timestamp"].iloc[train_end]),
            "test_end": str(df["timestamp"].iloc[test_end - 1]),
            "chosen_alpha": round(float(best_alpha), 2),
            "mae": round(mae, 3), "rmse": round(rmse, 3), "r2": round(r2, 3),
            "baseline_persistence_mae": round(baseline_p_mae, 3),
            "beats_baseline": bool(mae < baseline_p_mae),
            "pct_quiet_guarded": round(quiet_mask.mean() * 100, 1),
        }
        results.append(fold_result)
        print(fold_result)

        all_actuals.extend(y_test.tolist())
        all_preds.extend(preds.tolist())
        all_baseline.extend(test_current.tolist())

        last_model, last_X_test, last_y_test, last_preds = model, X_test, y_test, preds

    return results, last_model, last_X_test, last_y_test, last_preds, all_actuals, all_preds, all_baseline


print()
print("=" * 60)
print("30-MINUTE-AHEAD OCCUPANCY PREDICTION — WALK-FORWARD VALIDATION")
print("=" * 60)

fold_results, model, X_test, y_test, predictions, all_actuals, all_preds, all_baseline = walk_forward_eval(
    df, features, target, n_splits=3, test_size=600
)

pooled_mae = mean_absolute_error(all_actuals, all_preds)
pooled_rmse = mean_squared_error(all_actuals, all_preds) ** 0.5
pooled_r2 = r2_score(all_actuals, all_preds)
pooled_baseline_mae = mean_absolute_error(all_actuals, all_baseline)

print()
print("=" * 60)
print("30-MINUTE-AHEAD OCCUPANCY PREDICTION")
print("=" * 60)
print(f"Model MAE:        {pooled_mae:.3f}")
print(f"Persistence MAE:  {pooled_baseline_mae:.3f}")
print(f"Model RMSE:       {pooled_rmse:.3f}")
print(f"Model R²:         {pooled_r2:.3f}")
print(f"Model beats baseline: {pooled_mae < pooled_baseline_mae}")


# ---------- 4. Feature importance ----------
print()
print("=" * 60)
print("FEATURE IMPORTANCE (final fold's model)")
print("=" * 60)
for name, imp in sorted(zip(features, model.feature_importances_), key=lambda x: x[1], reverse=True):
    print(f"  {name:30s} {imp:.4f}")

# ---------- 5. Save (final fold's model) ----------
joblib.dump(model, "occupancy_model_30min.pkl")

meta = {
    "model_type": "RandomForestRegressor",
    "horizon": "30 minutes ahead",
    "n_estimators": 300,
    "max_depth": 10,
    "features": features,
    "target": target,
    "validation": "walk-forward, 3 folds, exact-timestamp-matched target/lags",
    "fold_results": fold_results,
    "pooled_mae": round(pooled_mae, 3),
    "pooled_rmse": round(pooled_rmse, 3),
    "pooled_r2": round(pooled_r2, 3),
    "pooled_baseline_persistence_mae": round(pooled_baseline_mae, 3),
    "pooled_model_beats_baseline": bool(pooled_mae < pooled_baseline_mae),
    "trained_at": pd.Timestamp.now().isoformat(),
    "data_source": "ROBOD (NUS Singapore) — combined_Room1.csv",
}

with open("occupancy_model_30min_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print()
print("✅ Saved: occupancy_model_30min.pkl + occupancy_model_30min_meta.json")