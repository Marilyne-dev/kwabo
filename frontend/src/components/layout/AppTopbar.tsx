import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES } from '../../data/kwaboData';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  actions?: React.ReactNode;
}

export const AppTopbar: React.FC<TopbarProps> = ({ title, subtitle, onOpenSidebar, actions }) => {
  const { currentUser, role, currentView, requests, users, notifications, markNotificationRead, navigate } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const userNotifs = notifications.filter(n => 
    role === 'ADMIN' ? true : n.userId === currentUser?.id || n.userId === 'team'
  );
  const unreadCount = userNotifs.filter(n => !n.read).length;

  // Live admin/operator search logic from admin.js (INPUTS.adminSearchAll)
  const needle = searchQuery.trim().toLowerCase();
  const visibleRequests = role === 'OPERATOR' 
    ? requests.filter(r => r.operatorId === currentUser?.id)
    : requests;

  const matchingRequests = needle.length >= 2
    ? visibleRequests.filter(r => (r.title + ' ' + r.tracking).toLowerCase().includes(needle)).slice(0, 5)
    : [];
  const matchingClients = (needle.length >= 2 && role === 'ADMIN')
    ? users.filter(u => u.role === 'USER' && (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(needle)).slice(0, 4)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Déterminer s'il faut afficher un bouton retour (pages secondaires)
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
        {/* Live Admin/Operator Search (admin.js) */}
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
                if (searchQuery.trim().length >= 2) setShowSearchResults(true);
              }}
            />

            {showSearchResults && needle.length >= 2 && (
              <div className="search-results" id="admin-search-list">
                {matchingRequests.length === 0 && matchingClients.length === 0 ? (
                  <p className="search-empty">Aucun résultat pour « {searchQuery.trim()} ».</p>
                ) : (
                  <>
                    {matchingRequests.map(r => {
                      const service = SERVICES.find(s => s.id === r.serviceId) || SERVICES[0];
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className="search-result text-left w-full border-0 bg-transparent cursor-pointer p-0"
                          onClick={() => {
                            navigate('admin-request-detail', r.id);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <span className="tile tile-sm">
                            <Icon name={service.icon} size={18} />
                          </span>
                          <span>
                            <strong>{r.title}</strong>
                            <small>{r.tracking} · {r.status === 'pending' ? 'En attente' : r.status === 'active' ? 'En cours' : r.status === 'done' ? 'Terminée' : 'Annulée'}</small>
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
                          navigate('admin-clients');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                      >
                        <span className="avatar avatar-sm">{c.firstName[0]}{c.lastName[0]}</span>
                        <span>
                          <strong>{c.firstName} {c.lastName}</strong>
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
        <div className="relative">
          <button 
            className="icon-btn" 
            type="button" 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notifications, ${unreadCount} non lues`}
          >
            <Icon name="bell" size={22} />
            {unreadCount > 0 && <span className="dot-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e0e8e4] py-2 z-50">
              <div className="px-4 py-2 border-b border-[#e0e8e4] flex items-center justify-between">
                <strong className="text-sm">Notifications</strong>
                <small className="muted">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</small>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                {userNotifs.length === 0 ? (
                  <p className="p-4 text-center muted small">Aucune notification.</p>
                ) : (
                  userNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setShowNotifications(false);
                        if (n.href.includes('requests-detail/') || n.href.includes('admin-requests/')) {
                          const id = n.href.split('/').pop();
                          if (id) {
                            navigate(role === 'ADMIN' ? 'admin-request-detail' : 'client-request-detail', id);
                          }
                        }
                      }}
                      className={`p-3.5 hover:bg-neutral-50 cursor-pointer transition text-xs flex gap-3 ${
                        !n.read ? 'bg-[#fdf6e0]/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <Icon name={!n.read ? 'bolt' : 'check'} size={14} className={!n.read ? 'text-[#d4a017]' : 'text-neutral-400'} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs ${!n.read ? 'font-semibold text-[#1a1f1b]' : 'text-[#56635b]'}`}>
                          {n.text}
                        </p>
                        <span className="text-[10px] text-neutral-400 mt-1 block">
                          {new Date(n.at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
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

