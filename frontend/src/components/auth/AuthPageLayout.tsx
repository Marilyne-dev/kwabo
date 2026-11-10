import React from 'react';
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WHATSAPP_LINK } from '../../data/kwaboData';

const AUTH_IMAGE = '/assets/photos/cotonou.jpg';

// Style glassmorphism appliqué aux champs du formulaire (Connexion + Inscription)
const glassFieldsCss = `
.auth-glass input:not([type="checkbox"]),
.auth-glass select {
  background-color: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 1px 2px rgba(26, 92, 58, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.auth-glass input:not([type="checkbox"]):focus,
.auth-glass select:focus {
  background-color: rgba(255, 255, 255, 0.85);
  border-color: #1a5c3a;
}
.auth-glass input:-webkit-autofill,
.auth-glass input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.7) inset;
  -webkit-text-fill-color: #1a1f1b;
}
`;

interface Props {
  children: React.ReactNode;
}

export const AuthPageLayout: React.FC<Props> = ({ children }) => {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-[#f9f7f4] lg:grid lg:grid-cols-[46%_54%]">
      <style>{glassFieldsCss}</style>

      {/* Photo : bandeau visible en haut sur mobile/tablette, colonne pleine hauteur sur grand écran */}
      <aside className="relative h-64 w-full overflow-hidden bg-[#1a4d30] sm:h-72 lg:sticky lg:top-0 lg:h-screen">
        <img
          src={AUTH_IMAGE}
          alt="Cotonou, Bénin"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Voile léger pour garder le texte lisible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        <div className="relative z-10 flex h-full flex-col p-5 text-white sm:p-6 lg:p-10 xl:p-12">
          <button
            type="button"
            onClick={() => navigate('public-home')}
            className="inline-flex w-fit items-center gap-2.5 transition hover:opacity-90"
            aria-label="KWABO, retour à l'accueil"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5c842] font-display text-xl font-bold text-[#123f28] shadow-md lg:h-11 lg:w-11 lg:text-2xl">
              K
            </span>
            <span className="font-display text-xl font-bold tracking-wide text-white lg:text-2xl">
              KWABO<span className="text-[#f5c842]">.</span>
            </span>
          </button>
        </div>

        {/* Texte centré exactement au milieu de la photo (horizontal + vertical) */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
          <p className="text-center font-display text-3xl font-semibold leading-tight text-white drop-shadow-lg sm:text-4xl lg:text-4xl xl:text-5xl">
            Vos projets au Bénin,
            <br />
            <span className="text-[#f5c842]">entre de bonnes mains</span>
          </p>
        </div>
      </aside>

      {/* Formulaire : fond coloré + carte en verre */}
      <main className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#d9f0e3] via-[#f4f1dc] to-[#fbe7a6] px-4 py-8 sm:px-8 lg:min-h-screen">
        {/* Taches de couleur floues derrière le verre */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#2d8a5a]/40 blur-3xl" />
          <div className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-[#f5c842]/60 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-[#1a5c3a]/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-[#f59e42]/30 blur-3xl" />
        </div>

        <div className="relative z-10 mb-4 w-full max-w-[480px]">
          <button
            type="button"
            onClick={() => navigate('public-home')}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#1a5c3a] transition hover:text-[#123f28]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/60 shadow-sm backdrop-blur-md transition group-hover:bg-white/90">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span>Retour à l'accueil</span>
          </button>
        </div>

        <div className="auth-glass relative z-10 w-full max-w-[480px] rounded-3xl border border-white/70 bg-white/45 p-6 shadow-[0_8px_40px_rgba(26,92,58,0.18),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl sm:p-9">
          {children}
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter KWABO sur WhatsApp"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2d8a5a] text-white shadow-2xl transition hover:scale-105 hover:bg-[#1a5c3a] active:scale-95"
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
