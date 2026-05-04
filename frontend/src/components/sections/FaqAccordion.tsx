'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // One ref per item for the content panel
  const contentRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Refs for ScrollTrigger stagger targets
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  // ScrollTrigger entrance animation — stagger each item in from the left
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemRefs.current.filter(Boolean),
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const toggle = (index: number) => {
    const isCurrentlyOpen = openIndex === index;

    // Close the previously open item
    if (openIndex !== null && openIndex !== index) {
      const prevEl = contentRefs.current[openIndex];
      if (prevEl) {
        gsap.to(prevEl, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        });
      }
    }

    const el = contentRefs.current[index];
    if (!el) return;

    if (isCurrentlyOpen) {
      // Close current
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
      setOpenIndex(null);
    } else {
      // Open new
      gsap.to(el, {
        height: el.scrollHeight,
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
      setOpenIndex(index);
    }
  };

  return (
    <div ref={sectionRef} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            ref={(el) => { itemRefs.current[index] = el; }}
            className="border-b border-slate-200 last:border-b-0"
          >
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

            {/* GSAP-animated content panel — initial state: height 0, opacity 0 */}
            <div
              ref={(el) => { contentRefs.current[index] = el; }}
              style={{ height: 0, overflow: 'hidden', opacity: 0 }}
            >
              <div className="px-6 pb-5 text-[14px] text-slate-500 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
