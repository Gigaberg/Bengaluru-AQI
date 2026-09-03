export type Station = { id: string; name: string; lat: number; lng: number };
export type Reading = { stationId: string; timestamp: string; pm25: number; pm10: number; no2: number; o3: number; co: number; so2?: number; nh3?: number; aqi: number };
export type PredictionInput = { pm25: number; pm10: number; no2: number; o3: number; co: number; so2?: number; nh3?: number; model_id?: string };
export type PredictionResult = { aqi: number; category: string; model: string; model_id: string; pm25_pred: number; confidence?: [number, number] };
export type ExplanationResult = { feature: string; impact: number }[];
export type SimulationInput = { base: PredictionInput; reductions: Partial<Record<keyof PredictionInput, number>> };
export type SimulationResult = { before: number; after: number; improvementPct: number };
export type ModelMetrics = { model: string; mae: number; rmse: number; r2: number };
export type ModelInfo = { id: string; label: string; description: string; approach: string; r2: number; mae: number; rmse: number; default: boolean; recommended: boolean };

// ---------------------------------------------------------------------------
// WAQI (World Air Quality Index) types
// ---------------------------------------------------------------------------
export type WAQIStation = {
  station: string;
  city: string;
  url: string;
  geo: [number, number];
  distance: number;
  established?: string;
};

export type WAQIReadings = {
  aqi: number;
  idx: number;
  city: {
    name: string;
    geo: [number, number];
    url: string;
  };
  dominentpol: string;
  time: {
    iso: string;
    stime: string;
    tz: string;
  };
  iaqi: Record<string, { v: number } | undefined>;
  forecast?: {
    daily: Record<string, Array<{ avg: number; day: string; max: number; min: number }>>;
  };
  attributions?: Array<{ url: string; name: string }>;
};

export type WAQIApiResponse = {
  status: string;
  data: WAQIReadings;
};