from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib, os
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "model/model.pkl"

class PredictRequest(BaseModel):
    study_hours: float
    attendance_pct: float
    assignments_submitted: float
    past_marks: float
    engagement_score: float


@app.post("/train")
def train():
    csv_path = "C:/Users/khush/OneDrive/Desktop/EduPredict/dataset/student_performance.csv"

    if not os.path.exists(csv_path):
        raise HTTPException(400, "Dataset not found.")

    df = pd.read_csv(csv_path)

    X = df[["study_hours","attendance_pct","assignments_submitted","past_marks","engagement_score"]]
    y_pass = (df["score"] >= 40).astype(int)  # PASS/FAIL

    model = RandomForestClassifier(n_estimators=120, random_state=42)
    model.fit(X, y_pass)

    os.makedirs("model", exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return {"message": "Model trained successfully"}


@app.post("/predict")
def predict(req: PredictRequest):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(400, "Train the model first.")

    model = joblib.load(MODEL_PATH)

    X = [[req.study_hours, req.attendance_pct, req.assignments_submitted,
          req.past_marks, req.engagement_score]]

    pred = model.predict(X)[0]
    prob = model.predict_proba(X)[0][1] * 100    # confidence %

    return {
        "status": "PASS" if pred == 1 else "FAIL",
        "confidence": round(prob, 2)
    }
