import React from 'react';
import { ArrowLeft, FileCheck2, MessageCircle, Phone, Receipt, ShieldCheck, Video } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WHATSAPP_LINK } from '../../data/kwaboData';

const benefits = [
  { icon: Video, title: 'Vidéos et photos', description: 'Datées, pour voir le travail réalisé.' },
  { icon: Receipt, title: 'Reçus scannés', description: 'Pour chaque dépense engagée.' },
  { icon: FileCheck2, title: 'Contrat signé', description: 'Avant le début de chaque mission.' },
  { icon: ShieldCheck, title: 'Devis avant mission', description: 'Clair, sans frais cachés.' },
];

interface Props {
  children: React.ReactNode;
}

export const AuthPageLayout: React.FC<Props> = ({ children }) => {
  const { navigate } = useApp();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f9f7f4] lg:grid-cols-[46%_54%]">
      {/* Colonne gauche verte : sticky h-screen pour rester parfaitement visible et centrée, sans être poussée vers le bas */}
      <aside className="relative hidden lg:flex lg:sticky lg:top-0 h-screen flex-col justify-between overflow-hidden bg-[#1a4d30] bg-benin-pattern px-8 py-8 text-white xl:px-12">
        <button
          type="button"
          onClick={() => navigate('public-home')}
          className="inline-flex w-fit items-center gap-2.5 transition hover:opacity-90"
          aria-label="KWABO, retour à l'accueil"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5c842] font-display text-2xl font-bold text-[#123f28]">
            K
          </span>
          <span className="font-display text-2xl font-bold text-white">
            KWABO<span className="text-[#f5c842]">.</span>
          </span>
        </button>

        <div className="mx-auto w-full max-w-[500px] my-auto py-4">
          <h1 className="font-display text-4xl font-semibold leading-tight text-white xl:text-5xl">
            Votre présence de confiance <em className="text-[#f5c842]">au Bénin</em>
          </h1>
          <ul className="mt-8 grid gap-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5c842] text-[#123f28]">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block text-base text-white">{title}</strong>
                  <span className="mt-0.5 block text-sm text-white/85">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

      </aside>

      <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#f9f7f4] px-4 py-8 sm:px-8">
        {/* Bouton retour en haut vers l'accueil */}
        <div className="w-full max-w-[460px] mb-4">
          <button
            type="button"
            onClick={() => navigate('public-home')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a5c3a] hover:text-[#123f28] transition group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#dce4df] shadow-sm group-hover:bg-[#e8f5ee] transition">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span>Retour à l'accueil</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('public-home')}
          className="mb-5 inline-flex items-center gap-2 lg:hidden"
          aria-label="KWABO, retour à l'accueil"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5c842] font-display text-xl font-bold text-[#123f28]">
            K
          </span>
          <span className="font-display text-xl font-bold text-[#1a5c3a]">
            KWABO<span className="text-[#d4a017]">.</span>
          </span>
        </button>

        <div className="w-full max-w-[460px] rounded-[20px] border border-[#dce4df] bg-white p-6 shadow-[0_12px_36px_rgba(26,92,58,0.10)] sm:p-8">
          {children}
        </div>

       

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter KWABO sur WhatsApp"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2d8a5a] text-white shadow-xl transition hover:bg-[#1a5c3a]"
        >
          <span className="relative flex h-8 w-8 items-center justify-center">
            <MessageCircle aria-hidden="true" className="absolute inset-0 h-8 w-8 text-white" />
            <Phone aria-hidden="true" className="h-3.5 w-3.5 -rotate-12 text-white" />
          </span>
        </a>
      </main>
    </div>
  );
};
