import React from 'react';

const steps = [
  {
    title: 'Créez votre compte',
    description: "Gratuit, en moins d'une minute. Votre espace personnel est prêt.",
  },
  {
    title: 'Décrivez votre besoin',
    description: 'Choisissez un service et remplissez un formulaire adapté, en moins de 3 minutes.',
  },
  {
    title: 'Recevez un devis',
    description: 'Notre équipe répond sous 12 h. Clair, tout compris, sans frais cachés.',
  },
  {
    title: 'Suivez en direct',
    description: 'Vidéos, reçus, rapports et messages : tout est dans votre espace.',
  },
];

export const HowItWorksSection: React.FC = () => (
  <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[40px]">
          Comment ça marche
        </h2>
        <p className="mt-2 text-base text-[#56635b]">
          De l'inscription à la mission réalisée, en 4 étapes.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5c842] font-display text-xl font-bold text-[#1a1f1b]">
              {index + 1}
            </span>
            <h3 className="text-xl font-semibold text-[#1a1f1b]">{step.title}</h3>
            <p className="mt-1 text-base leading-[1.65] text-[#56635b]">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
