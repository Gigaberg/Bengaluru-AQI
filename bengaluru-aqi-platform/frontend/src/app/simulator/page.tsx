import { predictAQI, simulateIntervention } from '@/lib/api';
import { SimulatorClient } from '@/components/SimulatorClient';

export default async function SimulatorPage() {
  const baseInput = {
    pm25: 120,
    pm10: 180,
    no2: 60,
    o3: 35,
    co: 1.2
  };
  
  let initialBaseAqi = 0;
  let initialSimResult = null;
  
  try {
    const res = await predictAQI(baseInput);
    initialBaseAqi = res.aqi;
    
    initialSimResult = await simulateIntervention({
      base: baseInput,
      reductions: { pm25: 0, pm10: 0, no2: 0 }
    });
  } catch(err) {
    console.error(err);
  }

  return <SimulatorClient initialBaseAqi={initialBaseAqi} initialSimResult={initialSimResult} />;
}
