# AI Assistant Instructions & Workspace Rules

Welcome! This repository is the **Bengaluru Air Quality Index (AQI) Intelligence & Machine Learning Platform**.

## 🚨 MANDATORY INSTRUCTIONS FOR ALL AI CODING AGENTS

### 1. Mandatory First Step: Read `progress.md`
Before investigating code, proposing plans, or writing modifications, you **MUST** read [`progress.md`](file:///c:/Projects/ML%20Project/progress.md).
It contains:
- Complete system architecture (FastAPI backend + Next.js 15 frontend + ML pipeline).
- Model registry and prediction target nuances (`PM25_next_1h` vs CPCB AQI).
- Sensor data processing quirks (Open-Meteo backfilling, glitch thresholds).
- Historical domain context (2022 post-COVID rebound, seasonal dynamics).
- API routes and frontend component structure.

### 2. Mandatory Change Logging: Update `progress.md`
Every time you make code changes, add features, or fix bugs in this repository:
- You **MUST** append a new log entry to the **"Project Change Log & Work History"** section at the bottom of [`progress.md`](file:///c:/Projects/ML%20Project/progress.md).
- Include: Date, Summary, Files Modified, and Technical Rationale.
- This ensures any subsequent AI session can immediately resume work with full context without re-analyzing the entire codebase.

### 3. Architecture Rules
- **Backend:** FastAPI in `backend/main.py`. Runs on port 8000. Reads models from `ml/models/` and historical data from `ml/data/bengaluru_master.csv`.
- **Frontend:** Next.js 15 App Router in `frontend/`. Runs on port 3000. Connects to backend via `NEXT_PUBLIC_API_URL`.
- **Styling:** Dark mode obsidian/graphite aesthetic with Tailwind CSS and JetBrains Mono / Inter typography. Maintain visual consistency.
