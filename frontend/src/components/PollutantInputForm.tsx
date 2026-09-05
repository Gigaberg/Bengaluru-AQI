'use client';
import { PredictionInput } from '@/lib/types';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface PollutantInputFormProps {
  initialValues?: Partial<PredictionInput>;
  onSubmit: (values: PredictionInput) => void;
  loading?: boolean;
}

// null means "not entered" — backend will use training-set median
type FormValues = {
  pm25: number | null;
  pm10: number | null;
  no2:  number | null;
  o3:   number | null;
  co:   number | null;
  temp: number | null;
  rh:   number | null;
  ws:   number | null;
  wd:   number | null;
  rf:   number | null;
  so2:  number | null;
  nh3:  number | null;
};

type FieldDef = {
  id:       keyof FormValues;
  label:    string;
  unit:     string;
  step:     string;
  required: boolean;
  group:    'required' | 'pollutant' | 'weather' | 'extra';
};

// ── Field definitions ────────────────────────────────────────────────────────
const REQUIRED_FIELDS: FieldDef[] = [
  { id: 'pm25', label: 'PM2.5', unit: 'µg/m³', step: '0.1', required: true,  group: 'required' },
  { id: 'pm10', label: 'PM10',  unit: 'µg/m³', step: '0.1', required: true,  group: 'required' },
];

const POLLUTANT_FIELDS: FieldDef[] = [
  { id: 'no2', label: 'NO₂',        unit: 'µg/m³', step: '0.1',  required: false, group: 'pollutant' },
  { id: 'co',  label: 'CO',         unit: 'mg/m³', step: '0.01', required: false, group: 'pollutant' },
  { id: 'o3',  label: 'O₃ (Ozone)', unit: 'µg/m³', step: '0.1',  required: false, group: 'pollutant' },
];

const WEATHER_FIELDS: FieldDef[] = [
  { id: 'temp', label: 'Temperature',      unit: '°C',  step: '0.1', required: false, group: 'weather' },
  { id: 'rh',   label: 'Relative Humidity', unit: '%',   step: '0.1', required: false, group: 'weather' },
  { id: 'ws',   label: 'Wind Speed',       unit: 'm/s', step: '0.1', required: false, group: 'weather' },
  { id: 'wd',   label: 'Wind Direction',   unit: '°',   step: '1',   required: false, group: 'weather' },
  { id: 'rf',   label: 'Rainfall',         unit: 'mm',  step: '0.1', required: false, group: 'weather' },
];

const EXTRA_FIELDS: FieldDef[] = [
  { id: 'so2', label: 'SO₂', unit: 'µg/m³', step: '0.1', required: false, group: 'extra' },
  { id: 'nh3', label: 'NH₃', unit: 'µg/m³', step: '0.1', required: false, group: 'extra' },
];

// All optional keys that contribute to accuracy
const OPTIONAL_KEYS: (keyof FormValues)[] = ['no2', 'co', 'o3', 'temp', 'rh', 'ws', 'wd', 'rf', 'so2', 'nh3'];

const GROUP_META: Record<string, { title: string; icon: string; color: string; dotColor: string; subtitle: string }> = {
  required: {
    title: 'Required Parameters',
    icon: '📊',
    color: 'text-blue-400',
    dotColor: 'bg-blue-500',
    subtitle: 'These are mandatory for prediction',
  },
  pollutant: {
    title: 'Pollutant Concentrations',
    icon: '🔬',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
    subtitle: 'Improves accuracy — defaults to training median if omitted',
  },
  weather: {
    title: 'Meteorological Conditions',
    icon: '🌤️',
    color: 'text-cyan-400',
    dotColor: 'bg-cyan-500',
    subtitle: 'Weather data significantly improves prediction quality',
  },
  extra: {
    title: 'Additional Parameters',
    icon: '➕',
    color: 'text-[#86868b]',
    dotColor: 'bg-[#86868b]',
    subtitle: 'Defaults to training-set median if omitted',
  },
};

// ── Accuracy tier labels ─────────────────────────────────────────────────────
function getAccuracyTier(filled: number): { label: string; color: string; bgColor: string; barColor: string } {
  if (filled === 0) return { label: 'Basic',     color: 'text-red-400',     bgColor: 'bg-red-500/10',     barColor: 'bg-red-500' };
  if (filled <= 3)  return { label: 'Fair',      color: 'text-amber-400',   bgColor: 'bg-amber-500/10',   barColor: 'bg-amber-500' };
  if (filled <= 6)  return { label: 'Good',      color: 'text-yellow-400',  bgColor: 'bg-yellow-500/10',  barColor: 'bg-yellow-500' };
  if (filled <= 9)  return { label: 'Very Good', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', barColor: 'bg-emerald-500' };
  return                    { label: 'Excellent', color: 'text-emerald-300', bgColor: 'bg-emerald-500/15', barColor: 'bg-emerald-400' };
}

export function PollutantInputForm({ initialValues, onSubmit, loading }: PollutantInputFormProps) {
  const [values, setValues] = useState<FormValues>({
    pm25: initialValues?.pm25 ?? null,
    pm10: initialValues?.pm10 ?? null,
    no2:  initialValues?.no2  ?? null,
    o3:   initialValues?.o3   ?? null,
    co:   initialValues?.co   ?? null,
    temp: initialValues?.temp ?? null,
    rh:   initialValues?.rh   ?? null,
    ws:   initialValues?.ws   ?? null,
    wd:   initialValues?.wd   ?? null,
    rf:   initialValues?.rf   ?? null,
    so2:  initialValues?.so2  ?? null,
    nh3:  initialValues?.nh3  ?? null,
  });

  const [showExtra, setShowExtra] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value),
    }));
  };

  // Only PM2.5 and PM10 are truly required
  const canSubmit = values.pm25 !== null && values.pm10 !== null;

  // Accuracy meter
  const optionalFilled = OPTIONAL_KEYS.filter(k => values[k] !== null).length;
  const tier = getAccuracyTier(optionalFilled);
  const pct = Math.round((optionalFilled / OPTIONAL_KEYS.length) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload: PredictionInput = {
      pm25: values.pm25!,
      pm10: values.pm10!,
      no2:  values.no2  ?? undefined,
      o3:   values.o3   ?? undefined,
      co:   values.co   ?? undefined,
      temp: values.temp ?? undefined,
      rh:   values.rh   ?? undefined,
      ws:   values.ws   ?? undefined,
      wd:   values.wd   ?? undefined,
      rf:   values.rf   ?? undefined,
      so2:  values.so2  ?? undefined,
      nh3:  values.nh3  ?? undefined,
    };
    onSubmit(payload);
  };

  const renderFieldGroup = (fields: FieldDef[], groupKey: string) => {
    const meta = GROUP_META[groupKey];
    return (
      <div key={groupKey}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
          <h3 className={`text-xs font-mono uppercase tracking-widest font-semibold ${meta.color}`}>
            {meta.icon} {meta.title}
          </h3>
        </div>
        <p className="text-[11px] text-steel mb-4 ml-4 font-mono">{meta.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-white mb-1">
                {field.label}
                {field.required && (
                  <span className="text-red-400 text-xs font-bold">*</span>
                )}
                {!field.required && values[field.id] !== null && (
                  <span className="text-emerald-500 text-[10px]">✓</span>
                )}
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  name={field.id}
                  id={field.id}
                  step={field.step}
                  required={field.required}
                  placeholder={field.required ? 'required' : 'optional — improves accuracy'}
                  value={values[field.id] ?? ''}
                  onChange={handleChange}
                  className={`block w-full rounded-2xl bg-white dark:bg-white/5 border text-[#1d1d1f] dark:text-white pl-4 pr-16 py-3 focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all placeholder:text-[#c0c0c0] dark:placeholder:text-[#48484a] placeholder:text-xs ${
                    field.required && values[field.id] !== null
                      ? 'border-emerald-500/40'
                      : !field.required && values[field.id] !== null
                      ? 'border-emerald-500/30'
                      : 'border-carbon'
                  }`}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="text-[#86868b] dark:text-[#98989d] sm:text-sm font-medium">{field.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Accuracy meter ── */}
      <div className={`rounded-xl border border-carbon p-4 ${tier.bgColor} transition-colors`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-steel">PREDICTION ACCURACY</span>
            <span className={`font-semibold ${tier.color}`}>{tier.label.toUpperCase()}</span>
          </div>
          <span className="font-mono text-xs text-steel">
            {optionalFilled}/{OPTIONAL_KEYS.length} optional params
          </span>
        </div>
        <div className="w-full h-1.5 bg-carbon rounded-full overflow-hidden">
          <div
            className={`h-full ${tier.barColor} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(5, pct)}%` }}
          />
        </div>
        <p className="text-[11px] text-steel mt-2 font-mono">
          {optionalFilled === 0
            ? 'Add pollutant & weather data for more accurate predictions'
            : optionalFilled < OPTIONAL_KEYS.length
            ? 'More parameters = better prediction — fill in what you have'
            : 'All parameters provided — maximum prediction accuracy'}
        </p>
      </div>

      {/* ── Required section ── */}
      {renderFieldGroup(REQUIRED_FIELDS, 'required')}

      <div className="border-t border-carbon" />

      {/* ── Pollutant section ── */}
      {renderFieldGroup(POLLUTANT_FIELDS, 'pollutant')}

      <div className="border-t border-carbon" />

      {/* ── Weather section ── */}
      {renderFieldGroup(WEATHER_FIELDS, 'weather')}

      {/* ── Extra (collapsible) ── */}
      <div className="border-t border-carbon pt-4">
        <button
          type="button"
          onClick={() => setShowExtra(o => !o)}
          className="flex items-center gap-2 text-xs font-mono text-steel hover:text-eink transition-colors"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${showExtra ? 'rotate-180' : ''}`} />
          Additional parameters (SO₂, NH₃) — optional
        </button>
        {showExtra && (
          <div className="mt-4">
            {renderFieldGroup(EXTRA_FIELDS, 'extra')}
          </div>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
        {!canSubmit && (
          <p className="text-xs font-mono text-amber-400">
            ⚠ PM2.5 and PM10 are required
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full sm:w-auto inline-flex justify-center rounded-full border border-transparent bg-blue-600 py-3 px-8 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
        >
          {loading ? 'Predicting...' : 'Predict AQI →'}
        </button>
      </div>
    </form>
  );
}
