from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

from recommendations import get_recommendation

app = FastAPI(title="Smart Campus Twin AI Service")

MODEL_PATH = "occupancy_model_30min.pkl"

try:
    model = joblib.load(MODEL_PATH)
    MODEL_LOADED = True
except Exception:
    model = None
    MODEL_LOADED = False


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


@app.get("/")
def root():
    return {"message": "Smart Campus Twin AI Service is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL_LOADED
    }


@app.post("/predict")
def predict(data: PredictionInput):

    if not MODEL_LOADED:
        raise HTTPException(
            status_code=500,
            detail="Occupancy model could not be loaded."
        )

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

    input_data = pd.DataFrame([data.model_dump()])[features]

    # Model predicts CHANGE in occupancy, not absolute occupancy
    predicted_delta = float(model.predict(input_data)[0])

    # Convert predicted change into predicted occupancy
    prediction = data.occupant_count + predicted_delta

    # Occupancy cannot be negative
    prediction = max(0.0, prediction)

    recommendation = get_recommendation(prediction)

    return {
        "current_occupancy": round(data.occupant_count, 2),
        "predicted_change": round(predicted_delta, 2),
        "predicted_occupancy_30min": round(prediction, 2),
        "crowd_level": recommendation["crowd_level"],
        "recommendation": recommendation["recommendation"],
        "action": recommendation["action"]
    }