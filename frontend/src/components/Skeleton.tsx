import { cn } from '@/lib/utils';
import React from 'react';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-2xl', className)}
      {...props}
    />
  );
}
