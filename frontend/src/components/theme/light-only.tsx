'use client';

export function LightOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`force-light min-h-screen ${className ?? ''}`.trim()}>{children}</div>;
}
