'use client';

import dynamic from 'next/dynamic';

const AQIMap = dynamic(() => import('@/components/AQIMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#f5f5f7] dark:bg-[#1c1c1e] animate-pulse rounded-2xl flex items-center justify-center text-[#86868b]">
      Loading map...
    </div>
  )
});

export function AQIMapWrapper(props: any) {
  return <AQIMap {...props} />;
}
