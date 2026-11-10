import React from 'react';
import { CATEGORIES } from '../../data/kwaboData';
import { Building2, Users, FileText, Truck, ArrowRight } from 'lucide-react';

interface Props {
  onSelectCategory: (catId: string) => void;
}

export const CategoriesSection: React.FC<Props> = ({ onSelectCategory }) => {
  const iconMap: Record<string, React.ElementType> = {
    Building2,
    Users,
    FileText,
    Truck
  };

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
          <p className="text-sm text-[#56635b] mt-2">
            Des équipes qualifiées, contrôlées et réactives déployées sur le terrain à Cotonou, Calavi, Porto-Novo et dans tout le Bénin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon] || Building2;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group bg-white rounded-3xl overflow-hidden border border-[#e0e8e4] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
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
            );
          })}
        </div>
      </div>
    </section>
  );
};
