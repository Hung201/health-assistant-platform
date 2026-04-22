import type { ReactNode } from 'react';
import { LightOnly } from '@/components/theme/light-only';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <LightOnly className="bg-background-light">{children}</LightOnly>;
}
