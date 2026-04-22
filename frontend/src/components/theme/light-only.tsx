'use client';

import { useEffect } from 'react';

export function LightOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlClass = html.className;
    const prevBodyHasForceLight = body.classList.contains('force-light');

    const forceLight = () => {
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.add('force-light');
    };

    forceLight();

    const observer = new MutationObserver(() => {
      // Keep patient area in light mode even if global theme tries to re-apply dark.
      if (html.classList.contains('dark')) {
        forceLight();
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      html.className = prevHtmlClass;
      if (!prevBodyHasForceLight) {
        body.classList.remove('force-light');
      }
    };
  }, []);

  return <div className={`force-light min-h-screen ${className ?? ''}`.trim()}>{children}</div>;
}
