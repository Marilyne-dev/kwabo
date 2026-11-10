import React from 'react';
import { UserPlus, FileEdit, FileCheck, PlayCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Créez votre compte',
    description: "Gratuit, en moins d'une minute. Votre espace personnel est prêt.",
  },
  {
    icon: FileEdit,
    title: 'Décrivez votre besoin',
    description: 'Choisissez un service et remplissez un formulaire adapté, en moins de 3 minutes.',
  },
  {
    icon: FileCheck,
    title: 'Recevez un devis',
    description: 'Notre équipe répond sous 12 h. Clair, tout compris, sans frais cachés.',
  },
  {
    icon: PlayCircle,
    title: 'Suivez en direct',
    description: 'Vidéos, reçus, rapports et messages : tout est dans votre espace.',
  },
];

export const HowItWorksSection: React.FC = () => (
  <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 border-b border-[#e0e8e4]">
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-10 text-center sm:mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] px-3.5 py-1.5 rounded-full inline-block mb-3">
          Simplicité & Clarté
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[40px]">
          Comment ça marche
        </h2>
        <p className="mt-2 text-base text-[#56635b]">
          De l'inscription à la mission réalisée, en 4 étapes fluides.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="group rounded-3xl border border-[#e0e8e4] bg-[#f9f7f4] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:bg-white hover:border-[#1a5c3a]/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5c842] font-display text-lg font-bold text-[#1a1f1b] shadow-sm group-hover:scale-110 transition-transform">
                    {index + 1}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#e0e8e4] text-[#1a5c3a] shadow-xs">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#1a1f1b] group-hover:text-[#1a5c3a] transition-colors">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#56635b]">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  </section>
);
