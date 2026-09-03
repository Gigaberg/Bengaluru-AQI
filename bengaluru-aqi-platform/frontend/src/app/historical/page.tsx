import { getStations } from '@/lib/api';
import { HistoricalClient } from '@/components/HistoricalClient';

export default async function HistoricalAnalysis() {
  const stations = await getStations();
  const initialStation = stations.length > 0 ? stations[0] : null;

  return (
    <HistoricalClient
      initialStations={stations}
      initialSelectedStation={initialStation?.id || ''}
    />
  );
}
