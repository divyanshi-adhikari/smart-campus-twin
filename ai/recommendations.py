"""
Smart Campus Twin — Recommendation / Decision Layer

Converts predicted occupancy into a simple operational recommendation.
This is a rule-based decision layer built on top of the ML prediction.
"""

def get_recommendation(predicted_occupancy):
    """
    Generate a campus recommendation based on predicted occupancy.

    Thresholds:
        LOW    : < 2 occupants
        MEDIUM : 2–3 occupants
        HIGH   : >= 4 occupants

    These thresholds are based on the occupancy patterns
    observed in the training dataset.
    """

    if predicted_occupancy >= 4:
        return {
            "crowd_level": "HIGH",
            "recommendation": "Increase monitoring and prepare additional staff.",
            "action": "Monitor crowd and consider alternate routes."
        }

    elif predicted_occupancy >= 2:
        return {
            "crowd_level": "MEDIUM",
            "recommendation": "Monitor occupancy and prepare resources if needed.",
            "action": "Keep the area under observation."
        }

    else:
        return {
            "crowd_level": "LOW",
            "recommendation": "Suitable for routine operations or maintenance.",
            "action": "No immediate crowd-management action required."
        }


# ------------------------------------------------------------
# Test the recommendation layer
# ------------------------------------------------------------

if __name__ == "__main__":

    test_predictions = [0.5, 2.3, 4.5, 8.0]

    print("=" * 60)
    print("SMART CAMPUS TWIN — RECOMMENDATION ENGINE")
    print("=" * 60)

    for prediction in test_predictions:

        result = get_recommendation(prediction)

        print(f"\nPredicted occupancy: {prediction:.1f}")
        print(f"Crowd level: {result['crowd_level']}")
        print(f"Recommendation: {result['recommendation']}")
        print(f"Action: {result['action']}")

    print("\n" + "=" * 60)
    print("RECOMMENDATION ENGINE COMPLETE")
    print("=" * 60)
