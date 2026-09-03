'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ExplanationResult } from '@/lib/types';
import { Skeleton } from './Skeleton';

interface SignedContributionChartProps {
  data: ExplanationResult | null;
  loading?: boolean;
}

export function SignedContributionChart({ data, loading }: SignedContributionChartProps) {
  if (loading) return <Skeleton className="w-full h-[380px] skeleton-shimmer" />;
  if (!data || data.length === 0) return null;

  // Reverse so the highest-impact feature renders at the BOTTOM of the chart.
  // Recharts clips SVG content that bleeds above the top margin, so placing
  // the most important row at the bottom keeps all labels visible.
  const chartData = [...data].reverse();

  return (
    <div className="w-full h-[380px]" style={{ overflow: 'visible' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="var(--color-carbon)" />
          <XAxis
            type="number"
            tick={{ fill: 'var(--color-steel)', fontFamily: 'var(--font-jetbrains-mono)' }}
            axisLine={{ stroke: 'var(--color-carbon)' }}
            tickLine={false}
          />
          <YAxis
            dataKey="feature"
            type="category"
            width={130}
            tick={{ fill: 'var(--color-eink)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-tungsten)' }}
            contentStyle={{
              backgroundColor: 'var(--color-obsidian)',
              borderRadius: '4px',
              border: '1px solid var(--color-carbon)',
              color: 'var(--color-eink)',
              fontFamily: 'var(--font-jetbrains-mono)',
            }}
            formatter={(value: unknown) => {
              const num = Number(value) || 0;
              return [`${num > 0 ? '+' : ''}${num.toFixed(2)} µg/m³`, 'IMPACT'];
            }}
          />
          <ReferenceLine x={0} stroke="var(--color-steel)" strokeWidth={1} strokeDasharray="3 3" />
          <Bar dataKey="impact" barSize={8} radius={[0, 3, 3, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.impact > 0 ? 'var(--color-aqi-unhealthy)' : 'var(--color-aqi-good)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
