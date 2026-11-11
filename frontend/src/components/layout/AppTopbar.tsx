import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { api } from '../../services/api';
import { mapRequest, mapUser } from '../../services/mappers';
import { RequestItem, User } from '../../types';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  actions?: React.ReactNode;
}

export const AppTopbar: React.FC<TopbarProps> = ({ title, subtitle, onOpenSidebar, actions }) => {
  const {
    role,
    currentView,
    services,
    notifications,
    counters,
    markNotificationRead,
    markAllNotificationsRead,
    navigate,
    navigateFromLink,
    setActiveClientId,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matchingRequests, setMatchingRequests] = useState<RequestItem[]>([]);
  const [matchingClients, setMatchingClients] = useState<User[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = Math.max(
    counters.unreadNotifications,
    notifications.filter(n => !n.read).length
  );

  const needle = searchQuery.trim();

  // Debounced GET /admin/search?q= for admin & operator
  useEffect(() => {
    if ((role !== 'ADMIN' && role !== 'OPERATOR') || needle.length < 2) {
      setMatchingRequests([]);
      setMatchingClients([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await api<any>('/admin/search', { params: { q: needle } });
        if (cancelled) return;
        const rawReqs = res?.data?.requests ?? res?.requests ?? [];
        const rawClients = res?.data?.clients ?? res?.clients ?? [];
        setMatchingRequests(Array.isArray(rawReqs) ? rawReqs.map(mapRequest) : []);
        setMatchingClients(Array.isArray(rawClients) ? rawClients.map(mapUser) : []);
      } catch {
        if (!cancelled) {
          setMatchingRequests([]);
          setMatchingClients([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [needle, role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBackTarget = () => {
    switch (currentView) {
      case 'client-request-detail':
      case 'client-new-request':
        return { label: 'Retour aux demandes', target: 'client-requests' };
      case 'client-documents':
      case 'client-messages':
      case 'client-invoices':
      case 'client-referral':
      case 'client-profile':
        return { label: 'Retour au tableau de bord', target: 'client-dashboard' };
      case 'admin-request-detail':
        return { label: 'Retour aux demandes', target: 'admin-requests' };
      case 'operator-mission-detail':
        return { label: 'Retour aux missions', target: 'operator-missions' };
      default:
        return null;
    }
  };

  const backNav = getBackTarget();

  return (
    <header className="topbar">
      <style>{`
        @keyframes kwBellRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-13deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(4deg); }
          60% { transform: rotate(0deg); }
        }
        @keyframes kwDotPop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.16); }
        }
        .topbar-bell-btn {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .topbar-bell-btn.has-unread {
          color: #1a5c3a;
        }
        .topbar-bell-btn.has-unread svg {
          transform-origin: 50% 15%;
          animation: kwBellRing 2.6s ease-in-out infinite;
        }
        .topbar-bell-btn .dot-count {
          top: 3px;
          right: 3px;
          min-width: 20px;
          height: 20px;
          font-size: 11px;
          background: #dc2626;
          color: #fff;
          box-shadow: 0 0 0 2px #f9f7f4;
          animation: kwDotPop 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .topbar-bell-btn.has-unread svg,
          .topbar-bell-btn .dot-count {
            animation: none !important;
          }
        }
      `}</style>
      <button
        className="icon-btn menu-btn"
        type="button"
        onClick={onOpenSidebar}
        aria-label="Ouvrir le menu"
        aria-controls="sidebar"
      >
        <Icon name="bars-3" size={24} />
      </button>

      {backNav && (
        <button
          type="button"
          onClick={() => navigate(backNav.target)}
          className="icon-btn"
          title={backNav.label}
          aria-label={backNav.label}
          style={{ marginRight: 8 }}
        >
          <Icon name="arrow-left" size={20} />
        </button>
      )}

      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        {(role === 'ADMIN' || role === 'OPERATOR') && (
          <div className="search admin-search" role="search" ref={searchContainerRef}>
            <Icon name="magnifying-glass" size={18} />
            <label className="sr-only" htmlFor="admin-search-all">
              {role === 'OPERATOR' ? 'Rechercher une mission' : 'Rechercher une demande ou un client'}
            </label>
            <input
              id="admin-search-all"
              type="search"
              autoComplete="off"
              placeholder={role === 'OPERATOR' ? 'Mission, n° de suivi…' : 'Demande, client, n° de suivi…'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => {
                if (needle.length >= 2) setShowSearchResults(true);
              }}
            />

            {showSearchResults && needle.length >= 2 && (
              <div className="search-results" id="admin-search-list">
                {searching ? (
                  <p className="search-empty">Recherche…</p>
                ) : matchingRequests.length === 0 && matchingClients.length === 0 ? (
                  <p className="search-empty">Aucun résultat pour « {needle} ».</p>
                ) : (
                  <>
                    {matchingRequests.map(r => {
                      const service = r.service || services.find(s => s.slug === r.serviceSlug || s.id === r.serviceId);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className="search-result text-left w-full border-0 bg-transparent cursor-pointer p-0"
                          onClick={() => {
                            navigate(role === 'OPERATOR' ? 'operator-mission-detail' : 'admin-request-detail', r.id);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <span className="tile tile-sm">
                            <Icon name={service?.icon || 'clipboard-document-list'} size={18} />
                          </span>
                          <span>
                            <strong>{r.title}</strong>
                            <small>
                              {r.tracking} · {r.status === 'pending' ? 'En attente' : r.status === 'active' ? 'En cours' : r.status === 'done' ? 'Terminée' : 'Annulée'}
                            </small>
                          </span>
                        </button>
                      );
                    })}

                    {matchingClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="search-result text-left w-full border-0 bg-transparent cursor-pointer p-0"
                        onClick={() => {
                          setActiveClientId(c.id);
                          navigate('admin-clients');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                      >
                        <span className="avatar avatar-sm">
                          {`${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || 'CL'}
                        </span>
                        <span>
                          <strong>{c.fullName || `${c.firstName} ${c.lastName}`}</strong>
                          <small>{c.email}</small>
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {actions}

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            className={`icon-btn topbar-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications, ${unreadCount} non lues`}
          >
            <Icon name="bell" size={26} />
            {unreadCount > 0 && <span className="dot-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e0e8e4] py-2 z-50">
              <div className="px-4 py-2 border-b border-[#e0e8e4] flex items-center justify-between gap-2">
                <strong className="text-sm">Notifications</strong>
                <div className="flex items-center gap-2">
                  <small className="muted">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</small>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-xs font-medium text-[#1b4d3e] hover:underline bg-transparent border-0 cursor-pointer p-0"
                      onClick={() => markAllNotificationsRead()}
                    >
                      Tout lire
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto overflow-x-hidden divide-y divide-neutral-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center muted small">Aucune notification.</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setShowNotifications(false);
                        navigateFromLink(n.href);
                      }}
                      className={`px-4 py-3 hover:bg-neutral-50 cursor-pointer transition ${
                        !n.read ? 'bg-[#fdf6e0]/50' : ''
                      }`}
                    >
                      <p className={`text-[13px] leading-snug whitespace-normal break-words ${!n.read ? 'font-semibold text-[#1a1f1b]' : 'text-[#56635b]'}`}>
                        {n.text}
                      </p>
                      <span className="text-[11px] text-neutral-400 mt-1 block">
                        {n.at ? new Date(n.at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
