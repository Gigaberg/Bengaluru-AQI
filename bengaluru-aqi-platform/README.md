# Bengaluru AQI Intelligence Platform

An advanced Air Quality Index (AQI) prediction, explainability (XAI), and intervention simulation platform tailored for Bengaluru. Built with Next.js, this application provides an interactive "Precision Instrument" dashboard for exploring atmospheric data.

## Features

- **Real-Time Telemetry Dashboard**: Monitor current AQI levels with simulated real-time telemetry from multiple sensor nodes across Bengaluru.
- **Predictive Forecasting**: Utilize machine learning models (simulated via XGBoost/Random Forest mocks) to forecast AQI based on granular pollutant levels (PM2.5, PM10, NO₂, O₃, CO).
- **Explainable AI (XAI)**: Visualize which specific atmospheric features are driving the predictions using SHAP (SHapley Additive exPlanations) diagnostic pulse lines.
- **Simulation Matrix**: Model targeted emission reduction policies interactively to calculate their theoretical impact on the baseline AQI.
- **Performance Metrics**: Compare the efficacy (MAE, RMSE, R²) of various predictive models side-by-side.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS (Custom Dark Instrument UI)
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Current Status

- **Frontend**: The user interface is complete and features a custom, high-density dark aesthetic designed for data analysts.
- **Backend / Data**: Currently operating on mock/simulated data and mathematical approximations. Integration with live sensor APIs and trained ML models is pending.
