import React from 'react';
import { useApp } from '../../context/AppContext';
import { Star, CheckCircle2, Quote } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const { reviews } = useApp();
  const publishedReviews = reviews.filter(r => r.status === 'published');

  return (
    <section className="py-20 bg-[#f9f7f4] border-b border-[#e0e8e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] px-3.5 py-1.5 rounded-full inline-block">
            Témoignages certifiés
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1a1f1b] mt-3">
            La voix de la diaspora béninoise
          </h2>
          <p className="text-sm text-[#56635b] mt-2">
            Ils vivent en France, en Belgique, au Canada ou aux États-Unis et confient la gestion de leurs chantiers et démarches à KWABO.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {publishedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-3xl border border-[#e0e8e4] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <Quote className="w-8 h-8 text-[#f5c842]/30 absolute top-4 right-4" />

              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>

                <p className="text-xs text-[#404844] leading-relaxed italic">
                  « {rev.comment} »
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#1a1f1b]">
                    Client vérifié
                  </div>
                  <div className="text-[10px] text-[#56635b]">
                    {new Date(rev.at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Mission réussie
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Global score banner */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-[#e0e8e4] max-w-xl mx-auto flex items-center justify-around text-center shadow-sm">
          <div>
            <div className="font-display font-extrabold text-3xl text-[#1a5c3a]">4.9 / 5</div>
            <div className="text-[11px] text-[#56635b] mt-0.5">Satisfaction globale</div>
          </div>
          <div className="h-10 w-px bg-neutral-200" />
          <div>
            <div className="font-display font-extrabold text-3xl text-[#1a5c3a]">+240</div>
            <div className="text-[11px] text-[#56635b] mt-0.5">Missions réalisées</div>
          </div>
          <div className="h-10 w-px bg-neutral-200" />
          <div>
            <div className="font-display font-extrabold text-3xl text-[#1a5c3a]">100 %</div>
            <div className="text-[11px] text-[#56635b] mt-0.5">Reçus justifiés</div>
          </div>
        </div>

      </div>
    </section>
  );
};
