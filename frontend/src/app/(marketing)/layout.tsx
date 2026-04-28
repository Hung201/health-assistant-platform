import type { ReactNode } from 'react';
import { LightOnly } from '@/components/theme/light-only';
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';
import './marketing.css';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <LightOnly>
      <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans flex flex-col">
        <MarketingHeader />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </LightOnly>
  );
}
