from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

from recommendations import get_recommendation

app = FastAPI(title="Smart Campus Twin AI Service")

MODEL_PATH = "occupancy_model_30min.pkl"
DATASET_PATH = "dataset/occupancy_training_data.csv"


# ------------------------------------------------------------
# LOAD MODEL
# ------------------------------------------------------------

try:
    model = joblib.load(MODEL_PATH)
    MODEL_LOADED = True
except Exception as error:
    model = None
    MODEL_LOADED = False
    print(f"⚠ Model loading failed: {error}")


# ------------------------------------------------------------
# LOAD TRAINING DATASET
# ------------------------------------------------------------

try:
    dataset = pd.read_csv(DATASET_PATH)

    dataset["timestamp"] = pd.to_datetime(
        dataset["timestamp"],
        utc=True
    )

    dataset = dataset.sort_values(
        "timestamp"
    ).reset_index(drop=True)

    # Recreate feature used during model training
    dataset["days_since_start"] = (
        dataset["timestamp"] - dataset["timestamp"].min()
    ).dt.days

    DATASET_LOADED = True

    print(
        f"✅ Dataset loaded: {len(dataset)} rows"
    )

except Exception as error:
    dataset = None
    DATASET_LOADED = False

    print(
        f"⚠ Dataset loading failed: {error}"
    )


# ------------------------------------------------------------
# DEMO DATASET STATE
# ------------------------------------------------------------

# Used only when the frontend does not send live input.
# Each request moves to the next historical dataset row.
demo_index = 0


# ------------------------------------------------------------
# PREDICTION INPUT
# ------------------------------------------------------------

class PredictionInput(BaseModel):
    occupant_count: float
    occupant_count_lag_30min: float
    occupant_count_lag_1h: float
    occupant_count_lag_2h: float
    hour: int
    day_of_week: int
    is_weekend: int
    indoor_co2: float
    air_temperature: float
    indoor_relative_humidity: float
    sound_pressure_level: float
    illuminance: float
    wifi_connected_devices: float
    days_since_start: int


# ------------------------------------------------------------
# BASIC ROUTES
# ------------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Smart Campus Twin AI Service is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL_LOADED,
        "dataset_loaded": DATASET_LOADED
    }


# ------------------------------------------------------------
# AI OCCUPANCY PREDICTION
# ------------------------------------------------------------

@app.post("/predict")
def predict(data: PredictionInput = None):

    global demo_index

    if not MODEL_LOADED:
        raise HTTPException(
            status_code=500,
            detail="Occupancy model could not be loaded."
        )

    sample_timestamp = None
    data_source = "API input"

    # --------------------------------------------------------
    # USE HISTORICAL DATASET WHEN NO INPUT IS PROVIDED
    # --------------------------------------------------------

    if data is None:

        if not DATASET_LOADED:
            raise HTTPException(
                status_code=500,
                detail="Occupancy training dataset could not be loaded."
            )

        required_columns = [
            "occupant_count",
            "occupant_count_lag_30min",
            "occupant_count_lag_1h",
            "occupant_count_lag_2h",
            "hour",
            "day_of_week",
            "is_weekend",
            "indoor_co2",
            "air_temperature",
            "indoor_relative_humidity",
            "sound_pressure_level",
            "illuminance",
            "wifi_connected_devices",
            "days_since_start"
        ]

        # Check required columns
        missing_columns = [
            column
            for column in required_columns
            if column not in dataset.columns
        ]

        if missing_columns:
            raise HTTPException(
                status_code=500,
                detail=f"Dataset is missing columns: {missing_columns}"
            )

        # Keep only rows usable by the model
        valid_rows = dataset.dropna(
            subset=required_columns
        ).reset_index(drop=True)

        if valid_rows.empty:
            raise HTTPException(
                status_code=500,
                detail="No valid rows available in the occupancy dataset."
            )

        # ----------------------------------------------------
        # MOVE THROUGH DIFFERENT HISTORICAL DATASET ROWS
        # ----------------------------------------------------

        # Prefer rows where occupancy is non-zero so the
        # dashboard does not remain stuck at zero.
        non_zero_rows = valid_rows[
            valid_rows["occupant_count"] > 0
        ].reset_index(drop=True)

        if not non_zero_rows.empty:

            sample = non_zero_rows.iloc[
                demo_index % len(non_zero_rows)
            ]

            demo_index += 1

        else:

            sample = valid_rows[
                demo_index % len(valid_rows)
            ]

            demo_index += 1

        sample_timestamp = sample["timestamp"].isoformat()

        data_source = (
            "ROBOD/NUS historical dataset sample"
        )

        # Create model input from selected historical row
        data = PredictionInput(
            occupant_count=float(
                sample["occupant_count"]
            ),

            occupant_count_lag_30min=float(
                sample["occupant_count_lag_30min"]
            ),

            occupant_count_lag_1h=float(
                sample["occupant_count_lag_1h"]
            ),

            occupant_count_lag_2h=float(
                sample["occupant_count_lag_2h"]
            ),

            hour=int(
                sample["hour"]
            ),

            day_of_week=int(
                sample["day_of_week"]
            ),

            is_weekend=int(
                sample["is_weekend"]
            ),

            indoor_co2=float(
                sample["indoor_co2"]
            ),

            air_temperature=float(
                sample["air_temperature"]
            ),

            indoor_relative_humidity=float(
                sample["indoor_relative_humidity"]
            ),

            sound_pressure_level=float(
                sample["sound_pressure_level"]
            ),

            illuminance=float(
                sample["illuminance"]
            ),

            wifi_connected_devices=float(
                sample["wifi_connected_devices"]
            ),

            days_since_start=int(
                sample["days_since_start"]
            )
        )

    # --------------------------------------------------------
    # MODEL FEATURES
    # --------------------------------------------------------

    features = [
        "occupant_count",
        "occupant_count_lag_30min",
        "occupant_count_lag_1h",
        "occupant_count_lag_2h",
        "hour",
        "day_of_week",
        "is_weekend",
        "indoor_co2",
        "air_temperature",
        "indoor_relative_humidity",
        "sound_pressure_level",
        "illuminance",
        "wifi_connected_devices",
        "days_since_start"
    ]

    input_data = pd.DataFrame(
        [data.model_dump()]
    )[features]


    # --------------------------------------------------------
    # ML PREDICTION
    # --------------------------------------------------------

    # The trained Random Forest predicts the CHANGE
    # in occupancy, not the absolute occupancy.

    predicted_delta = float(
        model.predict(input_data)[0]
    )

    # Convert predicted change into absolute occupancy.

    prediction = (
        data.occupant_count
        + predicted_delta
    )

    # Occupancy cannot be negative.

    prediction = max(
        0.0,
        prediction
    )


    # --------------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------------

    recommendation = get_recommendation(
        prediction
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "current_occupancy": round(
            data.occupant_count,
            2
        ),

        "predicted_change": round(
            predicted_delta,
            2
        ),

        "predicted_occupancy_30min": round(
            prediction,
            2
        ),

        "crowd_level": recommendation[
            "crowd_level"
        ],

        "recommendation": recommendation[
            "recommendation"
        ],

        "action": recommendation[
            "action"
        ],

        "sample_timestamp": sample_timestamp,

        "data_source": data_source
    }

