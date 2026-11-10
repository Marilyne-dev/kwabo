import React from 'react';
import { Icon } from '../common/Icon';
// Import the mockup style sheet to keep the original design
import '../../mockup-client/maquette-kwabo/css/style.css';

/**
 * Layout used by all client‑facing pages. It mirrors the HTML structure of the
 * original mockup (`index.html`) – a skip‑link, a toast container, and a top‑
 * navigation bar that is built from the same menu definition that the vanilla
 * JS version (`client.js`) uses.
 *
 * Props:
 *   - title: page title displayed in the <title> tag by the router (optional).
 *   - children: the page‑specific content.
 */
export const ClientLayout: React.FC<{ title?: string }> = ({ title, children }) => {
  // Navigation items correspond exactly to the array defined in client.js
  const nav = [
    { href: '#/espace', icon: 'home', label: 'Tableau de bord' },
    { href: '#/espace/services', icon: 'squares-2x2', label: 'Catalogue' },
    { href: '#/espace/nouvelle-demande', icon: 'plus-circle', label: 'Nouvelle demande' },
    { href: '#/espace/demandes', icon: 'clipboard-document-list', label: 'Mes demandes' },
    { href: '#/espace/documents', icon: 'folder', label: 'Mes documents' },
    { href: '#/espace/messages', icon: 'chat-bubble-left-right', label: 'Messagerie' },
    { href: '#/espace/paiements', icon: 'credit-card', label: 'Paiements' },
    { href: '#/espace/parrainage', icon: 'gift', label: 'Parrainage' },
    { href: '#/espace/profil', icon: 'user', label: 'Mon profil' },
  ];

  React.useEffect(() => {
    if (title) document.title = `KWABO – ${title}`;
  }, [title]);

  return (
    <>
      {/* Skip link – required for accessibility */}
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>

      {/* Toast container – same id/ class as the mockup so existing JS can target it */}
      <div id="toast" className="toast" role="status" aria-live="polite" hidden />

      {/* Header – reproduces the .site-header from the original CSS */}
      <header className="site-header">
        <div className="site-header-inner container">
          <a href="#/espace" className="logo">
            <span className="logo-mark">K</span>
            <span className="logo-text">
              KWABO<span className="logo-dot">.</span>
            </span>
          </a>
          {/* Navigation */}
          <nav className="site-nav" aria-label="Menu principal">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="link-btn">
                <Icon name={item.icon as any} size={18} /> {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content area – the mockup uses a #root div; we expose the children here */}
      <main id="main" className="container" style={{ marginTop: '2rem' }}>
        {children}
      </main>
    </>
  );
};

