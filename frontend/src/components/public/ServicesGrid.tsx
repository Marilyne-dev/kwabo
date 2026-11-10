import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/kwaboData';
import { Service } from '../../types';
import { Check, ArrowRight, Star, Sparkles } from 'lucide-react';

interface Props {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

// Fait apparaître chaque carte (fondu + montée) quand elle entre dans l'écran,
// avec un décalage selon sa colonne pour qu'elles arrivent une par une.
const RevealCard: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`h-full transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
};

export const ServicesGrid: React.FC<Props> = ({ selectedCategory, onSelectCategory }) => {
  const { services, openServiceModal } = useApp();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredServices = services.filter(s => {
    const matchesCat = selectedCategory === 'all' || s.cat === selectedCategory;
    const matchesSearch = !filterQuery.trim() || 
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.short.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.included.some(inc => inc.toLowerCase().includes(filterQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] px-3.5 py-1.5 rounded-full inline-block">
              Catalogue officiel 2026
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1a1f1b] mt-3">
              Nos 12 services de confiance au Bénin
            </h2>
            <p className="text-sm text-[#56635b] mt-2 max-w-xl">
              Chaque prestation est couverte par un contrat officiel, un suivi régulier et des pièces justificatives certifiées.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrer les services..."
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#1a5c3a] text-white shadow-sm'
                : 'bg-[#f9f7f4] text-[#56635b] hover:bg-neutral-200'
            }`}
          >
            Tous les services ({services.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#1a5c3a] text-white shadow-sm'
                  : 'bg-[#f9f7f4] text-[#56635b] hover:bg-neutral-200'
              }`}
            >
              {cat.short}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service, index) => {
            const cat = CATEGORIES.find(c => c.id === service.cat);
            return (
              <RevealCard key={service.id} delay={(index % 3) * 180}>
                <div
                  onClick={() => openServiceModal(service)}
                  className="group h-full bg-white rounded-3xl overflow-hidden border border-[#e0e8e4] hover:shadow-xl hover:border-[#1a5c3a]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Photo with Overlay Badge */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={service.photo}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md">
                          {cat?.short}
                        </span>
                        {service.popular && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#f5c842] text-[#123f28] shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            Plébiscité
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-xs font-bold text-[#f5c842] block">
                          {service.price}
                        </span>
                        <h3 className="font-display text-lg font-bold truncate">
                          {service.name}
                        </h3>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-[#56635b] leading-relaxed line-clamp-2">
                        {service.short}
                      </p>

                      {/* Included bullets */}
                      <div className="space-y-1.5 pt-1">
                        {service.included.slice(0, 3).map((inc, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[#404844]">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Action footer */}
                  <div className="p-6 pt-0 border-t border-neutral-100 mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1a5c3a] group-hover:underline">
                      Détails & devis
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#e8f5ee] group-hover:bg-[#1a5c3a] group-hover:text-white text-[#1a5c3a] flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </RevealCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};
