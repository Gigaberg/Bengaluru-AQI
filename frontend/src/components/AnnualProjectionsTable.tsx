'use client';
import { useState, useEffect } from 'react';
import { getAnnualProjections, getStations } from '@/lib/api';
import { AnnualProjection, Station } from '@/lib/types';
import { getAQIColor } from '@/lib/aqi';
import {
  Calendar, TrendingUp, Sparkles, Database, CheckCircle2,
  SlidersHorizontal, Sun, CloudRain, Snowflake, Leaf, Globe, Info
} from 'lucide-react';

const SEASONS = [
  { id: 'all',          label: 'All Year',      sub: 'Annual Mean', icon: Globe },
  { id: 'winter',       label: 'Winter',        sub: 'Dec–Feb',     icon: Snowflake },
  { id: 'summer',       label: 'Summer',        sub: 'Mar–May',     icon: Sun },
  { id: 'monsoon',      label: 'Monsoon',       sub: 'Jun–Sep',     icon: CloudRain },
  { id: 'post_monsoon', label: 'Post-Monsoon',  sub: 'Oct–Nov',     icon: Leaf },
] as const;

export function AnnualProjectionsTable() {
  const [data, setData] = useState<AnnualProjection[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Fetch stations on mount
  useEffect(() => {
    getStations()
      .then(setStations)
      .catch(console.error);
  }, []);

  // Fetch annual projections when station or season changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnnualProjections(selectedStation || undefined, selectedSeason)
      .then(res => {
        if (!cancelled) setData(res);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedStation, selectedSeason]);

  const activeSeasonMeta = SEASONS.find(s => s.id === selectedSeason);

  return (
    <div className="bg-graphite border border-carbon p-6 md:p-10 rounded-2xl transition-colors duration-300 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-carbon pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 uppercase tracking-widest">
              <TrendingUp className="h-3 w-3" /> Multi-Year Atmospheric Trajectory
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400">
              <Database className="h-2.5 w-2.5" /> 2019–2025 Actuals
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/5 text-purple-400">
              <Sparkles className="h-2.5 w-2.5" /> 2026–2029 Forecast
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold font-mono text-eink tracking-tight uppercase">
            Trajectory Matrix (2019 – 2029)
          </h2>
          <p className="text-xs text-steel mt-1 font-sans">
            Showing <span className="text-eink font-semibold">{activeSeasonMeta?.label} ({activeSeasonMeta?.sub})</span> air quality data and multi-year trend forecasts.
          </p>
        </div>

        {/* Station switcher */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-steel flex-shrink-0" />
          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            className="bg-obsidian border border-carbon text-eink text-xs font-mono rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="">City-Wide Average (All Stations)</option>
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Season Toggle Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-steel uppercase tracking-wider mr-1">Season:</span>
        <div className="inline-flex p-1 rounded-xl bg-obsidian border border-carbon gap-1 flex-wrap">
          {SEASONS.map(s => {
            const Icon = s.icon;
            const isSelected = selectedSeason === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSeason(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/30'
                    : 'text-steel hover:text-eink hover:bg-white/5'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-steel'}`} />
                <span>{s.label}</span>
                <span className={`text-[10px] opacity-75 hidden sm:inline ${isSelected ? 'text-blue-100' : 'text-steel/70'}`}>
                  ({s.sub})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table container */}
      <div className="relative overflow-x-auto rounded-xl border border-carbon bg-obsidian">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-steel">Computing seasonal aggregates and trend projections…</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-left font-mono text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-carbon bg-white/[0.03]">
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider">
                  Year \ Parameter
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-center">
                  Status
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-center">
                  AQI Index
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-center">
                  CPCB Band
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-right">
                  PM2.5 <span className="text-[10px] text-steel/60">(µg/m³)</span>
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-right">
                  PM10 <span className="text-[10px] text-steel/60">(µg/m³)</span>
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-right">
                  NO₂ <span className="text-[10px] text-steel/60">(µg/m³)</span>
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-right">
                  Temp <span className="text-[10px] text-steel/60">(°C)</span>
                </th>
                <th className="p-3.5 text-steel uppercase font-semibold text-[11px] tracking-wider text-right">
                  Humidity <span className="text-[10px] text-steel/60">(%)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const isProjected = row.type === 'projected';
                const isFirstProjected = isProjected && idx > 0 && data[idx - 1].type === 'actual';
                const color = getAQIColor(row.aqi);

                return (
                  <tr
                    key={row.year}
                    className={`border-b border-carbon/60 transition-colors ${
                      isFirstProjected ? 'border-t-2 border-t-purple-500/40 ' : ''
                    }${
                      isProjected
                        ? 'bg-purple-950/15 hover:bg-purple-950/25 text-purple-200'
                        : 'hover:bg-white/[0.02] text-eink'
                    }`}
                  >
                    {/* Year */}
                    <td className="p-3.5 font-bold">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${isProjected ? 'text-purple-300' : 'text-eink'}`}>
                          {row.year}
                        </span>
                        {isProjected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider flex items-center gap-0.5">
                            <Sparkles className="h-2 w-2" /> Model
                          </span>
                        )}
                        {row.year === 2022 && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-normal cursor-help"
                            title="COVID-19 lockdowns were fully lifted across Bengaluru in 2022, resulting in a temporary post-pandemic emissions rebound."
                          >
                            Lockdown Fully Lifted
                          </span>
                        )}
                        {row.year === 2020 && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 uppercase tracking-wider font-normal cursor-help"
                            title="Initial nationwide COVID-19 pandemic lockdowns significantly reduced vehicular and industrial emissions."
                          >
                            Lockdown Begins
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      {isProjected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                          <Sparkles className="h-2.5 w-2.5" /> Projected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Empirical
                        </span>
                      )}
                    </td>

                    {/* AQI */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-numeric font-bold text-sm text-eink">{row.aqi}</span>
                      </div>
                    </td>

                    {/* CPCB Band */}
                    <td className="p-3.5 text-center">
                      <span
                        className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
                        style={{
                          color,
                          backgroundColor: `${color}18`,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {row.category}
                      </span>
                    </td>

                    {/* PM2.5 */}
                    <td className="p-3.5 text-right font-numeric text-eink">
                      {row.pm25 != null ? row.pm25.toFixed(1) : '—'}
                    </td>

                    {/* PM10 */}
                    <td className="p-3.5 text-right font-numeric text-eink">
                      {row.pm10 != null ? row.pm10.toFixed(1) : '—'}
                    </td>

                    {/* NO2 */}
                    <td className="p-3.5 text-right font-numeric text-eink">
                      {row.no2 != null ? row.no2.toFixed(1) : '—'}
                    </td>

                    {/* Temperature */}
                    <td className="p-3.5 text-right font-numeric text-eink">
                      {row.temp != null ? `${row.temp.toFixed(1)}°C` : '—'}
                    </td>

                    {/* Humidity */}
                    <td className="p-3.5 text-right font-numeric text-eink">
                      {row.rh != null ? `${row.rh.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Historical Context / Footnotes */}
      <div className="space-y-3 border-t border-carbon/60 pt-4 font-mono text-[11px] text-steel">
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-amber-300">
          <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-amber-200">2022 Post-COVID Rebound:</strong> In 2022, COVID-19 lockdown restrictions were fully lifted across Bengaluru, prompting a complete return of vehicular traffic, commercial activity, and construction. This accounts for the temporary rise in AQI (e.g. 62 vs 53 in 2021) before the multi-year downward trajectory resumed in 2023–2025.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-steel/80 pt-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <span>Years 2019–2025: Ground monitor arithmetic means filtered by {activeSeasonMeta?.label}.</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
            <span>Years 2026–2029: Empirical seasonal time-series trend projections.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
