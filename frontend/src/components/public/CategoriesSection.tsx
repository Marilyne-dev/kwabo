import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Users, FileText, Truck, ArrowRight } from 'lucide-react';

interface Props {
  onSelectCategory: (catId: string) => void;
}

export const CategoriesSection: React.FC<Props> = ({ onSelectCategory }) => {
  const { categories } = useApp();
  const iconMap: Record<string, React.ElementType> = {
    Building2,
    Users,
    FileText,
    Truck,
    building: Building2,
    users: Users,
    'file-text': FileText,
    truck: Truck,
  };

  // Les cartes apparaissent une par une quand la grille entre dans l'écran
  const gridRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = gridRef.current;
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
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 bg-[#f9f7f4] border-b border-[#e0e8e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] px-3.5 py-1.5 rounded-full inline-block">
            4 Univers d'expertise au Bénin
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1a1f1b] mt-3">
            Tout ce dont votre famille et vos projets ont besoin
          </h2>
          
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, index) => {
            const Icon = iconMap[cat.icon] || Building2;
            return (
              <div
                key={cat.id}
                style={{ transitionDelay: visible ? `${index * 200}ms` : '0ms' }}
                className={`h-full transition-all duration-700 ease-out motion-reduce:transition-none ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div
                  onClick={() => onSelectCategory(cat.id)}
                  className="group h-full bg-white rounded-3xl overflow-hidden border border-[#e0e8e4] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Photo container */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={cat.photo}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 bg-[#1a5c3a] text-[#f5c842] p-2 rounded-xl">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <h3 className="font-display font-bold text-lg text-[#1a1f1b] group-hover:text-[#1a5c3a] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#56635b] mt-2 leading-relaxed">
                        {cat.blurb}
                      </p>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="px-5 pb-5 pt-1 flex items-center justify-between text-xs font-bold text-[#1a5c3a]">
                    <span>Voir les prestations</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
