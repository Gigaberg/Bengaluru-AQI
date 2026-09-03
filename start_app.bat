@echo off
title Bengaluru AQI Platform Launcher

echo =========================================
echo Starting Bengaluru AQI Platform
echo =========================================

:: Wait for a second
timeout /t 1 /nobreak >nul

:: Start Backend in a new terminal window
echo [1/2] Starting FastAPI Backend...
start "AQI Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Give the backend a couple of seconds to initialize before starting the frontend
timeout /t 2 /nobreak >nul

:: Start Frontend in a new terminal window
echo [2/2] Starting Next.js Frontend...
start "AQI Frontend (Next.js)" cmd /k "cd /d "%~dp0bengaluru-aqi-platform\frontend" && npm run dev"

echo.
echo =========================================
echo Both services are starting up!
echo You can close this launcher window.
echo =========================================
timeout /t 3 /nobreak >nul
