import { ReactNode, memo } from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value?: string | number;
  unit?: string;
  badge?: ReactNode;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard = memo(function StatCard({ title, value, unit, badge, loading, className, style }: StatCardProps) {
  return (
    <div className={cn("bg-graphite dark:bg-graphite light:bg-[#f5f5f7] border border-carbon dark:border-carbon light:border-[#d1d1d6] p-6 rounded-2xl flex flex-col justify-between transition-colors hover:bg-tungsten dark:hover:bg-tungsten light:hover:bg-white snap-reveal", className)} style={style}>
      <h3 className="text-sm font-medium text-steel dark:text-steel light:text-[#6e6e73] uppercase tracking-wider mb-4">{title}</h3>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        {loading ? (
          <Skeleton className="h-10 w-24 skeleton-shimmer" />
        ) : (
          <div className="flex items-baseline space-x-1.5">
            <span className="text-4xl text-eink dark:text-eink light:text-[#1d1d1f] font-numeric tracking-tight telemetry-glow">{value !== undefined ? value : '--'}</span>
            {unit && <span className="text-sm font-medium text-steel dark:text-steel light:text-[#6e6e73] font-numeric">{unit}</span>}
          </div>
        )}
        {!loading && badge && <div>{badge}</div>}
      </div>
    </div>
  );
});
