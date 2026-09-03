'use client';
import { useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RevealSectionProps {
  children: ReactNode;
  delay?: number;       // stagger delay in ms
  className?: string;
}

/**
 * Wraps any block in a scroll-reveal animation.
 * Fades + slides up once when it enters the viewport.
 * Uses IntersectionObserver so it only triggers once.
 */
export function RevealSection({ children, delay = 0, className }: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply delay after mount so transition picks it up
    el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn('reveal', className)}>
      {children}
    </div>
  );
}
