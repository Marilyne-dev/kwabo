import React, { useState } from 'react';
import { FAQ_LIST } from '../../data/kwaboData';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 bg-white border-b border-[#e0e8e4]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] px-3.5 py-1.5 rounded-full inline-block">
            Questions fréquentes
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1a1f1b] mt-3">
            Tout ce que vous devez savoir avant de démarrer
          </h2>
          <p className="text-sm text-[#56635b] mt-2">
            La transparence est notre premier engagement. Voici les réponses à vos interrogations légitimes.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_LIST.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-[#e0e8e4] rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 bg-white hover:bg-[#f9f7f4] transition-colors"
                >
                  <span className="font-display font-bold text-sm sm:text-base text-[#1a1f1b]">
                    {item.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-[#f9f7f4] flex items-center justify-center shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-[#1a5c3a] text-white' : 'text-neutral-500'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 bg-white text-xs sm:text-sm text-[#56635b] leading-relaxed border-t border-neutral-100">
                    <p className="pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
