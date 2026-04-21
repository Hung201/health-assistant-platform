'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function LightOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  return <div className={`force-light min-h-screen ${className ?? ''}`.trim()}>{children}</div>;
}
