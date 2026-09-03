'use client';
import { PredictionInput } from '@/lib/types';
import { useState } from 'react';

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
  so2:  number | null;
  nh3:  number | null;
};

const FIELDS: {
  id:       keyof FormValues;
  label:    string;
  unit:     string;
  step:     string;
  required: boolean;
  hint?:    string;
}[] = [
  { id: 'pm25', label: 'PM2.5',  unit: 'µg/m³', step: '0.1',  required: true  },
  { id: 'pm10', label: 'PM10',   unit: 'µg/m³', step: '0.1',  required: true  },
  { id: 'no2',  label: 'NO₂',    unit: 'µg/m³', step: '0.1',  required: false, hint: 'recommended' },
  { id: 'o3',   label: 'O₃',     unit: 'µg/m³', step: '0.1',  required: false, hint: 'recommended' },
  { id: 'co',   label: 'CO',     unit: 'mg/m³', step: '0.01', required: false, hint: 'recommended' },
  { id: 'so2',  label: 'SO₂',    unit: 'µg/m³', step: '0.1',  required: false, hint: 'optional'    },
  { id: 'nh3',  label: 'NH₃',    unit: 'µg/m³', step: '0.1',  required: false, hint: 'optional'    },
];

export function PollutantInputForm({ initialValues, onSubmit, loading }: PollutantInputFormProps) {
  const [values, setValues] = useState<FormValues>({
    pm25: initialValues?.pm25 ?? null,
    pm10: initialValues?.pm10 ?? null,
    no2:  initialValues?.no2  ?? null,
    o3:   initialValues?.o3   ?? null,
    co:   initialValues?.co   ?? null,
    so2:  initialValues?.so2  ?? null,
    nh3:  initialValues?.nh3  ?? null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value === '' ? null : Math.max(0, parseFloat(value)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Required fields must be filled — guarded by HTML required + this check
    if (values.pm25 === null || values.pm10 === null) return;
    const payload: PredictionInput = {
      pm25: values.pm25,
      pm10: values.pm10,
      no2:  values.no2  ?? undefined,
      o3:   values.o3   ?? undefined,
      co:   values.co   ?? undefined,
      so2:  values.so2  ?? undefined,
      nh3:  values.nh3  ?? undefined,
    };
    onSubmit(payload);
  };

  const hintCls: Record<string, string> = {
    recommended: 'text-amber-500 dark:text-amber-400',
    optional:    'text-[#86868b] dark:text-[#98989d]',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-steel">Required</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-steel">Recommended — defaults to training median if omitted</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#86868b]" />
          <span className="text-steel">Optional</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {FIELDS.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-white mb-1">
              {field.label}
              {field.hint && (
                <span className={`text-[10px] uppercase tracking-wide font-semibold ${hintCls[field.hint]}`}>
                  {field.hint}
                </span>
              )}
              {field.required && (
                <span className="text-blue-500 text-xs">*</span>
              )}
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                name={field.id}
                id={field.id}
                step={field.step}
                min="0"
                required={field.required}
                placeholder={field.required ? '0' : 'leave blank for default'}
                value={values[field.id] ?? ''}
                onChange={handleChange}
                className="block w-full rounded-2xl bg-white dark:bg-white/5 border-none text-[#1d1d1f] dark:text-white pl-4 pr-16 py-3 focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-shadow placeholder:text-[#c0c0c0] dark:placeholder:text-[#48484a] placeholder:text-xs"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-[#86868b] dark:text-[#98989d] sm:text-sm font-medium">{field.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex justify-center rounded-full border border-transparent bg-blue-600 py-3 px-8 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Predicting...' : 'Predict AQI'}
        </button>
      </div>
    </form>
  );
}
