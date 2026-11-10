import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES, STATUS_MAP, DOC_TYPE_META } from '../../data/kwaboData';

export const ClientDashboard: React.FC = () => {
  const { currentUser, requests, documents, invoices, notifications, navigate, openPhotoModal, addToast } = useApp();

  const userRequests = requests.filter(r => r.userId === currentUser?.id);
  const count = (status: string) => userRequests.filter(r => r.status === status).length;
  const active = userRequests.find(r => r.status === 'active');
  const dueInvoices = invoices.filter(i => i.userId === currentUser?.id && i.status === 'due');
  const userNotifs = notifications.filter(n => n.userId === currentUser?.id && !n.read);
  const lastDocs = documents
    .filter(d => userRequests.some(r => r.id === d.requestId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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

  return (
    <>
      {/* Welcome Banner */}
      <section className="welcome">
        <div>
          <h2>Bonjour {currentUser?.firstName}</h2>
          <p>
            {active
              ? `Votre mission « ${active.title} » avance. Tout est à jour ci-dessous.`
              : 'Dites-nous ce dont vous avez besoin au Bénin, nous nous en occupons.'}
          </p>
        </div>
        <button
          className="btn btn-gold btn-lg"
          type="button"
          onClick={() => navigate('client-new-request')}
        >
          <Icon name="plus-circle" size={20} />
          <span>Nouvelle demande</span>
        </button>
      </section>

      {/* 4 Stats Cards */}
      <ul className="stats">
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="clipboard-document-list" size={18} />
          </span>
          <strong>{userRequests.length}</strong>
          <span>Demandes au total</span>
        </li>
        <li className="stat stat-gold">
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong>{count('pending')}</strong>
          <span>En attente</span>
        </li>
        <li className="stat stat-green">
          <span className="tile tile-sm">
            <Icon name="bolt" size={18} />
          </span>
          <strong>{count('active')}</strong>
          <span>En cours</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong>{count('done')}</strong>
          <span>Terminées</span>
        </li>
      </ul>

      {/* Devis en attente de paiement alert */}
      {dueInvoices.map(i => (
        <div key={i.id} className="alert">
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
            Payer
          </button>
        </div>
      ))}

      {/* Main Dash Grid */}
      <div className="dash-grid">
        {/* Left Stack: Mes dernières demandes & Mission en cours */}
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Mes dernières demandes</h2>
              <a href="#/espace/demandes" onClick={(e) => { e.preventDefault(); navigate('client-requests'); }}>
                Tout voir
              </a>
            </div>

            {userRequests.length === 0 ? (
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
                {userRequests.slice(0, 3).map(r => {
                  const s = SERVICES.find(srv => srv.id === r.serviceId) || SERVICES[0];
                  return (
                    <a
                      key={r.id}
                      className="request-row"
                      href={`#/espace/demandes/${r.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('client-request-detail', r.id);
                      }}
                    >
                      <span className={`tile cat-${s.cat}`}>
                        <Icon name={s.icon} size={20} />
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
            <section className="card">
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
                      className={`${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
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
          <section className="card">
            <div className="card-head">
              <h2>Notifications</h2>
              <span className="muted small-text">{userNotifs.length} non lues</span>
            </div>

            {userNotifs.length === 0 ? (
              <p className="muted">Rien de nouveau. Vous êtes à jour.</p>
            ) : (
              <ul className="notif-list space-y-2">
                {userNotifs.slice(0, 3).map(n => (
                  <li key={n.id} className="p-2.5 rounded-xl bg-[#fdf6e0]/60 border border-[#f1e3ae] text-xs">
                    <p className="font-semibold">{n.text}</p>
                    <small className="muted">{formatDateTime(n.at)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {lastDocs.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Derniers documents</h2>
                <a href="#/espace/documents" onClick={(e) => { e.preventDefault(); navigate('client-documents'); }}>
                  Tout voir
                </a>
              </div>
              <ul className="doc-list">
                {lastDocs.map(d => {
                  const meta = DOC_TYPE_META[d.type];
                  return (
                    <li key={d.id} className="doc-item">
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
                        onClick={() => openPhotoModal(d.name, d.photoName ? `/assets/photos/${d.photoName}.jpg` : '/assets/photos/chantier-tour.jpg')}
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title="Télécharger"
                        onClick={() => addToast(`Téléchargement de ${d.name}...`)}
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
          {SERVICES.filter(s => s.popular && s.available).slice(0, 4).map(s => {
            const cat = CATEGORIES.find(c => c.id === s.cat);
            return (
              <a
                key={s.id}
                className="service-card"
                href={`#/espace/nouvelle-demande?service=${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('client-new-request', s.id);
                }}
              >
                <span className={`service-card-top cat-${s.cat}`}>
                  <Icon name={s.icon} size={26} />
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
