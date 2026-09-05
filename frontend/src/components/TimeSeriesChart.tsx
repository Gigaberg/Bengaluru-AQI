'use client';
import {
  LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from './Skeleton';
import { format } from 'date-fns';
import { memo, useState, useMemo } from 'react';
import { WifiOff, ChevronDown, ChevronUp } from 'lucide-react';

interface TimeSeriesChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: { key: string; color: string; name: string }[];
  y2Keys?: { key: string; color: string; name: string }[];
  loading?: boolean;
  formatXAsDate?: boolean;
  /** Maximum Y-axis value. Outliers beyond this are still shown but the axis is capped. */
  yMax?: number;
}


// ---------------------------------------------------------------------------
// Diwali dates (IST midnight → UTC ISO string used as reference)
// ---------------------------------------------------------------------------
const DIWALI: Record<number, string> = {
  2019: '2019-10-27',
  2020: '2020-11-14',
  2021: '2021-11-04',
  2022: '2022-10-24',
  2023: '2023-11-12',
  2024: '2024-11-01',
  2025: '2025-10-20',
};

/**
 * Given the chart data and xKey, returns the x-axis value of the data point
 * whose timestamp is closest to `targetDateStr` (YYYY-MM-DD).
 * Returns null if the target date falls outside the data's date range.
 */
function closestTimestamp(
  data: Record<string, unknown>[],
  xKey: string,
  targetDateStr: string,
): string | null {
  const target = new Date(targetDateStr).getTime();
  if (isNaN(target)) return null;

  const first = new Date(data[0][xKey] as string).getTime();
  const last  = new Date(data[data.length - 1][xKey] as string).getTime();
  // Only mark if Diwali day is within the visible range
  if (target < first || target > last) return null;

  let best: string | null = null;
  let bestDiff = Infinity;
  for (const row of data) {
    const t = new Date(row[xKey] as string).getTime();
    const diff = Math.abs(t - target);
    if (diff < bestDiff) { bestDiff = diff; best = row[xKey] as string; }
  }
  return best;
}

function movingAverage(
  data: Record<string, unknown>[],
  xKey: string,
  yKey: string,
): Record<string, unknown>[] {
  const n = data.length;
  if (n === 0) return [];
  const half = Math.max(3, Math.min(24, Math.round(n * 0.025)));
  const results: Record<string, unknown>[] = new Array(n);
  let currentSum = 0;
  let currentCount = 0;

  const initEnd = Math.min(n, half + 1);
  for (let j = 0; j < initEnd; j++) {
    const val = data[j][yKey];
    if (typeof val === 'number') {
      currentSum += val;
      currentCount++;
    }
  }

  for (let i = 0; i < n; i++) {
    if (i > 0) {
      const addIdx = i + half;
      if (addIdx < n) {
        const val = data[addIdx][yKey];
        if (typeof val === 'number') {
          currentSum += val;
          currentCount++;
        }
      }
      const removeIdx = i - half - 1;
      if (removeIdx >= 0) {
        const val = data[removeIdx][yKey];
        if (typeof val === 'number') {
          currentSum -= val;
          currentCount--;
        }
      }
    }

    const avg = currentCount > 0 ? currentSum / currentCount : null;
    results[i] = {
      [xKey]: data[i][xKey],
      [`${yKey}_trend`]: avg != null ? Math.round(avg * 10) / 10 : null,
    };
  }

  return results;
}

/** Find contiguous runs of null values ≥ minGapHours. */
function findOutages(
  data: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  minGapHours = 2,
): { from: string; to: string; hours: number }[] {
  const outages: { from: string; to: string; hours: number }[] = [];
  let gapStart: string | null = null;
  let gapCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][yKey] == null) {
      if (!gapStart) { gapStart = data[i][xKey] as string; gapCount = 1; }
      else gapCount++;
    } else {
      if (gapStart && gapCount >= minGapHours)
        outages.push({ from: gapStart, to: data[i - 1][xKey] as string, hours: gapCount });
      gapStart = null; gapCount = 0;
    }
  }
  if (gapStart && gapCount >= minGapHours)
    outages.push({ from: gapStart, to: data[data.length - 1][xKey] as string, hours: gapCount });
  return outages;
}

export const TimeSeriesChart = memo(function TimeSeriesChart({
  data, xKey, yKeys, y2Keys, loading, formatXAsDate, yMax,
}: TimeSeriesChartProps) {
  const [showSecondary, setShowSecondary] = useState(false);

  if (loading) return <Skeleton className="w-full h-[300px]" />;

  if (!data || data.length === 0) return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center gap-3 text-[#86868b] dark:text-[#98989d] bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-lg border border-[#e5e5ea] dark:border-white/10 px-6 text-center">
      <span className="text-2xl">📡</span>
      <p className="font-semibold text-sm text-[#1d1d1f] dark:text-white">No data available</p>
      <p className="text-xs max-w-xs leading-relaxed">No readings found for the selected filters. Try a different station, year, or time range.</p>
    </div>
  );

  const allNull = yKeys.every(y => data.every(row => row[y.key] == null));
  if (allNull) return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center gap-3 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-lg border border-dashed border-[#e5e5ea] dark:border-white/10 px-6 text-center">
      <span className="text-2xl">🔌</span>
      <p className="font-semibold text-sm text-[#1d1d1f] dark:text-white">Sensor not operational</p>
      <p className="text-xs text-[#86868b] dark:text-[#98989d] max-w-sm leading-relaxed">
        The <span className="font-semibold text-[#1d1d1f] dark:text-white">{yKeys.map(y => y.name).join(', ')}</span> sensor
        was not installed or not reporting at this station during the selected period.
        CPCB stations were progressively equipped — earlier years may be missing certain parameters.
      </p>
    </div>
  );

  const { chartData, outages, diwaliLines } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], outages: [], diwaliLines: [] };
    }

    const allKeys = [...yKeys, ...(y2Keys || [])];
    const trendByKey: Record<string, Record<string, Record<string, unknown>>> = {};
    for (const y of allKeys) {
      const trend = movingAverage(data, xKey, y.key);
      trendByKey[y.key] = Object.fromEntries(trend.map(r => [r[xKey] as string, r]));
    }

    const chartData = data.map((row, i) => {
      const merged: Record<string, unknown> = { ...row };
      for (const y of allKeys) {
        const ts = row[xKey] as string;
        merged[`${y.key}_trend`] = trendByKey[y.key][ts]?.[`${y.key}_trend`] ?? null;
        merged['_idx'] = i;
      }
      return merged;
    });

    const outages = yKeys.flatMap(y => findOutages(data, xKey, y.key));

    const diwaliLines: { xVal: string; label: string }[] = [];
    if (formatXAsDate && data.length > 0) {
      for (const [yearStr, dateStr] of Object.entries(DIWALI)) {
        const xVal = closestTimestamp(data, xKey, dateStr);
        if (xVal) diwaliLines.push({ xVal, label: `🪔 Diwali ${yearStr}` });
      }
    }

    return { chartData, outages, diwaliLines };
  }, [data, xKey, yKeys, y2Keys, formatXAsDate]);

  const tickCache = useMemo(() => new Map<string, string>(), [data]);
  // Determine if any secondary (e.g., temperature) data exists in the dataset
  const hasSecondaryData = useMemo(() => {
    if (!data || !y2Keys) return false;
    return y2Keys.some(y => data.some(row => row[y.key] != null));
  }, [data, y2Keys]);
  const tickFormatter = (value: unknown): string => {
    if (formatXAsDate && typeof value === 'string') {
      let cached = tickCache.get(value);
      if (!cached) {
        try {
          cached = format(new Date(value), 'MMM dd');
          tickCache.set(value, cached);
        } catch {
          cached = String(value);
        }
      }
      return cached;
    }
    return String(value);
  };

  const fmtTs = (ts: string) => {
    try { return format(new Date(ts), 'MMM dd, HH:mm'); } catch { return ts; }
  };

  return (
    <div className="w-full space-y-3">
      {y2Keys && y2Keys.length > 0 && (
        <div className="flex items-center justify-end text-xs font-mono gap-2">
          <label
            className={`inline-flex items-center gap-2 select-none transition-colors ${
              hasSecondaryData
                ? 'cursor-pointer text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
                : 'cursor-not-allowed text-[#c7c7cc] dark:text-[#48484a]'
            }`}
            title={!hasSecondaryData ? 'No data available for this parameter at the selected station' : undefined}
          >
            <input
              type="checkbox"
              checked={showSecondary}
              onChange={e => setShowSecondary(e.target.checked)}
              disabled={!hasSecondaryData}
              className="rounded border-[#e5e5ea] dark:border-white/20 text-red-500 focus:ring-red-500 bg-white dark:bg-white/10 disabled:opacity-40"
            />
            <span>Overlay {y2Keys.map(y => y.name).join(', ')}</span>
          </label>
          {!hasSecondaryData && (
            <span className="text-[10px] text-amber-500 dark:text-amber-400/80 font-semibold tracking-wide">
              NO DATA
            </span>
          )}
        </div>
      )}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: showSecondary ? 25 : 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="var(--color-carbon)" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: 'var(--color-steel)', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
              axisLine={false} tickLine={false}
              tickFormatter={tickFormatter}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: 'var(--color-steel)', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
              axisLine={false} tickLine={false}
              domain={yMax ? [0, yMax] : undefined}
              allowDataOverflow={!!yMax}
            />
            {showSecondary && hasSecondaryData && y2Keys && y2Keys.map((y) => (
              <YAxis
                key={y.key}
                yAxisId="right"
                orientation="right"
                tick={{ fill: y.color, fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                axisLine={true}
                tickLine={true}
                unit="°C"
                domain={['auto', 'auto']}
                stroke={y.color}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-obsidian)',
                borderRadius: '4px',
                border: '1px solid var(--color-carbon)',
                color: 'var(--color-eink)',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: '12px',
              }}
              labelFormatter={(label) =>
                formatXAsDate && typeof label === 'string'
                  ? (() => { try { return format(new Date(label), 'MMM dd, yyyy HH:mm'); } catch { return label; } })()
                  : label
              }
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: '11px', color: 'var(--color-steel)' }}
              formatter={(value) => value.replace(/_trend$/, '')}
            />

            {yKeys.map((y) => (
              <Line
                key={`${y.key}_trend`}
                type="monotone"
                dataKey={`${y.key}_trend`}
                name={y.name}
                stroke={y.color}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4, fill: 'var(--color-obsidian)', stroke: y.color, strokeWidth: 2 }}
                legendType="line"
              />
            ))}

            {showSecondary && y2Keys && y2Keys.map((y) => (
              <Line
                key={`${y.key}_trend`}
                yAxisId="right"
                type="monotone"
                dataKey={`${y.key}_trend`}
                name={y.name}
                stroke={y.color}
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4, fill: 'var(--color-obsidian)', stroke: y.color, strokeWidth: 2 }}
                legendType="line"
              />
            ))}

            {/* Diwali reference lines */}
            {diwaliLines.map(({ xVal, label }: { xVal: string; label: string }) => (
              <ReferenceLine
                key={xVal}
                x={xVal}
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{
                  value: label,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#f97316',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  dy: -4,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {outages.length > 0 && <ErrorLogsDropdown outages={outages} fmtTs={fmtTs} />}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Error Logs Dropdown
// ---------------------------------------------------------------------------
interface ErrorLogsProps {
  outages: { from: string; to: string; hours: number }[];
  fmtTs: (ts: string) => string;
}

function ErrorLogsDropdown({ outages, fmtTs }: ErrorLogsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-amber-500/20 overflow-hidden text-xs">
      {/* Header / toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-amber-500/10 hover:bg-amber-500/15 transition-colors text-amber-700 dark:text-amber-400"
      >
        <span className="flex items-center gap-2 font-semibold">
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
          Error Logs
          <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold">
            {outages.length}
          </span>
        </span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />}
      </button>

      {/* Collapsible log list */}
      {open && (
        <div className="divide-y divide-amber-500/10 bg-amber-500/5">
          {outages.map((o, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 text-amber-700 dark:text-amber-400">
              <WifiOff className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
              <span>
                <span className="font-semibold">Sensor offline</span>
                {' '}— no readings from{' '}
                <span className="font-mono font-semibold">{fmtTs(o.from)}</span>
                {' '}to{' '}
                <span className="font-mono font-semibold">{fmtTs(o.to)}</span>
                {' '}({o.hours} hr{o.hours !== 1 ? 's' : ''}).
                {' '}Gaps in the line indicate missing data, not zero pollution.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
