import React from 'react';
import { Video, Receipt, FileSignature, ShieldCheck } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const points = [
    {
      icon: Video,
      title: 'Vidéos 360° et photos',
      desc: 'Datées et géolocalisées pour constater l\'avancement réel de vos travaux.',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      icon: Receipt,
      title: 'Reçus officiels scannés',
      desc: 'Pour chaque dépense engagée (matériaux, ordonnances, formalités).',
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      icon: FileSignature,
      title: 'Contrat de mission signé',
      desc: 'Engagements contractuels clairs et délais fixés avant tout démarrage.',
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      icon: ShieldCheck,
      title: 'Devis clair et transparent',
      desc: 'Chiffré en euros ou FCFA, sans surcoût de dernière minute.',
      color: 'bg-stone-50 text-stone-800 border-stone-200'
    },
  ];

  return (
    <section id="garanties" className="py-12 bg-white border-b border-[#e0e8e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl border border-neutral-200 bg-[#f9f7f4] flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-xl ${p.color} border shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#1a1f1b]">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#56635b] mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
