import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, MessageCircle, Phone, Search } from 'lucide-react';
import { WHATSAPP_LINK } from '../../data/kwaboData';

const suggestedServices = [
  'Suivi de chantier',
  'Santé de vos proches',
  'Dossier visa',
  'Fret Europe',
  "Création d'entreprise",
];

export const HeroSection: React.FC = () => {
  const { services, openServiceModal } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

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
    <section className="public-hero relative overflow-hidden bg-[#1a4d30] text-white bg-benin-pattern">
      <div className="mx-auto flex min-h-[550px] max-w-[1120px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-20">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.08em] text-[#f5c842] sm:text-sm">
          Services de confiance pour la diaspora béninoise
        </p>

        <h1 className="max-w-[900px] text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-[68px]">
          Vos projets au Bénin,
          <br />
          <em className="font-medium text-[#f5c842]">entre de bonnes mains</em>
        </h1>

        <p className="mt-6 max-w-[690px] text-base leading-7 text-white/90 sm:text-lg">
          Immobilier, famille, démarches, logistique : une équipe sur place à
          Cotonou, qui prouve son travail par des vidéos, des reçus et des rapports.
        </p>

        <form
          role="search"
          onSubmit={event => {
            event.preventDefault();
            search(searchQuery);
          }}
          className="relative mt-8 w-full max-w-[720px]"
        >
          <div className="flex min-h-[64px] items-center rounded-full bg-white p-1.5 pl-5 shadow-lg sm:pl-6">
            <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#56635b]" />
            <input
              type="search"
              value={searchQuery}
              onChange={event => {
                setSearchQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(Boolean(searchQuery.trim()))}
              placeholder="Que cherchez-vous ? Suivi de chantier, visa, fret..."
              aria-label="Rechercher un service"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-left text-sm text-[#1a1f1b] outline-none placeholder:text-[#68736d] sm:text-base"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c842] px-4 font-semibold text-[#1a1f1b] transition hover:bg-[#e8b92d] sm:px-6"
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

        <div className="mt-5 flex max-w-[760px] flex-wrap justify-center gap-2">
          {suggestedServices.map(label => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setSearchQuery(label);
                search(label);
              }}
              className="rounded-full border border-white/35 px-3.5 py-2 text-sm text-white transition hover:bg-white/15"
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white/90">
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
