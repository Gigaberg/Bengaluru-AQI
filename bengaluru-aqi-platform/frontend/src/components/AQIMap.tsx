'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Station, Reading } from '@/lib/types';
import { getAQIColor } from '@/lib/aqi';

// Fix Leaflet's default icon path issues with Webpack
import L from 'leaflet';
L.Icon.Default.imagePath = '/leaflet/images/';

interface AQIMapProps {
  stationsData: {
    station: Station;
    latestReading: Reading | null;
  }[];
}

// Optional helper to re-center map if needed
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function AQIMap({ stationsData }: AQIMapProps) {
  // Center roughly on Bengaluru
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden relative border border-carbon shadow-sm">
      <MapContainer 
        center={defaultCenter} 
        zoom={11} 
        scrollWheelZoom={false}
        className="w-full h-full absolute inset-0 z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {stationsData.map((data) => {
          if (!data.latestReading) return null;
          
          const aqi = data.latestReading.aqi || 0;
          const aqiColor = getAQIColor(aqi);
          
          let strokeColor = aqiColor; 
          let fillColor = aqiColor;

          return (
            <CircleMarker 
              key={data.station.id}
              center={[data.station.lat, data.station.lng]}
              radius={12}
              pathOptions={{
                color: strokeColor,
                fillColor: fillColor,
                fillOpacity: 0.7,
                weight: 2
              }}
            >
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-gray-900 mb-1">{data.station.name}</h3>
                  <div className="text-2xl font-black" style={{ color: strokeColor }}>
                    {aqi} <span className="text-xs font-normal text-gray-500">AQI</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>PM2.5: <span className="font-medium">{data.latestReading.pm25 != null ? data.latestReading.pm25.toFixed(1) : '—'}</span> µg/m³</p>
                    <p>PM10: <span className="font-medium">{data.latestReading.pm10 != null ? data.latestReading.pm10.toFixed(1) : '—'}</span> µg/m³</p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
