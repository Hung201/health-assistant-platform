'use client';

import { useEffect, useRef } from 'react';
import { CountUp } from 'countup.js';

interface StatCounterProps {
  end: number;
  suffix?: string;
  duration?: number;
  label: string;
  /** When true, renders only the number <span> without the wrapper div or label — for inline use inside custom card layouts */
  inline?: boolean;
}

export function StatCounter({ end, suffix = '', duration = 2.5, label, inline = false }: StatCounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!numberRef.current) return;

    let countUpInstance: CountUp | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          countUpInstance = new CountUp(numberRef.current!, end, {
            duration,
            suffix,
            enableScrollSpy: false,
            useEasing: true,
            easingFn: (t, b, c, d) => c * (-Math.pow(2, -10 * t / d) + 1) + b,
          });

          if (!countUpInstance.error) {
            countUpInstance.start();
          } else {
            console.error(countUpInstance.error);
          }

          // Disconnect after first trigger
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(numberRef.current);

    return () => {
      observer.disconnect();
      if (countUpInstance) {
        countUpInstance.reset();
      }
    };
  }, [end, suffix, duration]);

  // Inline mode: just the number span for embedding inside custom card layouts
  if (inline) {
    return (
      <span
        ref={numberRef}
        className="text-[28px] font-extrabold leading-none text-[#1a3353]"
      >
        0{suffix}
      </span>
    );
  }

  // Default: full stat-item block with label (used on marketing page)
  return (
    <div className="stat-item">
      <span ref={numberRef} className="stat-number text-[36px] font-bold text-slate-900 leading-none">
        0{suffix}
      </span>
      <span className="stat-label text-sm text-slate-500 mt-1">{label}</span>
    </div>
  );
}
