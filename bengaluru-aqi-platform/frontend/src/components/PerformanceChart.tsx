'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ModelMetrics } from '@/lib/types';
import { memo } from 'react';

interface PerformanceChartProps {
  metrics: ModelMetrics[];
}

// Shorten labels for the chart axis — full names are too long
const SHORT_LABELS: Record<string, string> = {
  'XGBoost — Direct':            'XGB Direct',
  'Random Forest — Direct':      'RF Direct',
  'Random Forest — Change':      'RF Change',
  'HistGradientBoosting — Change': 'HGB Change',
};

export const PerformanceChart = memo(function PerformanceChart({ metrics }: PerformanceChartProps) {
  const chartData = metrics.map(m => ({
    ...m,
    name: SHORT_LABELS[m.model] ?? m.model,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="var(--color-carbon)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--color-steel)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fill: 'var(--color-steel)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'RMSE', angle: -90, position: 'insideLeft', fill: 'var(--color-steel)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'var(--color-steel)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'R²', angle: 90, position: 'insideRight', fill: 'var(--color-steel)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10 }}
            domain={[0, 1]}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-tungsten)' }}
            contentStyle={{ backgroundColor: 'var(--color-obsidian)', borderRadius: '4px', border: '1px solid var(--color-carbon)', color: 'var(--color-eink)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: '12px' }}
            formatter={(value: number, name: string) => [value.toFixed(3), name]}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: '11px', color: 'var(--color-steel)' }} />
          <Bar yAxisId="left"  dataKey="rmse" name="RMSE (Lower is better)" fill="var(--color-aqi-unhealthy)" radius={[2, 2, 0, 0]} />
          <Bar yAxisId="right" dataKey="r2"   name="R² (Higher is better)"  fill="var(--color-aqi-good)"      radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
