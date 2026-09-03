# 🍃 Bengaluru Air Quality Index (AQI) Intelligence & Machine Learning Platform

An end-to-end Machine Learning and Explainable AI (XAI) platform for forecasting, explaining, and simulating Air Quality Index (AQI) dynamics across monitoring stations in Bengaluru, India.

---

## 🌟 Highlights & Features

- 📊 **Real-Time & Historical Monitoring**: View live telemetry via WAQI API integration and explore historical atmospheric data from 2019 to 2024 across key stations (BTM Layout, Jayanagar, Silk Board, Peenya).
- 🤖 **ML Predictive Models**: 
  - **HistGradientBoosting** (Change Model — Best $R^2 = 0.82$, $\text{RMSE} = 17.43$)
  - **Random Forest** (Change & Direct Models)
  - **XGBoost** (Direct Model)
- 🔍 **Explainable AI (SHAP)**: Understand which specific pollutants (PM2.5, PM10, $\text{NO}_2$, $\text{O}_3$, $\text{CO}$) and temporal features drive air quality predictions in real-time.
- 🧪 **Policy Simulation Matrix**: Interactive policy sandbox to simulate emission reduction scenarios (e.g. 20% vehicle cut, 30% dust reduction) and calculate theoretical AQI improvements.
- 🎨 **Modern Instrument Dashboard**: Clean, responsive, glassmorphism UI built with Next.js 15, Tailwind CSS, and Recharts.

---

## 📁 Repository Structure

```text
├── backend/                             # FastAPI Python Backend
│   ├── main.py                          # API server (models, predictions, SHAP, endpoints)
│   ├── requirements.txt                 # Backend dependencies (fastapi, uvicorn, shap, xgboost, httpx, etc.)
│   └── .env                             # Environment configuration (WAQI_API_TOKEN)
│
├── bengaluru-aqi-platform/
│   └── frontend/                        # Next.js 15 App Router Frontend
│       ├── src/app/                     # Pages (Dashboard, Historical, Predict, Simulator, Performance, About)
│       ├── src/components/              # UI Components (AQIMap, StatCards, Charts, RealTimeAQI)
│       └── src/lib/                     # API client & utilities
│
├── ML Project/Air_Quality_Project/       # Machine Learning Pipeline
│   ├── data/                            # Processed CPCB datasets (2019–2024)
│   ├── models/                          # Trained ML models (.pkl files)
│   ├── process_2025.py                  # Dataset cleaning & feature engineering script
│   └── retrain.py                       # Model training script
│
├── CPCB_Bengaluru_Raw/                  # Raw CPCB station CSV files
└── start_app.bat                        # One-click startup script for Windows
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Running the Application (One-Click)
On Windows, double-click `start_app.bat` or run:
```cmd
start_app.bat
```
This will automatically launch the **FastAPI Backend** (`http://localhost:8000`) and **Next.js Frontend** (`http://localhost:3000`).

---

### Manual Setup

#### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Frontend (Next.js)
```bash
cd bengaluru-aqi-platform/frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Integration

To enable live station feeds on the dashboard, create a `.env` file inside the `backend/` directory:
```env
WAQI_API_TOKEN=your_free_waqi_api_token
```
*(Get a free token from [aqicn.org/api](https://aqicn.org/api/))*

---

## 🏆 Model Performance Summary

| Model | Approach | $R^2$ Score | MAE | RMSE | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **HistGradientBoosting** | Change ($\Delta \text{PM}_{2.5}$) | **0.820** | **4.474** | **17.428** | ⭐ Recommended |
| **Random Forest** | Change ($\Delta \text{PM}_{2.5}$) | 0.728 | 4.857 | 21.399 | Active |
| **Random Forest** | Direct ($\text{PM}_{2.5}$) | 0.643 | 5.015 | 24.519 | Active |
| **XGBoost** | Direct ($\text{PM}_{2.5}$) | 0.460 | 5.519 | 30.175 | Baseline |

---

## 📜 License
This project is for research and educational purposes using publicly available CPCB (Central Pollution Control Board, India) atmospheric data.
