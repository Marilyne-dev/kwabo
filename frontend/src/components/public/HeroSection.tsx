import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, MessageCircle, Phone, Search } from 'lucide-react';
import { WHATSAPP_LINK } from '../../data/kwaboData';

const suggestedServices = [
  'Suivi de chantier',
  'Santé de vos proches',
  'Dossier visa',
  'Frais Europe',
  "Création d'entreprise",
];

export const HeroSection: React.FC = () => {
  const { services, openServiceModal } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Animation d'apparition lettre par lettre (effet machine à écrire jusqu'à la dernière lettre)
  const line1 = 'Vos projets au Bénin,';
  const line2 = 'entre de bonnes mains';
  const totalChars = line1.length + line2.length;
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (charCount < totalChars) {
      const timer = setTimeout(() => {
        setCharCount(prev => prev + 1);
      }, 45);
      return () => clearTimeout(timer);
    }
  }, [charCount, totalChars]);

  const displayedLine1 = charCount <= line1.length ? line1.slice(0, charCount) : line1;
  const displayedLine2 = charCount > line1.length ? line2.slice(0, charCount - line1.length) : '';
  const isFinished = charCount >= totalChars;

  const filteredServices = searchQuery.trim()
    ? services.filter(service =>
        [service.name, service.short, ...service.included]
          .some(value => value.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()))
      )
    : [];

  const search = (query: string) => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const service = services.find(item =>
      [item.name, item.short, ...item.included]
        .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
    );
    if (service) {
      openServiceModal(service);
      setShowResults(false);
    } else {
      setShowResults(true);
    }
  };

  return (
    <section className="public-hero relative overflow-hidden bg-[#1a4d30] text-white">
      {/* Photo de fond authentique Cotonou – lumineuse avec glassmorphisme */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/photos/cotonou.jpg"
          alt="Cotonou Bénin"
          className="h-full w-full object-cover scale-105 filter brightness-[0.52] contrast-[1.05] transition-transform duration-10000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#123f28]/75 via-[#1a4d30]/65 to-[#123f28]/85 mix-blend-multiply" />
        <div className="absolute inset-0 bg-benin-pattern opacity-15" />
      </div>

      {/* Contenu Hero DIRECTEMENT POSÉ SUR L'IMAGE (aucun cadre interne) */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24">
        
        {/* Titre avec les lettres qui viennent une à une jusqu'à la dernière lettre et s'arrêtent */}
        <h1 className="max-w-[950px] mx-auto text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-6xl md:text-[68px] drop-shadow-md min-h-[1.2em]">
          <span>{displayedLine1}</span>
          {charCount > line1.length && <br />}
          <em className="font-medium text-[#f5c842] not-italic ml-2 sm:ml-0">
            {displayedLine2}
          </em>
          {!isFinished && (
            <span className="inline-block w-1.5 h-[0.8em] bg-[#f5c842] ml-1.5 align-middle animate-pulse" />
          )}
        </h1>

        <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
          {/* Sous-titre posé directement sur l'image */}
          <p className="mt-5 max-w-[700px] text-base leading-relaxed text-white drop-shadow sm:text-lg">
            Immobilier, famille, démarches, logistique : une équipe sur place à
            Cotonou, qui prouve son travail par des vidéos, des reçus et des rapports.
          </p>

          <form
            role="search"
            onSubmit={event => {
              event.preventDefault();
              search(searchQuery);
            }}
            className="relative mt-8 mx-auto w-full max-w-[720px]"
          >
            <div className="flex min-h-[64px] items-center rounded-full bg-white p-1.5 pl-5 shadow-2xl sm:pl-6 border border-white/40">
              <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#56635b]" />
              <input
                type="search"
                value={searchQuery}
                onChange={event => {
                  setSearchQuery(event.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(Boolean(searchQuery.trim()))}
                placeholder="Que cherchez-vous ? Suivi de chantier, visa, santé, frais Europe..."
                aria-label="Rechercher un service"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-left text-sm text-[#1a1f1b] outline-none placeholder:text-[#68736d] sm:text-base"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c842] px-4 font-semibold text-[#1a1f1b] transition hover:bg-[#e8b92d] hover:scale-105 active:scale-100 sm:px-6 shadow-md"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                <span className="text-sm sm:text-base">Rechercher</span>
              </button>
            </div>

            {showResults && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#e0e8e4] bg-white text-left shadow-2xl">
                {filteredServices.length === 0 ? (
                  <p className="p-4 text-sm text-[#56635b]">
                    Aucun service ne correspond à « {searchQuery} ».
                  </p>
                ) : (
                  filteredServices.slice(0, 5).map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        openServiceModal(service);
                        setShowResults(false);
                      }}
                      className="flex w-full items-center justify-between gap-4 border-b border-[#eef1ef] px-4 py-3 text-left last:border-0 hover:bg-[#e8f5ee]"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-[#1a1f1b]">{service.name}</span>
                        <span className="block line-clamp-1 text-xs text-[#56635b]">{service.short}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[#1a5c3a]">{service.price}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </form>

          {/* Suggestions de services posées directement sur l'image */}
          <div className="mt-6 flex max-w-[760px] mx-auto flex-wrap justify-center gap-2.5">
            {suggestedServices.map(label => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setSearchQuery(label);
                  search(label);
                }}
                className="rounded-full border border-white/40 bg-black/25 backdrop-blur-md px-4 py-2 text-xs sm:text-sm text-white transition hover:bg-white/20 hover:border-white/80 hover:scale-105"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Garanties réassurance */}
          <ul
            className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-xs sm:text-sm text-white drop-shadow"
            style={{ marginTop: '2rem' }}
          >
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#f5c842]" />
              Compte gratuit, sans engagement
            </li>
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#f5c842]" />
              Devis sous 12 h
            </li>
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#f5c842]" />
              Satisfait ou remboursé 30 jours
            </li>
          </ul>
        </div>
      </div>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter KWABO sur WhatsApp"
        className="whatsapp-float fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2d8a5a] text-white shadow-xl transition hover:bg-[#1a5c3a]"
      >
        <span className="relative flex h-8 w-8 items-center justify-center">
          <MessageCircle aria-hidden="true" className="absolute inset-0 h-8 w-8 text-white" />
          <Phone aria-hidden="true" className="h-3.5 w-3.5 -rotate-12 text-white" />
        </span>
      </a>
    </section>
  );
};
