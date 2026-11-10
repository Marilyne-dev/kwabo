import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Menu, Search, User as UserIcon, X } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { navigate, currentUser, role, services, openServiceModal } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchServices = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const match = services.find(service =>
      [service.name, service.short, ...service.included]
        .some(value => value.toLocaleLowerCase().includes(query))
    );
    if (match) {
      openServiceModal(match);
    } else {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToAccount = () => {
    if (role === 'ADMIN') navigate('admin-dashboard');
    else if (role === 'OPERATOR') navigate('operator-dashboard');
    else navigate('client-dashboard');
  };

  return (
    <header className="public-header sticky top-0 z-40 border-b border-[#e0e8e4] bg-white">
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center gap-6 px-5">
        <button
          type="button"
          onClick={() => navigate('public-home')}
          className="flex shrink-0 items-center gap-2 text-left"
          aria-label="KWABO, accueil"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c3a] font-display text-2xl font-bold text-[#f5c842]">
            K
          </span>
          <span className="font-display text-[25px] font-bold tracking-tight text-[#1a5c3a]">
            KWABO<span className="text-[#d4a017]">.</span>
          </span>
        </button>

        <form onSubmit={searchServices} role="search" className="public-header-search hidden w-[400px] max-w-[400px] shrink-0 md:flex">
          <label htmlFor="header-service-search" className="sr-only">Rechercher un service</label>
          <div className="flex h-[50px] w-full items-center rounded-full border-[3px] border-[#1a5c3a] bg-white p-1 pl-4 transition focus-within:ring-2 focus-within:ring-[#1a5c3a]/15">
            <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#56635b]" />
            <input
              id="header-service-search"
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Cherchez un service..."
              className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#1a1f1b] outline-none placeholder:text-[#777]"
            />
            <button
              type="submit"
              aria-label="Lancer la recherche"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a5c3a] text-white transition hover:bg-[#123f28]"
            >
              <Search aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </form>

        <nav aria-label="Navigation principale" className="public-header-nav ml-auto hidden items-center gap-6 text-[15px] font-medium text-[#404844] lg:flex">
          <a href="#services" className="nav-link-underline hover:text-[#1a5c3a]">Services</a>
          <a href="#garanties" className="nav-link-underline hover:text-[#1a5c3a]">Confiance</a>
          <a href="#faq" className="nav-link-underline hover:text-[#1a5c3a]">FAQ</a>
          <button type="button" onClick={() => navigate('login')} className="nav-link-underline whitespace-nowrap hover:text-[#1a5c3a]">
            Se connecter
          </button>
          {currentUser ? (
            <button
              type="button"
              onClick={goToAccount}
              className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28]"
            >
              <UserIcon aria-hidden="true" className="h-4 w-4" />
              Mon espace
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('register')}
              className="h-11 whitespace-nowrap rounded-full bg-[#1a5c3a] px-6 font-semibold text-white transition hover:bg-[#123f28]"
            >
              S'inscrire
            </button>
          )}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-3 sm:flex xl:hidden">
          <button type="button" onClick={() => navigate('login')} className="text-sm font-medium text-[#404844]">
            Se connecter
          </button>
          <button
            type="button"
            onClick={currentUser ? goToAccount : () => navigate('register')}
            className="rounded-full bg-[#1a5c3a] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {currentUser ? 'Mon espace' : "S'inscrire"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(open => !open)}
          className="ml-auto rounded-lg p-2 text-[#1a5c3a] hover:bg-[#e8f5ee] xl:hidden"
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav aria-label="Navigation mobile" className="border-t border-[#e0e8e4] bg-white px-5 py-4 shadow-lg xl:hidden">
          <form onSubmit={searchServices} role="search" className="mb-3 flex items-center rounded-full border border-[#dce4df] px-4 py-2">
            <Search aria-hidden="true" className="h-4 w-4 text-[#56635b]" />
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Cherchez un service..."
              aria-label="Rechercher un service"
              className="min-w-0 flex-1 bg-transparent px-3 py-1 text-sm text-[#1a1f1b] outline-none"
            />
            <button type="submit" aria-label="Lancer la recherche"><ArrowRight className="h-4 w-4 text-[#1a5c3a]" /></button>
          </form>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-[#404844]">Services</a>
          <a href="#garanties" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-[#404844]">Confiance</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-[#404844]">FAQ</a>
          <button type="button" onClick={() => { navigate('login'); setMobileMenuOpen(false); }} className="block py-2 font-medium text-[#404844]">Se connecter</button>
          <button
            type="button"
            onClick={() => { currentUser ? goToAccount() : navigate('register'); setMobileMenuOpen(false); }}
            className="mt-2 w-full rounded-full bg-[#1a5c3a] py-3 font-semibold text-white"
          >
            {currentUser ? 'Mon espace' : "S'inscrire"}
          </button>
        </nav>
      )}
    </header>
  );
};
