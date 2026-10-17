"""Word-based ML layer: load the trained model and score a message.

The model file is created by sms_spam.ipynb (trained on LinuxONE) and is not committed to git.
"""
from pathlib import Path

import joblib

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "scam_model.joblib"

# Spam-probability bands, shared by the notebook and the API
SAFE_BELOW = 0.30
SCAM_FROM = 0.70

_model = None


def band(probability):
    """Turn a spam probability (0..1) into "safe", "suspicious" or "scam"."""
    if probability < SAFE_BELOW:
        return "safe"
    if probability < SCAM_FROM:
        return "suspicious"
    return "scam"


def load_model(path=MODEL_PATH):
    """Load the saved pipeline once and reuse it."""
    global _model
    if _model is None:
        _model = joblib.load(path)
    return _model


def score(message):
    """Return the word model's spam probability and band for one message."""
    probability = float(load_model().predict_proba([message])[0, 1])
    return {"probability": round(probability, 3), "band": band(probability)}
