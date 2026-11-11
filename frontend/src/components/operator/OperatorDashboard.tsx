import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, DOC_TYPE_META } from '../../data/kwaboData';

/* Animations ajoutées (CSS uniquement, aucune logique modifiée) */
const OPERATOR_DASHBOARD_ANIMATIONS = `
@keyframes kwFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
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
@keyframes kwValueIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwUrgentPulse {
  0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
  70%  { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
@keyframes kwEmptyFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

/* Statistiques */
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
.kw-stat strong {
  display: inline-block;
  animation: kwValueIn 0.6s ease both;
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

/* Lignes « À faire » */
.kw-row {
  opacity: 0;
  animation: kwSlideRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.25s ease, background-color 0.25s ease;
}
.kw-row:hover {
  transform: translateX(4px);
}
.kw-row > svg:last-child {
  transition: transform 0.25s ease;
}
.kw-row:hover > svg:last-child {
  transform: translateX(4px);
}
.kw-row .badge-red {
  animation: kwUrgentPulse 1.8s ease-out infinite;
}

/* État vide */
.kw-card .empty-state .tile-lg {
  animation: kwEmptyFloat 3s ease-in-out infinite;
}

/* Documents */
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

/* Liens */
.kw-card .card-head a {
  transition: opacity 0.2s ease;
}
.kw-card .card-head a:hover {
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .kw-stat,
  .kw-stat strong,
  .kw-card,
  .kw-row,
  .kw-item {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
  .kw-row .badge-red,
  .kw-card .empty-state .tile-lg {
    animation: none !important;
  }
}
`;

export const OperatorDashboard: React.FC = () => {
  const { currentUser, requests, users, documents, messages, navigate, openPhotoModal, addToast } = useApp();

  const assigned = requests.filter(r => r.operatorId === currentUser?.id);
  const count = (status: string) => assigned.filter(r => r.status === status).length;

  const docs = documents
    .filter(d => assigned.some(r => r.id === d.requestId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Pending work for operator
  const pendingWork = assigned
    .filter(r => ['pending', 'active'].includes(r.status))
    .map(r => {
      const reasons: [string, string][] = [];
      const unread = messages.filter(m => m.requestId === r.id && m.from === 'client' && !m.read).length;
      if (unread > 0) reasons.push(['chat-bubble-left-right', `${unread} message${unread > 1 ? 's' : ''}`]);
      if (r.status === 'active' && !reasons.length) reasons.push(['document-text', 'Rapport à déposer']);
      return { r, reasons };
    })
    .filter(w => w.reasons.length > 0)
    .sort((a, b) => (b.r.urgency === 'urgent' ? 1 : 0) - (a.r.urgency === 'urgent' ? 1 : 0));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <style>{OPERATOR_DASHBOARD_ANIMATIONS}</style>

      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-neutral kw-stat" style={{ animationDelay: '0.1s' }}>
          <span className="tile tile-sm">
            <Icon name="clipboard-document-list" size={18} />
          </span>
          <strong style={{ animationDelay: '0.45s' }}>{assigned.length}</strong>
          <span>Missions attribuées</span>
        </li>
        <li className="stat stat-gold kw-stat" style={{ animationDelay: '0.2s' }}>
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong style={{ animationDelay: '0.55s' }}>{count('pending')}</strong>
          <span>En attente</span>
        </li>
        <li className="stat stat-green kw-stat" style={{ animationDelay: '0.3s' }}>
          <span className="tile tile-sm">
            <Icon name="bolt" size={18} />
          </span>
          <strong style={{ animationDelay: '0.65s' }}>{count('active')}</strong>
          <span>En cours</span>
        </li>
        <li className="stat stat-neutral kw-stat" style={{ animationDelay: '0.4s' }}>
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong style={{ animationDelay: '0.75s' }}>{count('done')}</strong>
          <span>Terminées</span>
        </li>
      </ul>

      {/* Dash Grid */}
      <div className="dash-grid">
        {/* À faire */}
        <section className="card kw-card" style={{ animationDelay: '0.5s' }}>
          <div className="card-head">
            <h2>À faire</h2>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('operator-missions'); }}>
              Toutes mes missions
            </a>
          </div>

          {pendingWork.length === 0 ? (
            <div className="empty-state">
              <span className="tile tile-lg">
                <Icon name="check-circle" size={32} />
              </span>
              <h3>Tout est à jour</h3>
              <p className="muted">Aucune demande n'attend d'action.</p>
            </div>
          ) : (
            <div className="request-list">
              {pendingWork.map(({ r, reasons }, rowIdx) => {
                const s = SERVICES.find(srv => srv.id === r.serviceId) || SERVICES[0];
                const client = users.find(u => u.id === r.userId);

                return (
                  <a
                    key={r.id}
                    className="work-row kw-row"
                    style={{ animationDelay: `${0.7 + rowIdx * 0.1}s` }}
                    href={`#/demandes/${r.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('admin-request-detail', r.id);
                    }}
                  >
                    <span className={`tile cat-${s.cat}`}>
                      <Icon name={s.icon} size={20} />
                    </span>
                    <span className="request-row-main">
                      <strong>{r.title}</strong>
                      <small>{r.tracking} · {client ? `${client.firstName} ${client.lastName}` : 'Client'}</small>
                      <span className="reasons">
                        {r.urgency === 'urgent' && (
                          <span className="badge badge-red">
                            <Icon name="bolt" size={14} />
                            Urgent
                          </span>
                        )}
                        {reasons.map(([ic, text], idx) => (
                          <span key={idx} className="badge badge-gold">
                            <Icon name={ic} size={14} />
                            {text}
                          </span>
                        ))}
                      </span>
                    </span>
                    <Icon name="chevron-right" size={18} />
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* Derniers documents déposés */}
        <section className="card kw-card" style={{ animationDelay: '0.6s' }}>
          <h2>Derniers documents déposés</h2>
          {docs.length === 0 ? (
            <p className="muted">Aucun document pour le moment.</p>
          ) : (
            <ul className="doc-list">
              {docs.map((d, idx) => {
                const meta = DOC_TYPE_META[d.type];
                const service = SERVICES.find(s => s.id === d.requestId) || SERVICES[0];
                return (
                  <li
                    key={d.id}
                    className="doc-item kw-item"
                    style={{ animationDelay: `${0.8 + idx * 0.12}s` }}
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
                      onClick={() => openPhotoModal(d.name, d.photoName ? `/assets/photos/${d.photoName}.jpg` : service.photo)}
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
          )}
        </section>
      </div>
    </>
  );
};
