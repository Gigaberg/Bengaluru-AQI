'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const ROUTE_ORDER = [
  '/',
  '/stations',
  '/historical',
  '/predict',
  '/simulator',
  '/model-performance',
  '/recommendations',
  '/govt-action',
  '/about',
];

const ROUTE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/stations': 'Stations',
  '/historical': 'Historical Analysis',
  '/predict': 'AQI Prediction',
  '/simulator': 'Simulator',
  '/model-performance': 'Model Performance',
  '/recommendations': 'Recommendations',
  '/govt-action': 'Government Action',
  '/about': 'About',
};

// Module-level var persists between template remounts (client-side only)
let _prevPathname: string | null = null;

function getDirection(prev: string | null, next: string): 'forward' | 'backward' | 'fade' {
  if (prev === null) return 'fade';
  const prevIdx = ROUTE_ORDER.indexOf(prev);
  const nextIdx = ROUTE_ORDER.indexOf(next);
  if (prevIdx === -1 || nextIdx === -1) return 'fade';
  if (nextIdx > prevIdx) return 'forward';
  if (nextIdx < prevIdx) return 'backward';
  return 'fade';
}

const DELAY_MS = 1400;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [animClass, setAnimClass] = useState('page-transition');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nextVisible, setNextVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentIdx = ROUTE_ORDER.indexOf(pathname);
  const nextRoute = currentIdx !== -1 && currentIdx < ROUTE_ORDER.length - 1
    ? ROUTE_ORDER[currentIdx + 1]
    : null;
  const nextName = nextRoute ? ROUTE_NAMES[nextRoute] : null;

  // Page transition animation
  useEffect(() => {
    const dir = getDirection(_prevPathname, pathname);
    _prevPathname = pathname;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (dir === 'forward') setAnimClass('page-slide-forward');
    else if (dir === 'backward') setAnimClass('page-slide-backward');
    else setAnimClass('page-transition');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // Scroll-to-navigate sentinel
  useEffect(() => {
    if (!sentinelRef.current || !nextRoute) return;

    const startProgress = () => {
      setProgress(0);
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(progressRef.current!);
            return 100;
          }
          return p + 100 / (DELAY_MS / 50);
        });
      }, 50);

      navTimerRef.current = setTimeout(() => {
        router.push(nextRoute);
      }, DELAY_MS);
    };

    const stopProgress = () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      setProgress(0);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setNextVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          startProgress();
        } else {
          stopProgress();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
      stopProgress();
    };
  }, [nextRoute, router]);

  return (
    <div className={animClass}>
      {children}

      {/* Scroll-to-next sentinel + footer */}
      {nextRoute && (
        <div className="flex flex-col items-center pb-24 md:pb-16 pt-8 gap-4 select-none">
          <div
            className={`flex flex-col items-center gap-3 transition-all duration-700 ${
              nextVisible ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'
            }`}
          >
            <span className="text-xs font-semibold text-[#86868b] dark:text-[#98989d] light:text-[#6e6e73] uppercase tracking-[0.2em]">
              Continue to
            </span>
            <span className="text-2xl font-bold text-[#1d1d1f] dark:text-white light:text-[#1d1d1f] tracking-tight">
              {nextName}
            </span>
            <div className={`transition-all duration-300 text-[#86868b] dark:text-[#98989d] light:text-[#6e6e73] ${nextVisible ? 'animate-bounce' : ''}`}>
              <ChevronDown className="h-7 w-7" />
            </div>
          </div>

          {/* Sentinel — must be fully visible to trigger */}
          <div ref={sentinelRef} className="h-px w-px" aria-hidden />
        </div>
      )}

      {/* Progress bar at bottom of viewport */}
      {nextVisible && (
        <div
          className="fixed bottom-0 left-0 h-1 bg-blue-500 rounded-r-full transition-none z-50"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}
