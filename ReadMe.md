# 🎓 EduPredict – Student Performance Predictor  
### Full Stack Odyssey – Hackathon Submission  
**Team Name:** Runtime Error  
**Team Members:** Hitesh L (1CR23AD057)
                  Vaishnavi S (1CR23CD060)
                  Khushi Hebballi (1CR23AD057)
---

# 🚀 1. Project Overview

EduPredict is a full-stack ML-powered application that predicts a student’s academic performance based on:

- Study Hours  
- Attendance Percentage  
- Assignments Completed  
- Past Internal Marks  
- Engagement Score  

### **Output Generated**
- **Predicted Score %**
- **Pass / Fail**
- **Risk Category**
- **AI Insight**
- **Prediction History**
- **PDF Performance Report**

---

# 🧩 2. Technology Stack

### **Frontend**
- React.js  
- Chart.js  
- html2canvas  
- jsPDF  

### **Backend**
- FastAPI  
- Scikit-Learn  
- Python 3.11  

### **ML Model**
- Random Forest Classifier  
- Custom dataset + synthetically generated enrichment  
- Features normalized for stable predictions  

---

# 🖥️ 4. How to Run the Project

## **Backend (FastAPI)**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

cd frontend
npm install
npm start

## **GitHub link project**
https://github.com/Khushi-Hebballi-18/EduPredict/projects/1


## **Input JSON**
{
  "name": "John",
  "student_id": "1CR23CS001",
  "study_hours": 12,
  "attendance_pct": 78,
  "assignments_submitted": 7,
  "past_marks": 65,
  "engagement_score": 25
}

## **Output**
{
  "confidence": 72,
  "status": "PASS"
}

## 🧩 Tech Stack

### 🎨 Frontend
- **React.js** – Component-based UI framework  
- **Chart.js / react-chartjs-2** – Donut chart visualization  
- **html2canvas** – Capture UI elements as images  
- **jsPDF** – Generate downloadable PDF reports  
- **Axios** – API communication  
- **CSS3** – Styling and animations  

---

### ⚙️ Backend
- **FastAPI (Python)** – High-performance backend framework  
- **Uvicorn** – ASGI server to serve FastAPI  
- **Pydantic** – Request validation  

---

### 🤖 Machine Learning
- **Scikit-Learn** – Model training & prediction  
- **Random Forest Classifier** – Primary prediction model  
- **Pandas** – Dataset manipulation  
- **NumPy** – Numerical operations  
- **Joblib / Pickle** – Save and load trained model  

---

### 🗄️ Database (Optional)
- Lightweight approach using **CSV dataset + model storage**  
- Can be extended to:
  - MongoDB  
  - PostgreSQL  
  - Firebase  

(Current version works without DB)

---

### 🔧 Development Tools
- **VS Code** – Code editor  
- **Git & GitHub** – Version control  
- **Postman / Thunder Client** – API testing  

---

### ☁️ Deployment (Optional)
- **Vercel / Netlify** – React frontend hosting  
- **Render / Railway** – FastAPI backend hosting  
