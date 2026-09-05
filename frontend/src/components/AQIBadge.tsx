import { getAQICategory, getAQIColor } from '@/lib/aqi';
import { cn } from '@/lib/utils';

interface AQIBadgeProps {
  value: number;
  className?: string;
}

export function AQIBadge({ value, className }: AQIBadgeProps) {
  const category = getAQICategory(value);
  const color = getAQIColor(value);
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-numeric font-medium whitespace-nowrap border bg-obsidian dark:bg-obsidian light:bg-white",
        className
      )}
      style={{ 
        color: color, 
        borderColor: color,
        boxShadow: `0 0 10px ${color}33 inset, 0 0 10px ${color}33`
      }}
    >
      {value} — {category.toUpperCase()}
    </span>
  );
}
