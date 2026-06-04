'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white animate-on-scroll">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border-b border-slate-200 last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-slate-50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9E75] focus-visible:ring-inset"
            >
              <span className="text-[15px] font-semibold text-slate-900 pr-4 leading-snug">
                {faq.question}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-[#0D9E75]' : ''
                }`}
              />
            </button>

            {/* CSS Grid Accordion Trick */}
            <div
              className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                opacity: isOpen ? 1 : 0
              }}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-5 text-[14px] text-slate-500 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
