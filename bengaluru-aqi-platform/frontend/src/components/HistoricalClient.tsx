'use client';
import { useState, useEffect, useMemo } from 'react';
import { getHistorical } from '@/lib/api';
import { Station, Reading } from '@/lib/types';
import dynamic from 'next/dynamic';
const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart').then(m => m.TimeSeriesChart), { ssr: false });
const BarComparisonChart = dynamic(() => import('@/components/BarComparisonChart').then(m => m.BarComparisonChart), { ssr: false });
import { Filter } from 'lucide-react';
import { format } from 'date-fns';

interface HistoricalClientProps {
  initialStations: Station[];
  initialSelectedStation: string;
}

/**
 * CPCB valid ranges — values beyond these are sensor errors.
 * Capping prevents single anomalous readings from skewing the entire chart.
 */
const CAPS: Partial<Record<keyof Reading, number>> = {
  aqi:  500,
  pm25: 500,
  pm10: 500,
  no2:  200,
  o3:   200,
  co:   10,
};

function capReadings(readings: Reading[]): Reading[] {
  return readings.map(r => {
    const cleaned = { ...r };
    for (const [key, max] of Object.entries(CAPS)) {
      const val = cleaned[key as keyof Reading];
      if (typeof val === 'number') {
        // Sentinel values like 999.99 are sensor-reset artifacts — null them out
        if (val >= 999) {
          (cleaned as unknown as Record<string, number | null>)[key] = null;
        } else if (val > max) {
          (cleaned as unknown as Record<string, number>)[key] = max;
        }
      }
    }
    return cleaned;
  });
}

/** Group readings by year, return sorted year entries. */
function groupByYear(readings: Reading[]): { year: number; readings: Reading[] }[] {
  const map = new Map<number, Reading[]>();
  for (const r of readings) {
    const year = new Date(r.timestamp).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(r);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, readings]) => ({ year, readings }));
}

export function HistoricalClient({ initialStations, initialSelectedStation }: HistoricalClientProps) {
  const [stations] = useState<Station[]>(initialStations);
  const [selectedStation, setSelectedStation] = useState<string>(initialSelectedStation);
  const [allReadings, setAllReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all historical data for the selected station (no year/month filter)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await getHistorical(selectedStation, { days: 2500, fields: 'aqi,pm25,pm10' });
        if (!cancelled) setAllReadings(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedStation]);

  // Cap outliers and group by year
  const cleanedReadings = useMemo(() => capReadings(allReadings), [allReadings]);
  const yearGroups = useMemo(() => groupByYear(cleanedReadings), [cleanedReadings]);

  // Helper: compute monthly averages for a set of readings
  function computeMonthlyAvg(readings: Reading[]) {
    const byMonth: Record<string, { aqi: number[]; pm25: number[]; pm10: number[] }> = {};
    for (const r of readings) {
      const month = format(new Date(r.timestamp), 'MMM');
      if (!byMonth[month]) byMonth[month] = { aqi: [], pm25: [], pm10: [] };
      if (r.aqi  != null) byMonth[month].aqi.push(r.aqi);
      if (r.pm25 != null) byMonth[month].pm25.push(r.pm25);
      if (r.pm10 != null) byMonth[month].pm10.push(r.pm10);
    }
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder
      .filter(m => byMonth[m])
      .map(m => ({
        name: m,
        aqi:  avg(byMonth[m].aqi),
        pm25: avg(byMonth[m].pm25),
        pm10: avg(byMonth[m].pm10),
      }));
  }

  // Bar chart: monthly averages across all years
  const monthlyBarData = useMemo(() => computeMonthlyAvg(cleanedReadings), [cleanedReadings]);

  // Per-year monthly bar data
  const yearMonthlyBarData = useMemo(() =>
    yearGroups.map(({ year, readings }) => ({ year, data: computeMonthlyAvg(readings) })),
    [yearGroups]
  );

  const selectCls = "bg-white dark:bg-[#2c2c2e] border-none text-[#1d1d1f] dark:text-white rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
          Historical Analysis
        </h1>
        <p className="text-lg text-[#86868b] dark:text-[#98989d] mt-2 max-w-2xl mx-auto">
          Yearly trends for all available data — every year displayed at once.
        </p>
      </div>

      {/* Station Selector */}
      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-6 rounded-3xl transition-colors duration-300">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-[#86868b] dark:text-[#98989d] mr-2">
            <Filter className="h-5 w-5" />
            <span className="font-medium">Station:</span>
          </div>
          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            className={selectCls}
          >
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>
        {allReadings.length > 0 && !loading && (
          <p className="mt-3 text-xs text-[#86868b] dark:text-[#98989d]">
            Showing{' '}
            <span className="font-semibold text-[#1d1d1f] dark:text-white">
              {allReadings.length.toLocaleString()}
            </span> readings across{' '}
            <span className="font-semibold text-[#1d1d1f] dark:text-white">
              {yearGroups.length}
            </span> year{yearGroups.length !== 1 ? 's' : ''}
            {' '}&middot;{' '}
            <span className="font-semibold text-[#1d1d1f] dark:text-white">
              {stations.find(s => s.id === selectedStation)?.name ?? selectedStation}
            </span>
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          {[2024, 2023, 2022].map(y => (
            <div key={y} className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-6 md:p-10 rounded-3xl">
              <div className="h-6 w-40 bg-slate-200 dark:bg-white/10 rounded animate-pulse mb-6" />
              <div className="h-[300px] bg-slate-200 dark:bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {allReadings.length === 0 && !loading && (
        <div className="text-center py-16 text-[#86868b] dark:text-[#98989d]">
          No historical data available for this station.
        </div>
      )}

      {/* Year-by-Year Charts */}
      {!loading && yearGroups.map(({ year, readings }) => {
        // Compute a sensible Y-axis max: the 99th percentile of AQI, PM2.5, PM10
        const getVal = (key: string) => readings.map(r => (r as Record<string, unknown>)[key] as number).filter(v => typeof v === 'number');
        const p99 = (vals: number[]) => {
          if (!vals.length) return 300;
          const sorted = [...vals].sort((a, b) => a - b);
          return sorted[Math.floor(sorted.length * 0.99)] || 300;
        };
        const yMax = Math.max(p99(getVal('aqi')), p99(getVal('pm25')), p99(getVal('pm10')));
        // Round up to nearest 50 for clean axis labels
        const yMaxRounded = Math.ceil(yMax / 50) * 50;

        return (
          <div
            key={year}
            className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-6 md:p-10 rounded-3xl transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                {year}
              </h2>
              <span className="text-xs text-[#86868b] dark:text-[#98989d]">
                {readings.length.toLocaleString()} readings
              </span>
            </div>
            <TimeSeriesChart
              data={readings}
              xKey="timestamp"
              formatXAsDate={true}
              yMax={yMaxRounded}
              yKeys={[
                { key: 'aqi',  color: '#10b981', name: 'AQI' },
                { key: 'pm25', color: '#f59e0b', name: 'PM2.5' },
                { key: 'pm10', color: '#6366f1', name: 'PM10' },
              ]}
            />
          </div>
        );
      })}

      {/* Monthly Averages — All Years Combined */}
      {!loading && monthlyBarData.length > 0 && (
        <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-6 md:p-10 rounded-3xl transition-colors duration-300">
          <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-8 tracking-tight">
            Monthly Averages (All Years Combined)
          </h3>
          <BarComparisonChart
            data={monthlyBarData}
            xKey="name"
            yKeys={[
              { key: 'aqi',  color: '#10b981', name: 'AQI' },
              { key: 'pm25', color: '#f59e0b', name: 'PM2.5' },
              { key: 'pm10', color: '#6366f1', name: 'PM10' },
            ]}
          />
        </div>
      )}

      {/* Monthly Averages — Per Year */}
      {!loading && yearMonthlyBarData.map(({ year, data }) => (
        <div
          key={`bar-${year}`}
          className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-6 md:p-10 rounded-3xl transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-8 tracking-tight">
            Monthly Averages — {year}
          </h3>
          <BarComparisonChart
            data={data}
            xKey="name"
            yKeys={[
              { key: 'aqi',  color: '#10b981', name: 'AQI' },
              { key: 'pm25', color: '#f59e0b', name: 'PM2.5' },
              { key: 'pm10', color: '#6366f1', name: 'PM10' },
            ]}
          />
        </div>
      ))}
    </div>
  );
}
