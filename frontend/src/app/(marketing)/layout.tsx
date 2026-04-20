import type { ReactNode } from 'react';
import { MarketingHeader, MarketingFooter } from './marketing-layout-client';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7f8] text-slate-900 font-sans">
      <MarketingHeader />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <MarketingFooter />
    </div>
  );
}
