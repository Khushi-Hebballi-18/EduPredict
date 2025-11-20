# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib, os
from sklearn.ensemble import RandomForestClassifier

app = FastAPI(title="EduPredict API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "model/model.pkl"

class PredictRequest(BaseModel):
    name: str
    student_id: str
    study_hours: float
    attendance_pct: float
    assignments_submitted: float
    past_marks: float
    engagement_score: float

@app.post("/train")
def train():
    csv_path = "dataset/student_performance.csv"  # relative path inside backend folder
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=400, detail="Dataset not found at dataset/student_performance.csv")

    df = pd.read_csv(csv_path)

    # If dataset includes 'score', use it. Otherwise train pass/fail from score.
    required = ["study_hours","attendance_pct","assignments_submitted","past_marks","engagement_score"]
    for c in required:
        if c not in df.columns:
            raise HTTPException(status_code=400, detail=f"Dataset missing column: {c}")

    X = df[required]
    # build binary PASS/FAIL target: score >= 50 considered PASS (changeable)
    if "score" in df.columns:
        y = (df["score"] >= 50).astype(int)
    else:
        # fallback: create a synthetic target (not ideal)
        y = (df[["past_marks"]].squeeze() >= 50).astype(int)

    model = RandomForestClassifier(n_estimators=120, random_state=42)
    model.fit(X, y)

    os.makedirs("model", exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return {"message": "Model trained and saved."}

@app.post("/predict")
def predict(req: PredictRequest):
    # Normalize to 0-100 scales
    score_study = (req.study_hours / 40) * 100
    score_attendance = req.attendance_pct
    score_marks = req.past_marks
    score_assign = (req.assignments_submitted / 10) * 100
    score_engage = (req.engagement_score / 50) * 100

    final_score = (score_study + score_attendance + score_marks + score_assign + score_engage) / 5
    confidence = int(round(final_score))
    status = "PASS" if confidence >= 50 else "FAIL"

    # If model exists, optionally compute model probability too (not required)
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            X = [[req.study_hours, req.attendance_pct, req.assignments_submitted, req.past_marks, req.engagement_score]]
            prob = model.predict_proba(X)[0]
            # choose predicted class's probability as additional confidence (scaled)
            pred_idx = int(model.predict(X)[0])
            model_conf = int(round(prob[pred_idx] * 100))
            # combine with rule-of-thumb final_score (take average)
            confidence = int(round((confidence + model_conf) / 2))
            status = "PASS" if confidence >= 50 else "FAIL"
        except Exception:
            pass

    return {
        "name": req.name,
        "student_id": req.student_id,
        "status": status,
        "confidence": confidence
    }
