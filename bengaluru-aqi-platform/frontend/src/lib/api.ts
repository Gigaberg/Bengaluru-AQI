/**
 * API layer — connects to the FastAPI backend at localhost:8000.
 *
 * All functions previously returned mock data. They now hit real endpoints
 * that serve CPCB 2024 historical readings and XGBoost ML predictions.
 *
 * If the backend is unreachable a clear error is thrown so the UI can show
 * an appropriate message rather than silently returning wrong data.
 */

import { Station, Reading, PredictionInput, PredictionResult, ExplanationResult, SimulationInput, SimulationResult, ModelMetrics, ModelInfo } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status} ${path}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------
export async function getStations(): Promise<Station[]> {
  return apiFetch<Station[]>('/stations');
}

// ---------------------------------------------------------------------------
// Historical data
// ---------------------------------------------------------------------------
// Historical data
// ---------------------------------------------------------------------------
export async function getHistorical(
  stationId?: string,
  options?: { year?: number; month?: number; days?: number; fields?: string }
): Promise<Reading[]> {
  const params = new URLSearchParams();
  if (stationId) params.set('station_id', stationId);
  if (options?.year)  params.set('year',  String(options.year));
  if (options?.month) params.set('month', String(options.month));
  // If a year is selected, skip the days window (backend handles it)
  if (!options?.year) params.set('days', String(options?.days ?? 30));
  if (options?.fields) params.set('fields', options.fields);
  return apiFetch<Reading[]>(`/historical?${params.toString()}`);
}

export async function getAvailableYears(): Promise<number[]> {
  return apiFetch<number[]>('/historical/years');
}

// ---------------------------------------------------------------------------
// AQI Prediction
// ---------------------------------------------------------------------------
export async function predictAQI(inputs: PredictionInput): Promise<PredictionResult> {
  const body = {
    pm25:     inputs.pm25,
    pm10:     inputs.pm10,
    no2:      inputs.no2,
    o3:       inputs.o3,
    co:       inputs.co,
    so2:      inputs.so2  ?? null,
    nh3:      inputs.nh3  ?? null,
    model_id: inputs.model_id ?? null,
  };
  return apiFetch<PredictionResult>('/predict', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// SHAP Explanation
// ---------------------------------------------------------------------------
export async function getExplanation(inputs: PredictionInput): Promise<ExplanationResult> {
  const body = {
    pm25:     inputs.pm25,
    pm10:     inputs.pm10,
    no2:      inputs.no2,
    o3:       inputs.o3,
    co:       inputs.co,
    so2:      inputs.so2  ?? null,
    nh3:      inputs.nh3  ?? null,
    model_id: inputs.model_id ?? null,
  };
  return apiFetch<ExplanationResult>('/explain', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Available Models
// ---------------------------------------------------------------------------
export async function getModels(): Promise<ModelInfo[]> {
  return apiFetch<ModelInfo[]>('/models');
}

// ---------------------------------------------------------------------------
// Intervention Simulation
// ---------------------------------------------------------------------------
export async function simulateIntervention(
  inputs: SimulationInput
): Promise<{ result: SimulationResult; scenarios: Array<{ name: string; description: string; baseAqi: number; newAqi: number; adjustments: Record<string, number> }> }> {
  const body = {
    base: {
      pm25: inputs.base.pm25,
      pm10: inputs.base.pm10,
      no2:  inputs.base.no2,
      o3:   inputs.base.o3,
      co:   inputs.base.co,
      so2:  inputs.base.so2 ?? null,
      nh3:  inputs.base.nh3 ?? null,
    },
    reductions: inputs.reductions,
  };
  return apiFetch('/simulate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Model Metrics
// ---------------------------------------------------------------------------
export async function getModelMetrics(): Promise<ModelMetrics[]> {
  return apiFetch<ModelMetrics[]>('/model-metrics');
}
