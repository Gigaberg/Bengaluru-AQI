'use client';
import { useEffect, useState, useCallback } from 'react';
import { fetchWAQIFeed } from '@/lib/waqi';
import { WAQIReadings } from '@/lib/types';
import { getAQIColor } from '@/lib/aqi';
import { Radio, RefreshCw, Wifi } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { AQIBadge } from '@/components/AQIBadge';

// WAQI free tier only supports city-name queries (geo not available).
// All 4 stations are in Bengaluru, so we use the city name.
const WAQI_CITY = 'bengaluru';

/**
 * Real-time air quality card powered by the WAQI (World Air Quality Index) API.
 * Fetches live data using geo coordinates for the selected station and auto-refreshes every 15 minutes.
 */
export function RealTimeAQI({ stationId }: { stationId: string }) {
  const [data, setData] = useState<WAQIReadings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchWAQIFeed(WAQI_CITY);

      if (res.status === 'ok' && res.data) {
        setData(res.data);
        setLastRefresh(new Date());
      } else {
        setError('WAQI returned an unexpected response');
      }
    } catch (err) {
      console.error('WAQI fetch error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    load();
    // Auto-refresh every 15 minutes
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const iaqi = data?.iaqi;

  return (
    <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-10 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                Live Air Quality
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                <Wifi className="h-3 w-3" /> LIVE
              </span>
            </div>
            <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1 flex items-center gap-1">
              <span>Powered by WAQI (World Air Quality Index)</span>
              {lastRefresh && (
                <span className="ml-2 opacity-60">
                  · Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 text-[#86868b] dark:text-[#98989d] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Failed to load live data: {error}
          </p>
          <button
            onClick={load}
            className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white/50 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Data Grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Live AQI"
            value={data.aqi}
            badge={<AQIBadge value={data.aqi} />}
            loading={loading}
            className="border-l-4"
            style={{ borderLeftColor: getAQIColor(data.aqi) }}
          />
          <StatCard
            title="Dominant Pollutant"
            value={data.dominentpol?.toUpperCase()}
            loading={loading}
          />
          {iaqi?.pm25 && (
            <StatCard
              title="PM2.5"
              value={iaqi.pm25.v.toFixed(1)}
              unit="µg/m³"
              loading={loading}
            />
          )}
          {iaqi?.pm10 && (
            <StatCard
              title="PM10"
              value={iaqi.pm10.v.toFixed(1)}
              unit="µg/m³"
              loading={loading}
            />
          )}
          {iaqi?.no2 && (
            <StatCard
              title="NO₂"
              value={iaqi.no2.v.toFixed(1)}
              unit="µg/m³"
              loading={loading}
            />
          )}
          {iaqi?.o3 && (
            <StatCard
              title="O₃"
              value={iaqi.o3.v.toFixed(1)}
              unit="µg/m³"
              loading={loading}
            />
          )}
          {iaqi?.co && (
            <StatCard
              title="CO"
              value={iaqi.co.v.toFixed(2)}
              unit="mg/m³"
              loading={loading}
            />
          )}
          {iaqi?.t && (
            <StatCard
              title="Temperature"
              value={iaqi.t.v.toFixed(1)}
              unit="°C"
              loading={loading}
            />
          )}
          {iaqi?.h && (
            <StatCard
              title="Humidity"
              value={iaqi.h.v.toFixed(0)}
              unit="%"
              loading={loading}
            />
          )}
          {iaqi?.w && (
            <StatCard
              title="Wind"
              value={iaqi.w.v.toFixed(1)}
              unit="m/s"
              loading={loading}
            />
          )}
          {iaqi?.p && (
            <StatCard
              title="Pressure"
              value={iaqi.p.v.toFixed(0)}
              unit="hPa"
              loading={loading}
            />
          )}
          {iaqi?.td && (
            <StatCard
              title="Dew Point"
              value={iaqi.td.v.toFixed(1)}
              unit="°C"
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Source attribution */}
      {data?.city?.name && (
        <p className="mt-6 text-xs text-[#86868b] dark:text-[#98989d]">
          Nearest WAQI station: {data.city.name} · Timezone: {data.time?.tz}
        </p>
      )}
    </div>
  );
}
