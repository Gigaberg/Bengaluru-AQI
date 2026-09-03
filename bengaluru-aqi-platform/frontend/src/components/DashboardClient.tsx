'use client';
import { useEffect, useState, useRef } from 'react';
import { getStations, getHistorical, getExplanation } from '@/lib/api';
import { Station, Reading, ExplanationResult } from '@/lib/types';
import { MapPin, AlertTriangle } from 'lucide-react';
import { RevealSection } from '@/components/RevealSection';
import { RealTimeAQI } from '@/components/RealTimeAQI';

interface DashboardClientProps {
  initialStations: Station[];
  initialSelectedStation: string;
}

export function DashboardClient({ initialStations, initialSelectedStation }: DashboardClientProps) {
  const [stations] = useState<Station[]>(initialStations);
  const [selectedStation, setSelectedStation] = useState<string>(initialSelectedStation);
  const [drivers, setDrivers] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function loadDrivers() {
      if (!selectedStation) return;
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      try {
        setLoading(true);
        const data = await getHistorical(selectedStation);
        if (data.length > 0) {
          const explanation = await getExplanation({
            pm25: data[0].pm25,
            pm10: data[0].pm10,
            no2: data[0].no2,
            o3: data[0].o3,
            co: data[0].co
          });
          setDrivers(explanation.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDrivers();
  }, [selectedStation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      {/* Header with station selector */}
      <RevealSection>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
              Air Quality Dashboard
            </h1>
            <p className="text-lg text-[#86868b] dark:text-[#98989d] mt-2">
              Live monitoring for Bengaluru stations
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#f5f5f7] dark:bg-[#1c1c1e] p-3 rounded-2xl transition-colors duration-300">
            <MapPin className="h-5 w-5 text-[#86868b] dark:text-[#98989d]" />
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-[#f5f5f7] dark:bg-[#1c1c1e] border-none text-[#1d1d1f] dark:text-white font-medium focus:ring-0 cursor-pointer outline-none rounded-lg"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>
        </div>
      </RevealSection>

      {/* Live AQI — from WAQI API */}
      <RevealSection delay={100}>
        <RealTimeAQI stationId={selectedStation} />
      </RevealSection>

      {/* Drivers Panel */}
      <RevealSection delay={200}>
        <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-10 transition-colors duration-300">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                What&apos;s driving air quality right now?
              </h2>
              <p className="text-lg text-[#86868b] dark:text-[#98989d] mt-1">
                Based on our ML model analysis, these are the primary pollutants affecting the AQI at the selected station.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-full max-w-md" />
              <div className="h-6 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-full max-w-sm" />
              <div className="h-6 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-full max-w-xs" />
            </div>
          ) : drivers ? (
            <div className="space-y-6">
              {drivers.map((driver) => {
                const impactColor = driver.impact > 0 ? 'bg-rose-500' : 'bg-emerald-500';
                const maxImpact = Math.max(...drivers.map(d => Math.abs(d.impact)));
                const widthPct = Math.min(100, Math.max(10, (Math.abs(driver.impact) / maxImpact) * 100));

                return (
                  <div key={driver.feature}>
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <span className="text-[#1d1d1f] dark:text-white">{driver.feature}</span>
                      <span className="text-[#86868b] dark:text-[#98989d]">
                        {driver.impact > 0 ? '+' : ''}{driver.impact.toFixed(1)} AQI impact
                      </span>
                    </div>
                    <div className="w-full bg-[#e5e5ea] dark:bg-white/10 rounded-full h-3">
                      <div
                        className={`${impactColor} h-2.5 rounded-full`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#86868b] dark:text-[#98989d] italic">No explanation data available.</p>
          )}
        </div>
      </RevealSection>
    </div>
  );
}
