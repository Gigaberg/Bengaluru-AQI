'use client';
import { useState, useEffect } from 'react';
import { predictAQI, getExplanation, getModels } from '@/lib/api';
import { PredictionInput, PredictionResult, ExplanationResult, ModelInfo } from '@/lib/types';
import { PollutantInputForm } from '@/components/PollutantInputForm';
import { SignedContributionChart } from '@/components/SignedContributionChart';
import { AQIBadge } from '@/components/AQIBadge';
import { getAQIColor } from '@/lib/aqi';
import { Activity, Star, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Model Selector
// ---------------------------------------------------------------------------
function ModelSelector({
  models,
  selected,
  onChange,
}: {
  models: ModelInfo[];
  selected: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = models.find(m => m.id === selected);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 bg-obsidian border border-carbon rounded-xl px-4 py-3 text-left hover:border-blue-500/50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-eink truncate">{current?.label ?? 'Select model'}</span>
            {current?.recommended && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                <Star className="h-2.5 w-2.5" /> Best
              </span>
            )}
          </div>
          <div className="text-xs text-steel mt-0.5 truncate">{current?.description}</div>
        </div>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-steel transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 w-full bg-obsidian border border-carbon rounded-xl shadow-2xl overflow-hidden"
          role="listbox"
        >
          {models.map(m => {
            const isSelected = m.id === selected;
            return (
              <button
                key={m.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(m.id); setOpen(false); }}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5
                  ${isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-eink">{m.label}</span>
                    {m.recommended && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                        <Star className="h-2.5 w-2.5" /> Best
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-steel mt-0.5 leading-relaxed">{m.description}</p>
                  {/* Metric pills */}
                  <div className="flex gap-3 mt-2 font-mono text-[10px] text-steel">
                    <span>R² <span className="text-eink">{m.r2.toFixed(3)}</span></span>
                    <span>MAE <span className="text-eink">{m.mae.toFixed(2)}</span></span>
                    <span>RMSE <span className="text-eink">{m.rmse.toFixed(2)}</span></span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PredictPage() {
  const [models, setModels]           = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('xgboost_direct');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<PredictionResult | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [error, setError]             = useState<string | null>(null);

  // Load available models on mount
  useEffect(() => {
    getModels()
      .then(ms => {
        setModels(ms);
        // Default to recommended model if available
        const recommended = ms.find(m => m.recommended);
        if (recommended) setSelectedModel(recommended.id);
      })
      .catch(console.error);
  }, []);

  const handlePredict = async (values: PredictionInput) => {
    setLoading(true);
    setError(null);
    try {
      const inputWithModel: PredictionInput = { ...values, model_id: selectedModel };
      const [predResult, explResult] = await Promise.all([
        predictAQI(inputWithModel),
        getExplanation(inputWithModel),
      ]);
      setResult(predResult);
      setExplanation(explResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const topContributor = explanation?.length
    ? explanation.reduce((a, b) => Math.abs(a.impact) > Math.abs(b.impact) ? a : b)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold font-mono text-eink tracking-tight uppercase">Telemetry Forecast</h1>
        <p className="text-lg text-steel mt-3 max-w-2xl mx-auto">
          Input atmospheric parameters to generate an AQI forecast. XAI diagnostics will break down feature attributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---- Left: inputs + SHAP ---- */}
        <div className="lg:col-span-2 space-y-8">

          {/* Model selector */}
          <div className="bg-graphite border border-carbon p-6 rounded-2xl transition-colors duration-300">
            <h2 className="text-sm font-mono text-steel uppercase tracking-widest mb-4 border-b border-carbon pb-2">
              Select Model
            </h2>
            {models.length > 0 ? (
              <ModelSelector models={models} selected={selectedModel} onChange={setSelectedModel} />
            ) : (
              <div className="h-16 skeleton-shimmer rounded-xl opacity-40" />
            )}
          </div>

          {/* Pollutant inputs */}
          <div className="bg-graphite border border-carbon p-6 md:p-10 rounded-2xl transition-colors duration-300">
            <h2 className="text-sm font-mono text-steel uppercase tracking-widest mb-6 border-b border-carbon pb-2">Sensor Parameters</h2>
            <PollutantInputForm onSubmit={handlePredict} loading={loading} />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 font-mono">
              ERROR: {error}
            </div>
          )}

          {/* SHAP */}
          {result && explanation && (
            <div className="bg-graphite border border-carbon p-6 md:p-10 rounded-2xl transition-colors duration-300 min-w-0">
              <h2 className="text-sm font-mono text-steel uppercase tracking-widest mb-6 border-b border-carbon pb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Diagnostic Readout (SHAP)
              </h2>
              <SignedContributionChart data={explanation} loading={loading} />
              <div className="mt-8 p-4 bg-obsidian border border-carbon rounded font-mono text-xs text-steel">
                <span className="text-emerald-400">SYS_LOG: </span>
                {topContributor
                  ? `Primary driver: [${topContributor.feature.toUpperCase()}] — ${topContributor.impact > 0 ? '+' : ''}${topContributor.impact.toFixed(2)} µg/m³ impact on PM2.5 forecast.`
                  : 'Feature contributions are balanced across inputs.'}
              </div>
            </div>
          )}
        </div>

        {/* ---- Right: output panel ---- */}
        <div className="lg:col-span-1">
          <div className="bg-graphite border border-carbon p-6 md:p-8 rounded-2xl transition-colors duration-300 lg:sticky lg:top-24 space-y-6">
            <h2 className="text-sm font-mono text-steel uppercase tracking-widest border-b border-carbon pb-2">Prediction Output</h2>

            {!result && !loading && (
              <div className="text-steel font-mono text-xs text-center py-12 border border-dashed border-carbon rounded bg-obsidian/50">
                AWAITING_INPUT...
              </div>
            )}

            {loading && (
              <div className="space-y-4 skeleton-shimmer p-4 rounded-xl h-48 opacity-50" />
            )}

            {result && !loading && (
              <>
                {/* AQI display */}
                <div className="p-8 rounded bg-obsidian border border-carbon text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 blur-2xl" style={{ backgroundColor: getAQIColor(result.aqi) }} />
                  <div className="relative z-10">
                    <div className="text-[10px] font-mono text-steel mb-2 uppercase tracking-[0.2em]">Forecast Index</div>
                    <div className="text-7xl font-numeric text-eink mb-4 telemetry-glow" style={{ color: getAQIColor(result.aqi) }}>
                      {result.aqi}
                    </div>
                    <AQIBadge value={result.aqi} />
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-3 font-mono text-xs border-t border-carbon pt-4">
                  <div className="flex justify-between">
                    <span className="text-steel">MODEL_REF</span>
                    <span className="text-eink text-right max-w-[55%] truncate" title={result.model}>{result.model.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel">PM2.5_PRED</span>
                    <span className="text-eink">{result.pm25_pred} µg/m³</span>
                  </div>
                  {result.confidence && (
                    <div className="flex justify-between">
                      <span className="text-steel">CONF_INTERVAL</span>
                      <span className="text-eink">[{result.confidence[0]}, {result.confidence[1]}]</span>
                    </div>
                  )}
                  {/* Model R² as a quick quality indicator */}
                  {models.length > 0 && (() => {
                    const m = models.find(m => m.id === result.model_id);
                    return m ? (
                      <div className="flex justify-between">
                        <span className="text-steel">MODEL_R²</span>
                        <span className="text-eink">{m.r2.toFixed(3)}</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
