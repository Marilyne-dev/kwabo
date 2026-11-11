import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { STATUS_MAP, DOC_TYPE_META, SERVICES } from '../../data/kwaboData';
import { api } from '../../services/api';
import {
  mapDocument,
  mapInvoice,
  mapNotification,
  mapRequest,
  mapServiceItem,
} from '../../services/mappers';
import { DocumentItem, InvoiceItem, NotificationItem, RequestItem, Service } from '../../types';

/* Animations ajoutées (CSS uniquement, aucune logique modifiée) */
const DASHBOARD_ANIMATIONS = `
@keyframes kwWordIn {
  0%   { opacity: 0; transform: translateY(22px) scale(0.92); filter: blur(6px); }
  60%  { opacity: 1; transform: translateY(-3px) scale(1.02); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes kwFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes kwPopIn {
  0%   { opacity: 0; transform: scale(0.85); }
  70%  { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes kwSlideRight {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes kwKenBurns {
  from { transform: scale(1.05); }
  to   { transform: scale(1.14); }
}
@keyframes kwCurrentPulse {
  0%   { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.5); }
  70%  { box-shadow: 0 0 0 10px rgba(212, 160, 23, 0); }
  100% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0); }
}
@keyframes kwAlertShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

/* Bonjour + prénom : mot par mot */
.kw-greeting .kw-word {
  display: inline-block;
  opacity: 0;
  animation: kwWordIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  will-change: transform, opacity, filter;
}
.kw-greeting .kw-word + .kw-word {
  margin-left: 0.3em;
}

/* Bannière */
.kw-welcome-img {
  animation: kwKenBurns 14s ease-in-out infinite alternate;
}
.kw-welcome-text {
  opacity: 0;
  animation: kwFadeUp 0.7s ease 1.3s forwards;
}
.kw-welcome-cta {
  opacity: 0;
  animation: kwFadeUp 0.7s ease 1.6s forwards;
}

/* Stats */
.kw-stat {
  opacity: 0;
  animation: kwPopIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.kw-stat:hover {
  transform: translateY(-4px);
}
.kw-stat .tile {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.kw-stat:hover .tile {
  transform: scale(1.15) rotate(-6deg);
}

/* Cartes de statistiques : une couleur par carte, texte blanc, sans soulignement */
.stats .kw-stat {
  position: relative;
  overflow: hidden;
  border: none !important;
  box-shadow: 0 8px 20px rgba(18, 63, 40, 0.25);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.stats .kw-stat::after {
  content: '';
  position: absolute;
  right: -28px;
  bottom: -34px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.stats .kw-stat:hover::after {
  transform: scale(1.35);
}
.stats .kw-stat,
.stats .kw-stat * {
  color: #ffffff !important;
}
.stats .kw-stat a,
.stats .kw-stat a:hover,
.stats .kw-stat a:focus {
  text-decoration: none !important;
}
.stats .kw-stat .tile {
  background: rgba(255, 255, 255, 0.2) !important;
}
.stats .kw-stat:hover {
  box-shadow: 0 14px 28px rgba(18, 63, 40, 0.35);
}

/* 1. Vert profond */
.stats .kw-stat:nth-child(1) {
  background: linear-gradient(135deg, #1a5c38 0%, #123f28 100%) !important;
}
/* 2. Vert franc */
.stats .kw-stat:nth-child(2) {
  background: linear-gradient(135deg, #3a8a5c 0%, #2a7048 100%) !important;
}
/* 3. Or foncé */
.stats .kw-stat:nth-child(3) {
  background: linear-gradient(135deg, #b8860b 0%, #8f6a08 100%) !important;
}
/* 4. Ardoise */
.stats .kw-stat:nth-child(4) {
  background: linear-gradient(135deg, #455a4f 0%, #2f4036 100%) !important;
}

/* Alerte devis */
.kw-alert {
  opacity: 0;
  animation: kwFadeUp 0.5s ease forwards, kwAlertShake 0.6s ease 0.8s 1;
}

/* Cartes */
.kw-card {
  opacity: 0;
  animation: kwFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.kw-card:hover {
  transform: translateY(-2px);
}

/* Lignes de demandes */
.kw-row {
  opacity: 0;
  animation: kwSlideRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.25s ease, background-color 0.25s ease;
}
.kw-row:hover {
  transform: translateX(4px);
}
.kw-row:hover .request-row-side > svg:last-child {
  transform: translateX(3px);
}
.kw-row .request-row-side > svg:last-child {
  transition: transform 0.25s ease;
}

/* Étapes de statut */
.kw-step {
  opacity: 0;
  animation: kwSlideRight 0.5s ease forwards;
}
.kw-step.is-current .status-step-dot {
  animation: kwCurrentPulse 1.8s ease-out infinite;
}

/* Notifications et documents */
.kw-item {
  opacity: 0;
  animation: kwSlideRight 0.45s ease forwards;
}
.kw-item .icon-btn {
  transition: transform 0.2s ease;
}
.kw-item .icon-btn:hover {
  transform: scale(1.18);
}

/* Services */
.kw-service {
  opacity: 0;
  animation: kwFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.kw-service:hover {
  transform: translateY(-5px);
}
.kw-service .service-card-foot svg {
  transition: transform 0.25s ease;
}
.kw-service:hover .service-card-foot svg {
  transform: translateX(5px);
}

@media (prefers-reduced-motion: reduce) {
  .kw-greeting .kw-word,
  .kw-welcome-text,
  .kw-welcome-cta,
  .kw-stat,
  .kw-alert,
  .kw-card,
  .kw-row,
  .kw-step,
  .kw-item,
  .kw-service {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
  .kw-welcome-img,
  .kw-step.is-current .status-step-dot {
    animation: none !important;
  }
}
`;

export const ClientDashboard: React.FC = () => {
  const {
    currentUser,
    services,
    categories,
    notifications: globalNotifications,
    navigate,
    setPendingServiceSlug,
    openPhotoModal,
    downloadDocument,
  } = useApp();

  const [recentRequests, setRecentRequests] = useState<RequestItem[]>([]);
  const [allCounts, setAllCounts] = useState({ total: 0, pending: 0, active: 0, done: 0 });
  const [active, setActive] = useState<RequestItem | null>(null);
  const [dueInvoices, setDueInvoices] = useState<InvoiceItem[]>([]);
  const [dashNotifs, setDashNotifs] = useState<NotificationItem[]>([]);
  const [lastDocs, setLastDocs] = useState<DocumentItem[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api<any>('/dashboard'),
      api<any>('/requests', { params: { per_page: 200 } }).catch(() => null),
    ])
      .then(([dashRes, reqRes]) => {
        if (cancelled) return;
        const d = dashRes?.data ?? dashRes ?? {};
        const recReqs = Array.isArray(d.recent_requests) ? d.recent_requests.map(mapRequest) : [];
        setRecentRequests(recReqs);

        const rawActive = d.active_mission?.request ?? d.active_mission ?? null;
        setActive(rawActive ? mapRequest(rawActive) : null);

        setDueInvoices(Array.isArray(d.due_invoices) ? d.due_invoices.map(mapInvoice) : []);
        setDashNotifs(Array.isArray(d.notifications) ? d.notifications.map(mapNotification) : []);
        setLastDocs(Array.isArray(d.recent_documents) ? d.recent_documents.map((doc: any) => mapDocument(doc)) : []);
        setPopularServices(
          Array.isArray(d.popular_services) && d.popular_services.length > 0
            ? d.popular_services.map((s: any) => mapServiceItem(s))
            : services.filter(s => s.popular && s.available).slice(0, 4)
        );

        const reqList = Array.isArray(reqRes?.data) ? reqRes.data.map(mapRequest) : recReqs;
        if (d.stats) {
          setAllCounts({
            total: Number(d.stats.total ?? reqList.length),
            pending: Number(d.stats.pending ?? 0),
            active: Number(d.stats.active ?? 0),
            done: Number(d.stats.done ?? 0),
          });
        } else {
          setAllCounts({
            total: reqList.length,
            pending: reqList.filter((r: RequestItem) => r.status === 'pending').length,
            active: reqList.filter((r: RequestItem) => r.status === 'active').length,
            done: reqList.filter((r: RequestItem) => r.status === 'done').length,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [services]);

  const userNotifs = dashNotifs.length > 0 ? dashNotifs : globalNotifications.filter(n => !n.read);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const statusOrder = ['pending', 'active', 'done'];

  // Mots du message d'accueil, affichés un à un
  const greetingWords = ['Bonjour', ...(currentUser?.firstName ? currentUser.firstName.split(' ') : [])];

  return (
    <>
      <style>{DASHBOARD_ANIMATIONS}</style>

      {/* Welcome Banner enrichi avec image de fond & animations */}
      <section className="welcome relative overflow-hidden shadow-lg border border-[#123f28]/30">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img
            src="/assets/photos/cotonou.jpg"
            alt="Bénin"
            className="w-full h-full object-cover filter brightness-75 scale-105 kw-welcome-img"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123f28] via-[#1a4d30] to-transparent" />
        </div>
        <div className="relative z-10">
       
          <h2 className="kw-greeting" aria-label={`Bonjour ${currentUser?.firstName ?? ''}`}>
            {greetingWords.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="kw-word"
                aria-hidden="true"
                style={{ animationDelay: `${0.2 + i * 0.55}s` }}
              >
                {word}
              </span>
            ))}
          </h2>
          <p className="max-w-xl text-sm sm:text-base text-white/90 kw-welcome-text">
            {active
              ? `Votre mission « ${active.title} » avance. Tout est à jour ci-dessous.`
              : 'Dites-nous ce dont vous avez besoin au Bénin, nous nous en occupons avec preuves et rigueur.'}
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3 kw-welcome-cta">
          <button
            className="btn btn-gold btn-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
            type="button"
            onClick={() => navigate('client-new-request')}
          >
            <Icon name="plus-circle" size={20} />
            <span>Nouvelle demande </span>
          </button>
        </div>
      </section>

      {/* 4 Stats Cards */}
      <ul className="stats">
        <li className="stat stat-neutral kw-stat" style={{ animationDelay: '1.7s' }}>
          <span className="tile tile-sm">
            <Icon name="clipboard-document-list" size={18} />
          </span>
          <strong>{allCounts.total}</strong>
          <span>Demandes au total</span>
        </li>
        <li className="stat stat-gold kw-stat" style={{ animationDelay: '1.8s' }}>
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong>{allCounts.pending}</strong>
          <span>En attente</span>
        </li>
        <li className="stat stat-green kw-stat" style={{ animationDelay: '1.9s' }}>
          <span className="tile tile-sm">
            <Icon name="bolt" size={18} />
          </span>
          <strong>{allCounts.active}</strong>
          <span>En cours</span>
        </li>
        <li className="stat stat-neutral kw-stat" style={{ animationDelay: '2s' }}>
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong>{allCounts.done}</strong>
          <span>Terminées</span>
        </li>
      </ul>

      {/* Devis en attente de paiement alert */}
      {dueInvoices.map((i, idx) => (
        <div key={i.id} className="alert kw-alert" style={{ animationDelay: `${2.1 + idx * 0.1}s, ${2.6 + idx * 0.1}s` }}>
          <span className="tile tile-sm">
            <Icon name="banknotes" size={18} />
          </span>
          <p>
            <strong>Un devis attend votre paiement.</strong> {i.label} : {formatMoney(i.amount)}. La mission démarre dès le paiement.
          </p>
          <button
            className="btn btn-gold btn-sm"
            type="button"
            onClick={() => {
              navigate('client-invoices');
            }}
          >
          Passer au paiement
          </button>
        </div>
      ))}

      {/* Main Dash Grid */}
      <div className="dash-grid">
        {/* Left Stack: Mes dernières demandes & Mission en cours */}
        <div className="stack">
          <section className="card kw-card" style={{ animationDelay: '2.2s' }}>
            <div className="card-head">
              <h2>Mes dernières demandes</h2>
              <a href="#/espace/demandes" onClick={(e) => { e.preventDefault(); navigate('client-requests'); }}>
                Tout voir
              </a>
            </div>

            {loading ? (
              <p className="muted">Chargement…</p>
            ) : recentRequests.length === 0 ? (
              <div className="empty-state">
                <span className="tile tile-lg">
                  <Icon name="clipboard-document-list" size={32} />
                </span>
                <h3>Aucune demande</h3>
                <p className="muted">Votre première demande prend moins de 3 minutes.</p>
                <div className="btn-row btn-row-center mt-3">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => navigate('client-new-request')}
                  >
                    Faire une demande
                  </button>
                </div>
              </div>
            ) : (
              <div className="request-list">
                {recentRequests.slice(0, 3).map((r, idx) => {
                  const s = r.service || services.find(srv => srv.slug === r.serviceSlug || srv.id === r.serviceId);
                  return (
                    <a
                      key={r.id}
                      className="request-row kw-row"
                      style={{ animationDelay: `${2.4 + idx * 0.12}s` }}
                      href={`#/espace/demandes/${r.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('client-request-detail', r.id);
                      }}
                    >
                      <span className={`tile cat-${s?.cat || 'demarches'}`}>
                        <Icon name={s?.icon || 'clipboard-document-list'} size={20} />
                      </span>
                      <span className="request-row-main">
                        <strong>{r.title}</strong>
                        <small>{r.tracking} · {r.city} · {formatDate(r.createdAt)}</small>
                      </span>
                      <span className="request-row-side">
                        {r.urgency === 'urgent' && (
                          <span className="badge badge-red">
                            <Icon name="bolt" size={14} />
                            Urgent
                          </span>
                        )}
                        <span className={`badge badge-${STATUS_MAP[r.status].color}`}>
                          <Icon name={STATUS_MAP[r.status].icon} size={14} />
                          {STATUS_MAP[r.status].label}
                        </span>
                        <Icon name="chevron-right" size={18} />
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mission en cours Card */}
          {active && (
            <section className="card kw-card" style={{ animationDelay: '2.5s' }}>
              <div className="card-head">
                <h2>Mission en cours</h2>
                <a
                  href={`#/espace/demandes/${active.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('client-request-detail', active.id);
                  }}
                >
                  Ouvrir
                </a>
              </div>
              <p className="card-lead font-bold mb-3">{active.title}</p>
              
              <ol className="status-steps">
                {statusOrder.map((key, i) => {
                  const isDone = i < statusOrder.indexOf(active.status) || active.status === 'done';
                  const isCurrent = i === statusOrder.indexOf(active.status) && active.status !== 'done';
                  const meta = STATUS_MAP[key as keyof typeof STATUS_MAP];

                  return (
                    <li
                      key={key}
                      className={`kw-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                      style={{ animationDelay: `${2.8 + i * 0.2}s` }}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <span className="status-step-dot">
                        {isDone ? <Icon name="check" size={16} /> : <Icon name={meta.icon} size={16} />}
                      </span>
                      <span>{meta.label}</span>
                    </li>
                  );
                })}
              </ol>

              {active.history && active.history.length > 0 && (
                <p className="muted last-event mt-3 flex items-center gap-1.5 text-xs">
                  <Icon name="clock" size={16} />
                  <span>Dernière mise à jour : {active.history.at(-1)?.text}, {formatDateTime(active.history.at(-1)?.at || active.createdAt)}</span>
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right Stack: Notifications & Derniers documents */}
        <div className="stack">
          <section className="card kw-card" style={{ animationDelay: '2.3s' }}>
            <div className="card-head">
              <h2>Notifications</h2>
              <span className="muted small-text">{userNotifs.length} non lues</span>
            </div>

            {userNotifs.length === 0 ? (
              <p className="muted">Rien de nouveau. Vous êtes à jour.</p>
            ) : (
              <ul className="notif-list space-y-2">
                {userNotifs.slice(0, 3).map((n, idx) => (
                  <li
                    key={n.id}
                    className="p-2.5 rounded-xl bg-[#fdf6e0]/60 border border-[#f1e3ae] text-xs kw-item"
                    style={{ animationDelay: `${2.5 + idx * 0.12}s` }}
                  >
                    <p className="font-semibold">{n.text}</p>
                    <small className="muted">{formatDateTime(n.at)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {lastDocs.length > 0 && (
            <section className="card kw-card" style={{ animationDelay: '2.5s' }}>
              <div className="card-head">
                <h2>Derniers documents</h2>
                <a href="#/espace/documents" onClick={(e) => { e.preventDefault(); navigate('client-documents'); }}>
                  Tout voir
                </a>
              </div>
              <ul className="doc-list">
                {lastDocs.map((d, idx) => {
                  const meta = DOC_TYPE_META[d.type] || DOC_TYPE_META.report;
                  const downloadPath = `/documents/${d.id}/download`;
                  return (
                    <li
                      key={d.id}
                      className="doc-item kw-item"
                      style={{ animationDelay: `${2.7 + idx * 0.12}s` }}
                    >
                      <span className="tile tile-sm">
                        <Icon name={meta.icon} size={18} />
                      </span>
                      <span className="doc-item-main">
                        <strong>{d.name}</strong>
                        <small>{meta.label} · {formatDate(d.createdAt)}</small>
                      </span>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Voir"
                        onClick={() => openPhotoModal(downloadPath, d.name, downloadPath, true)}
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Télécharger"
                        onClick={() => downloadDocument(downloadPath, d.name)}
                      >
                        <Icon name="arrow-down-tray" size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Services les plus demandés (section-in-app) */}
      <section className="section-in-app mt-8">
        <div className="card-head">
          <h2>Services les plus demandés</h2>
          <a href="#/espace/services" onClick={(e) => { e.preventDefault(); navigate('client-new-request'); }}>
            Voir le catalogue
          </a>
        </div>
        <div className="service-grid service-grid-compact">
          {(popularServices.length > 0 ? popularServices : services.filter(s => s.popular && s.available)).slice(0, 4).map((s, idx) => {
            const cat = categories.find(c => c.id === s.cat);
            const fallbackPhoto = SERVICES.find(srv => srv.id === (s.slug || s.id))?.photo;
            const photoSrc = s.photo || fallbackPhoto || '/assets/photos/chantier-500.jpg';
            return (
              <a
                key={s.id}
                className="service-card kw-service"
                style={{ animationDelay: `${2.9 + idx * 0.12}s` }}
                href={`#/espace/nouvelle-demande?service=${s.slug || s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setPendingServiceSlug(s.slug || s.id);
                  navigate('client-new-request');
                }}
              >
                <span className={`service-card-top cat-${s.cat}`} style={{ padding: '12px 18px' }}>
                  <img
                    src={photoSrc}
                    alt={s.name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1.5px solid rgba(255, 255, 255, 0.75)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                    }}
                  />
                  <span className="service-card-cat">{cat?.short}</span>
                </span>
                <span className="service-card-body">
                  <strong>{s.name}</strong>
                  <span className="muted">{s.short}</span>
                  <span className="service-card-foot">
                    <span className="price">{s.price}</span>
                    <Icon name="arrow-right" size={18} />
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
};
