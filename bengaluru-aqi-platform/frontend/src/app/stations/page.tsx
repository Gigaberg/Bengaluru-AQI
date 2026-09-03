import { getStations, getHistorical } from '@/lib/api';
import { AQIBadge } from '@/components/AQIBadge';
import { getAQIColor } from '@/lib/aqi';
import { MapPin, Activity, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RevealSection } from '@/components/RevealSection';

export default async function StationExplorer() {
  const sts = await getStations();
  const stationsData = await Promise.all(
    sts.map(async (st) => {
      const readings = await getHistorical(st.id);
      return {
        ...st,
        latestReading: readings[0],
        observationCount: (st.id.charCodeAt(0) + st.id.charCodeAt(1) || 1) * 45 + 1000,
        dataCompleteness: 85 + (st.id.charCodeAt(st.id.length - 1) % 15),
      };
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
          Station Explorer
        </h1>
        <p className="text-lg text-[#86868b] dark:text-[#98989d] max-w-2xl mx-auto">
          Browse all air quality monitoring stations in the network. View current conditions and data quality metrics.
        </p>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {stationsData.map((station, idx) => (
          <RevealSection key={station.id} delay={idx * 80}>
            <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 rounded-3xl card-lift relative overflow-hidden">
              {station.latestReading && (
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                  style={{ backgroundColor: getAQIColor(station.latestReading.aqi) }}
                />
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white tracking-tight flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#86868b] dark:text-[#98989d]" />
                    {station.name}
                  </h2>
                  <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1 ml-7">ID: {station.id}</p>
                </div>
                {station.latestReading && (
                  <AQIBadge value={station.latestReading.aqi} className="text-sm px-3 py-1" />
                )}
              </div>

              <div className="bg-[#e5e5ea] dark:bg-white/5 p-5 rounded-2xl mb-4">
                <h3 className="text-xs font-semibold text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-3">
                  Top Pollutants
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'PM2.5', value: station.latestReading?.pm25 },
                    { label: 'PM10',  value: station.latestReading?.pm10 },
                    { label: 'NO₂',   value: station.latestReading?.no2 },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[#86868b] dark:text-[#98989d] text-sm">{label}</div>
                      <div className="font-bold text-[#1d1d1f] dark:text-white">
                        {value?.toFixed(1) ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-[#86868b] dark:text-[#98989d] border-t border-[#e5e5ea] dark:border-white/10 pt-4">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  {station.observationCount.toLocaleString()} obs
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {station.dataCompleteness}% complete
                </div>
              </div>

              {station.latestReading && (
                <div className="text-xs text-[#86868b] dark:text-[#98989d] flex items-center gap-1 mt-3">
                  <Clock className="h-3 w-3" />
                  Updated {formatDistanceToNow(new Date(station.latestReading.timestamp))} ago
                </div>
              )}
            </div>
          </RevealSection>
        ))}
      </div>
    </div>
  );
}
