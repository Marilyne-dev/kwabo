import React from 'react';
import { FileCheck2, MessageCircle, Receipt, ShieldCheck, UserRoundPlus, Video } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WHATSAPP_LINK } from '../../data/kwaboData';

const guarantees = [
  {
    icon: Video,
    title: 'Vidéos et photos',
    description: 'Datées, pour voir le travail réalisé.',
  },
  {
    icon: Receipt,
    title: 'Reçus scannés',
    description: 'Pour chaque dépense engagée.',
  },
  {
    icon: FileCheck2,
    title: 'Contrat signé',
    description: 'Avant le début de chaque mission.',
  },
  {
    icon: ShieldCheck,
    title: 'Devis avant mission',
    description: 'Clair, sans frais cachés.',
  },
];

export const WhyKwaboSection: React.FC = () => {
  const { navigate } = useApp();

  return (
    <section className="bg-[#1a4d30] bg-benin-pattern px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#f5c842]">
            Pourquoi KWABO
          </p>
          <h2 className="max-w-[550px] font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
            La transparence, notre seule loi
          </h2>
          <p className="mt-4 max-w-[570px] text-base leading-relaxed text-white/90 sm:text-lg">
            Chaque intervention est documentée : vidéo, photos datées, reçus scannés
            pour chaque dépense, rapport écrit. Votre confiance n'est pas un bonus,
            c'est notre produit principal.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('register')}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#f5c842] px-7 font-semibold text-[#1a1f1b] transition hover:bg-[#e8b92d]"
            >
              <UserRoundPlus aria-hidden="true" className="h-5 w-5" />
              Créer mon compte gratuit
            </button>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="why-whatsapp-link inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/70 bg-[#123f28] px-6 font-semibold text-white shadow-sm transition hover:bg-[#0d321f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c842]"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5 text-white" />
              <span className="text-white">WhatsApp</span>
            </a>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {guarantees.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="min-h-[140px] rounded-[20px] border border-white/15 bg-white/[0.08] p-5 sm:p-6"
            >
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5c842] text-[#123f28]">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/85">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
