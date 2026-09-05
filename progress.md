# 📋 Project Log Book & System Architecture — Bengaluru AQI Platform

> [!IMPORTANT]
> ### 🤖 MANDATORY AI INSTRUCTION FOR ALL AI CODING ASSISTANTS
> **STOP AND READ BEFORE MAKING ANY CHANGES:**
> 1. **ALWAYS READ THIS FILE FIRST:** Any AI assistant working on this repository MUST read this `progress.md` file before inspecting or editing other files. It contains the exact technical architecture, operational quirks, and established conventions of this codebase.
> 2. **ALWAYS UPDATE THIS LOG BOOK:** Whenever you plan to make, or have made, any file changes, bugs fixes, or feature additions, you **MUST append an entry to the [Project Change Log & Work History](#-project-change-log--work-history) section at the bottom of this file**.
> 3. Document: Date, Files Modified, What Changed, and Technical Rationale. This prevents future AI sessions from repeating past mistakes or having to read through hundreds of files to understand the system state.

---

## 🏗️ 1. System Architecture Overview

This repository is a full-stack Machine Learning & Explainable AI (XAI) platform for forecasting, analyzing, and simulating air quality dynamics across Bengaluru, India.

```
Bengaluru-AQI/
├── backend/                       # FastAPI Python Service (Port 8000)
│   ├── main.py                    # REST API endpoints, ML inference, SHAP, CPCB calculation
│   ├── requirements.txt           # Python dependencies (fastapi, uvicorn, shap, xgboost, scikit-learn)
│   └── .env                       # Environment variables (WAQI_API_TOKEN, ALLOWED_ORIGINS)
│
├── frontend/                      # Next.js 15 App Router Frontend (Port 3000)
│   ├── src/app/                   # App routes (/, /predict, /historical, /simulator, /model-performance)
│   ├── src/components/            # Modular React UI components (Dark mode, glassmorphism, Recharts)
│   └── src/lib/                   # API client (api.ts), types (types.ts), AQI helpers (aqi.ts)
│
├── ml/                            # ML Pipeline & Offline Data Processing
│   ├── data/
│   │   ├── bengaluru_master.csv            # Cleaned, backfilled master dataset (2019–2025)
│   │   ├── bengaluru_master_unprocessed.csv # Raw un-backfilled combined CPCB station data
│   │   └── bengaluru_train/test_*.csv     # Split datasets for model training & evaluation
│   ├── models/                    # Serialized Scikit-Learn & XGBoost pipeline pickles (.pkl)
│   ├── backfill_weather.py        # Open-Meteo weather backfilling & sensor anomaly cleaning script
│   ├── process_2025.py            # Feature engineering (lags, temporal features) script
│   └── retrain.py                 # Model training, validation, and serialization script
│
├── data/                          # Raw archive station files from CPCB & KSPCB
└── progress.md                    # THIS FILE — Persistent system logbook & AI context
```

### Quick Commands
- **Launch Everything (Windows One-Click):** `start_app.bat`
- **Backend Only:** `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- **Frontend Only:** `cd frontend && npm run dev`
- **Retrain Models:** `python ml/retrain.py`
- **Re-backfill Weather:** `python ml/backfill_weather.py`

---

## 🧠 2. Core Machine Learning & Data Knowledge

### A. The Prediction Target
- The models in this project predict **`PM25_next_1h`** (PM2.5 concentration 1 hour ahead), **NOT** the overall multi-pollutant AQI directly.
- The predicted PM2.5 concentration is subsequently mapped to an Indian Central Pollution Control Board (CPCB) sub-index via `pm25_to_aqi()`.

### B. Model Registry & Performance
All models are defined in `MODEL_REGISTRY` inside `backend/main.py`:
1. **`hist_gradient_boosting`** *(Recommended)*: Histogram-based Gradient Boosting on PM2.5 delta ($\Delta PM_{2.5}$). $R^2 = 0.820$, $\text{RMSE} = 17.43$, $\text{MAE} = 4.47$.
2. **`random_forest_change`**: Random Forest predicting delta. $R^2 = 0.728$, $\text{RMSE} = 21.40$.
3. **`random_forest_direct`**: Random Forest directly predicting absolute next-hour PM2.5. $R^2 = 0.643$, $\text{RMSE} = 24.52$.
4. **`xgboost_direct`** *(Default)*: XGBoost regressor predicting next-hour PM2.5 directly. Fast inference. $R^2 = 0.460$, $\text{RMSE} = 30.18$.

### C. Master Dataset & Weather Backfilling
- **Source Data:** Continuous Ambient Air Quality Monitoring Station (CAAQMS) records from CPCB/KSPCB across 4 key stations: **BTM Layout (`btm`)**, **Jayanagar (`jayanagar`)**, **Silk Board (`silkboard`)**, and **Peenya (`peenya`)**.
- **Historical Gaps & Open-Meteo:** BTM and Peenya originally had 0 raw ambient temperature (`AT`) readings. `ml/backfill_weather.py` fetches historical meteorological data from Open-Meteo Archive API to fill gaps.
- **Hardware Sensor Glitch Filtering:** Jayanagar's raw temperature sensor experienced severe hardware glitches (clipping at 50.0°C in Aug 2025 and 49°C in Oct 2021). The backfill script explicitly flags readings $> 40^\circ\text{C}$, $< 5^\circ\text{C}$, or diverging $> 7^\circ\text{C}$ from reanalysis as anomalies and replaces them with verified meteorological data.

---

## 📌 3. Key Domain Insights & Operational Gotchas

1. **2022 Post-COVID AQI Rebound:**
   - AQI was ~64 in 2019, dropped to ~49 in 2020 during lockdowns, stayed low (~53) in 2021, and temporarily jumped to ~62 in 2022 before resuming a steady downward trend (~47 in 2025).
   - *Reason:* COVID-19 lockdown restrictions were fully lifted across Bengaluru in 2022, causing normal vehicular and construction activity to abruptly resume.
2. **The "Dust Reduction Paradox" in the Simulator:**
   - Because models predict next-hour PM2.5 and decision trees split on correlated PM10/PM2.5 pairs, artificially slashing PM10 on the simulator while keeping PM2.5 high creates out-of-distribution inputs that can cause predicted PM2.5 to counterintuitively rise. Keep this in mind when debugging simulator logic.
3. **Seasonal Patterns in Bengaluru:**
   - **Monsoon (Jun–Sep):** Cleanest air due to heavy rain washout (PM2.5 ~18–24 µg/m³, AQI ~30–40, *Good*).
   - **Winter (Dec–Feb):** Highest particulate pollution due to nocturnal temperature inversions trapping emissions (PM2.5 ~40–48 µg/m³, AQI ~65–85, *Satisfactory/Moderate*).

---

## 🔌 4. API Endpoints Reference (`backend/main.py`)

- `POST /predict`: Input current atmospheric vector $\rightarrow$ Returns next-hour PM2.5 forecast, AQI, category, confidence interval.
- `POST /explain`: Returns Tree SHAP feature attributions for each input parameter.
- `POST /simulate`: Computes before/after AQI deltas for user percentage reductions and predefined policy scenarios.
- `GET /historical`: Serves station historical time-series data with query params (`station_id`, `year`, `month`, `days`, `fields`, `resample='daily'`).
- `GET /projections/annual`: Serves multi-year trajectory (2019–2029) with actuals for 2019–2025 and linear trend projections for 2026–2029. Supports `station_id` and `season` (`all`, `winter`, `summer`, `monsoon`, `post_monsoon`).
- `GET /stations`: Returns list of monitored Bengaluru stations with coordinates.
- `GET /models`: Returns metadata, approach, and metrics for all trained models.
- `GET /model-metrics`: Returns benchmark metrics for model performance comparisons.

---

## 📝 5. Project Change Log & Work History

> **RULE FOR AI ASSISTANTS:** When you make changes, append a new log entry below with date, summary, files modified, and rationale.

### Entry: 2026-09-05 — Temperature Anomaly Cleaning, Multi-Year Projections Table, Seasonal Toggles, CORS
- **Author / Agent:** Antigravity (Gemini 3.8 Flash)
- **Files Modified:**
  - `ml/backfill_weather.py`: Added sensor glitch detection ($> 40^\circ\text{C}$, $< 5^\circ\text{C}$, or $> 7^\circ\text{C}$ divergence from reanalysis) and local caching (`.cache_weather_*.csv`). Regenerated `ml/data/bengaluru_master.csv`.
  - `backend/main.py`:
    - Updated CORS middleware to dynamically read `ALLOWED_ORIGINS` environment variable with fallback to localhost.
    - Added `GET /projections/annual` endpoint computing ground-truth annual means (2019–2025) and statistical linear forecasts (2026–2029) with optional `station_id` and `season` filtering.
  - `frontend/src/lib/types.ts`: Added `AnnualProjection` interface.
  - `frontend/src/lib/api.ts`: Added `getAnnualProjections(stationId?, season?)`.
  - `frontend/src/components/AnnualProjectionsTable.tsx`: Created new component displaying Year \ Parameter table with:
    - 2019–2025 Empirical Actuals vs 2026–2029 Model Forecasts.
    - Seasonal Segmented Control (`All Year`, `Winter`, `Summer`, `Monsoon`, `Post-Monsoon`).
    - Contextual badges for `2020 (Lockdown Begins)` and `2022 (Lockdown Fully Lifted)`.
    - Historical explanation banner for the 2022 post-COVID rebound.
  - `frontend/src/app/predict/page.tsx`: Embedded `<AnnualProjectionsTable />` beneath the prediction and SHAP diagnostic panels.
  - `frontend/src/components/HistoricalClient.tsx`: Added defensive `temp: 42` clamp to `CAPS` in `capReadings()`.
  - `.gitignore`: Added rules to ignore temporary Open-Meteo cache files (`ml/data/.cache_weather_*.csv`).
- **Rationale:** Resolved unnatural 50°C temperature spikes in Jayanagar historical charts, provided users with long-term 2019–2029 projection capabilities, and configured the backend for cloud deployment (Vercel/Render).
