import type { ReactNode } from 'react';
import { LightOnly } from '@/components/theme/light-only';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <LightOnly>{children}</LightOnly>;
}
