import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FAQ_LIST } from '../../data/kwaboData';
import { ChevronDown } from 'lucide-react';

const HEADING_WORDS = 'Tout ce que vous devez savoir avant de démarrer'.split(' ');

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 bg-white border-b border-[#e0e8e4]">
      <style>{`
        @keyframes kwFaqShimmer {
          0%   { background-position: 120% 50%; }
          100% { background-position: -120% 50%; }
        }
        .kw-faq-headline-word {
          background-image: linear-gradient(105deg, #1a1f1b 38%, #1a5c3a 50%, #1a1f1b 62%);
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: kwFaqShimmer 4.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .kw-faq-headline-word {
            background: none;
            color: #1a1f1b;
            animation: none;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-sm sm:text-[15px] font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] px-5 py-2 rounded-full inline-block"
          >
            Questions fréquentes
          </motion.span>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#1a1f1b] mt-4 leading-tight tracking-[0.01em] max-w-5xl mx-auto">
            {HEADING_WORDS.map((word, idx) => (
              <motion.span
                key={`${word}-${idx}`}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{
                  duration: 0.45,
                  delay: reduceMotion ? 0 : idx * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`inline-block mr-[0.26em] last:mr-0 ${reduceMotion ? '' : 'kw-faq-headline-word'}`}
                style={reduceMotion ? undefined : { animationDelay: `${idx * 0.08}s` }}
              >
                {word}
              </motion.span>
            ))}
          </h2>

          <motion.div
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            className="mx-auto mt-3 h-1 w-24 origin-center rounded-full bg-gradient-to-r from-[#1a5c3a] via-[#f0c040] to-[#1a5c3a]"
          />

          <p className="text-sm sm:text-base text-[#56635b] mt-3 max-w-3xl mx-auto">
            La transparence est notre premier engagement. Voici les réponses à vos interrogations légitimes.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
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
