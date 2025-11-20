# train_local.py
import pandas as pd, joblib, os
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

# try default path or ../dataset
csv_path = 'dataset/student_performance.csv'
if not os.path.exists(csv_path):
    csv_path = os.path.join('..','dataset','student_performance.csv')

df = pd.read_csv(csv_path)

X = df[['study_hours','attendance_pct','assignments_submitted','past_marks','engagement_score']]
y_score = df['score']
y_pass = (y_score >= 40).astype(int)
if 'risk' in df.columns:
    y_risk = df['risk']
else:
    y_risk = pd.cut(y_score, bins=[-1,39,69,100], labels=[2,1,0]).astype(int)

reg = RandomForestRegressor(n_estimators=150, random_state=42)
clf_pass = RandomForestClassifier(n_estimators=100, random_state=42)
clf_risk = RandomForestClassifier(n_estimators=100, random_state=42)

reg.fit(X,y_score)
clf_pass.fit(X,y_pass)
clf_risk.fit(X,y_risk)

os.makedirs('model', exist_ok=True)
joblib.dump({'reg': reg, 'clf_pass': clf_pass, 'risk': clf_risk}, 'model/joblib_model.pkl')
print('Training complete. Model saved to model/joblib_model.pkl')
