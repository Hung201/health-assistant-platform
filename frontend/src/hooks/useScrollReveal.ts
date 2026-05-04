import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
}

export function useScrollReveal(
  ref: RefObject<HTMLElement | HTMLDivElement | null>,
  options?: ScrollRevealOptions
) {
  useGSAP(
    () => {
      if (!ref.current) return;

      const children = ref.current.querySelectorAll('[data-reveal]');
      if (!children.length) return;

      gsap.fromTo(
        children,
        { opacity: 0, y: options?.y ?? 30 },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 0.6,
          stagger: options?.stagger ?? 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ref.current,
            start: options?.start ?? 'top 80%',
            once: true,
          },
        }
      );
    },
    { scope: ref, dependencies: [] }
  );
}
