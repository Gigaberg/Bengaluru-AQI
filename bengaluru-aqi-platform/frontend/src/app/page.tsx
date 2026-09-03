import { getStations } from '@/lib/api';
import { DashboardClient } from '@/components/DashboardClient';

export default async function Dashboard() {
  const stations = await getStations();
  const initialStation = stations.length > 0 ? stations[0] : null;

  return (
    <DashboardClient
      initialStations={stations}
      initialSelectedStation={initialStation?.id || ''}
    />
  );
}
