/* src/App.js */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";
import logo from "./logo.svg";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
ChartJS.register(ArcElement, Tooltip);

export default function App() {
  // LOGIN
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const login = () => {
    if (loginData.username === "admin" && loginData.password === "1234") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid login — use admin / 1234");
    }
  };

  // FORM
  const [form, setForm] = useState({
    name: "",
    student_id: "",
    study_hours: 0,
    attendance_pct: 0,
    assignments_submitted: 0,
    past_marks: 0,
    engagement_score: 0,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // ⭐ NEW — Needed to detect name/USN change
  const lastStudentRef = useRef({ name: "", student_id: "" });

  const outputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]:
        name === "name" || name === "student_id" ? value : Number(value),
    }));
  };

  const computeLocalConfidence = () => {
    const score_study = (form.study_hours / 40) * 100;
    const score_attendance = form.attendance_pct;
    const score_marks = form.past_marks;
    const score_assign = (form.assignments_submitted / 10) * 100;
    const score_engage = (form.engagement_score / 50) * 100;

    return Math.round(
      (score_study +
        score_attendance +
        score_marks +
        score_assign +
        score_engage) /
        5
    );
  };

  const predict = async () => {
    if (!form.name.trim() || !form.student_id.trim()) {
      alert("Enter Student Name and Student ID first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        name: form.name,
        student_id: form.student_id,
        study_hours: form.study_hours,
        attendance_pct: form.attendance_pct,
        assignments_submitted: form.assignments_submitted,
        past_marks: form.past_marks,
        engagement_score: form.engagement_score,
      };

      const res = await axios.post("http://127.0.0.1:8000/predict", payload);

      setTimeout(() => {
        const enriched = {
          ...res.data,
          name: form.name,
          student_id: form.student_id,
        };

        setResult(enriched);

        // ⭐⭐⭐ FIX #1 — Reset history when name/USN changes ⭐⭐⭐
        if (
          lastStudentRef.current.name !== form.name ||
          lastStudentRef.current.student_id !== form.student_id
        ) {
          setHistory([{ ...enriched, timestamp: new Date().toISOString() }]);
        } else {
          setHistory((h) => [
            ...h,
            { ...enriched, timestamp: new Date().toISOString() },
          ]);
        }

        // ⭐ Update last student
        lastStudentRef.current = {
          name: form.name,
          student_id: form.student_id,
        };

        setLoading(false);
      }, 700);
    } catch {
      setLoading(false);
      const confidence = computeLocalConfidence();
      const status = confidence >= 50 ? "PASS" : "FAIL";
      const fallback = {
        name: form.name,
        student_id: form.student_id,
        confidence,
        status,
      };

      setResult(fallback);

      // RESET HISTORY for fallback also
      if (
        lastStudentRef.current.name !== form.name ||
        lastStudentRef.current.student_id !== form.student_id
      ) {
        setHistory([{ ...fallback, timestamp: new Date().toISOString() }]);
      } else {
        setHistory((h) => [
          ...h,
          { ...fallback, timestamp: new Date().toISOString() },
        ]);
      }

      lastStudentRef.current = {
        name: form.name,
        student_id: form.student_id,
      };

      alert("Backend unreachable — showing local prediction fallback.");
    }
  };

  const train = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/train");
      alert("Model trained successfully on server dataset.");
    } catch {
      alert("Training failed or backend unreachable.");
    }
  };

  const getAvatar = (status) => {
    if (status === "PASS")
      return "https://static.vecteezy.com/system/resources/previews/029/140/204/original/happy-emoji-happy-emoji-happy-emoji-transparent-background-ai-generative-free-png.png";
    return "https://png.pngtree.com/png-clipart/20240927/original/pngtree-sad-emoji-png-image_16109987.png";
  };

  const generateAISummary = () => {
    const lines = [];
    if (form.attendance_pct < 60)
      lines.push("attendance is low — improving it will help.");
    else lines.push("attendance is strong.");

    if (form.study_hours < 15)
      lines.push("increase study hours to boost score.");
    else lines.push("study hours are good.");

    if (form.engagement_score < 30)
      lines.push("raise participation to improve outcomes.");
    else lines.push("active engagement helps performance.");

    return lines.join(" ");
  };

  // ⭐ PDF (unchanged except name/id fix already applied earlier)
  const downloadPDF = async () => {
    if (!result) {
      alert("No result to export");
      return;
    }

    const node = document.createElement("div");
    node.style.width = "600px";
    node.style.padding = "28px";
    node.style.borderRadius = "12px";
    node.style.background = "#ffffff";
    node.style.color = "#000";
    node.style.fontFamily = "Poppins, Arial, sans-serif";

    const h = document.createElement("h2");
    h.style.textAlign = "center";
    h.textContent = "Student Performance Report";
    node.appendChild(h);

    const infoName = document.createElement("p");
    infoName.textContent = `Name: ${result.name}`;
    infoName.style.fontWeight = "600";
    node.appendChild(infoName);

    const infoId = document.createElement("p");
    infoId.textContent = `Student ID: ${result.student_id}`;
    infoId.style.fontWeight = "600";
    node.appendChild(infoId);

    const chartCanvas = document.createElement("canvas");
    chartCanvas.width = 420;
    chartCanvas.height = 420;
    node.appendChild(chartCanvas);

    const pscore = document.createElement("div");
    pscore.style.textAlign = "center";
    pscore.style.fontWeight = "800";
    pscore.style.fontSize = "26px";
    pscore.textContent = `${result.confidence}%`;
    node.appendChild(pscore);

    const avatar = document.createElement("img");
    avatar.src = getAvatar(result.status);
    avatar.style.width = "70px";
    avatar.style.display = "block";
    avatar.style.margin = "10px auto";
    node.appendChild(avatar);

    const badge = document.createElement("div");
    badge.style.textAlign = "center";
    badge.style.display = "inline-block";
    badge.style.padding = "8px 18px";
    badge.style.borderRadius = "20px";
    badge.style.background =
      result.status === "PASS" ? "#32ffd8" : "#ff6b6b";
    badge.style.fontWeight = "800";
    badge.textContent = result.status === "PASS" ? "PASS" : "FAIL";   // ✅ FIXED
    node.appendChild(badge);

    const barWrap = document.createElement("div");
    barWrap.style.marginTop = "14px";
    barWrap.style.width = "100%";
    barWrap.style.height = "12px";
    barWrap.style.background = "#ddd";
    const fill = document.createElement("div");
    fill.style.width = `${result.confidence}%`;
    fill.style.height = "100%";
    fill.style.background = "#32ffd8";
    barWrap.appendChild(fill);
    node.appendChild(barWrap);

    const insight = document.createElement("p");
    insight.textContent = "AI Insight: " + generateAISummary();
    insight.style.marginTop = "14px";
    node.appendChild(insight);

    node.style.position = "fixed";
    node.style.left = "-9999px";
    document.body.appendChild(node);

    new ChartJS(chartCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [result.confidence, 100 - result.confidence],
            backgroundColor: ["#32ffd8", "#e8e8e8"],
            borderWidth: 0,
          },
        ],
      },
      options: { cutout: "70%", plugins: { legend: { display: false } } },
    });

    setTimeout(async () => {
      const canvas = await html2canvas(node, { scale: 2 });
      const img = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(img, "PNG", 10, 10, 190, 270);

      const filename = `StudentPerformance_${result.name}_${result.student_id}.pdf`;
      pdf.save(filename);

      document.body.removeChild(node);
    }, 500);
  };

  const donutData = (confidence) => ({
    datasets: [
      {
        data: [confidence, 100 - confidence],
        backgroundColor: ["#32ffd8", "rgba(255,255,255,0.06)"],
        borderWidth: 0,
      },
    ],
  });

  return !isLoggedIn ? (
    <div className="login-wrapper">
      <div className="login-card">
        <img src={logo} alt="logo" className="logo" />
        <h1 className="login-title">EduPredict Login</h1>

        <input
          className="login-input"
          name="username"
          value={loginData.username}
          onChange={handleLoginChange}
          placeholder="Username"
        />
        <input
          className="login-input"
          name="password"
          value={loginData.password}
          onChange={handleLoginChange}
          placeholder="Password"
          type="password"
        />

        <button className="login-btn" onClick={login}>
          Login
        </button>
      </div>
      <p className="login-footer">Created with ❤️ by Runtime Error</p>
    </div>
  ) : (
    <div className="dashboard-container dashboard-slideIn">
      <img src={logo} alt="logo" className="logo" />
      <h1 className="title">Student Performance Predictor</h1>

      <div className="grid-container">
        <div className="input-card">
          <h2>Enter Student Details</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: "#f0c" }}>Student Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="text-input"
              placeholder="Full name"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ color: "#f0c" }}>Student ID</label>
            <input
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              className="text-input"
              placeholder="e.g. 1CR23AD057"
            />
          </div>

          {[
            ["study_hours", "Study Hours per Week", 40],
            ["attendance_pct", "Attendance (%)", 100],
            ["past_marks", "Internal Marks", 100],
            ["assignments_submitted", "Assignments Completed", 10],
            ["engagement_score", "Participation / Activities", 50],
          ].map(([name, label, max]) => (
            <div className="field" key={name}>
              <label>{label}</label>
              <div className="range-row">
                <input
                  className="range-input"
                  type="range"
                  name={name}
                  min="0"
                  max={max}
                  value={form[name]}
                  onChange={handleChange}
                />
                <div className="value-badge">{form[name]}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={predict}>
              Predict
            </button>
            <button className="btn btn-secondary" onClick={train}>
              Train Model
            </button>
          </div>
        </div>

        <div className="output-card" ref={outputRef}>
          <h2>Prediction Result</h2>

          {loading && (
            <div className="loader">
              <span>AI Predicting</span>
              <div className="dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="prediction-animate">
              <div className="donut-container">
                <Doughnut
                  data={donutData(result.confidence)}
                  options={{
                    cutout: "70%",
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  }}
                />
                <div className="donut-center-text">
                  <b>{result.confidence}%</b>
                </div>
              </div>

              <img
                src={getAvatar(result.status)}
                alt="avatar"
                className="student-avatar"
              />

              <div
                className={`status-badge ${
                  result.status === "PASS" ? "status-pass" : "status-fail"
                }`}
              >
                {result.status}
              </div>

              <div className="confidence-box">
                <div
                  className="confidence-fill"
                  style={{ width: `${result.confidence}%` }}
                />
              </div>

              <p className="confidence-text">
                <b>Confidence Level: {result.confidence}%</b>
              </p>

              <p className="ai-summary">
                <b>AI Insight:</b> {generateAISummary(result)}
              </p>

              <button className="btn btn-primary" onClick={downloadPDF}>
                Download PDF Report
              </button>

              <div className="history-box">
                <h3>Prediction History</h3>

                {history.length === 0 && <p>No attempts yet.</p>}

                {history.map((h, i) => (
                  <p key={i}>
                    {/* ⭐⭐⭐ FIX #2 — Show old name/ID correctly ⭐⭐⭐ */}
                    Attempt {i + 1}: {h.name} ({h.student_id}) — {h.status} —{" "}
                    {h.confidence}%
                  </p>
                ))}
              </div>
            </div>
          )}

          {!loading && !result && (
            <p>No prediction yet. Enter name & id, then set metrics and press Predict.</p>
          )}
        </div>
      </div>

      <footer className="footer">Created with ❤️ by Runtime Error</footer>
    </div>
  );
}
