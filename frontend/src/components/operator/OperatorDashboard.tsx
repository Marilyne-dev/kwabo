import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, DOC_TYPE_META } from '../../data/kwaboData';

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
      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="clipboard-document-list" size={18} />
          </span>
          <strong>{assigned.length}</strong>
          <span>Missions attribuées</span>
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

      {/* Dash Grid */}
      <div className="dash-grid">
        {/* À faire */}
        <section className="card">
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
              {pendingWork.map(({ r, reasons }) => {
                const s = SERVICES.find(srv => srv.id === r.serviceId) || SERVICES[0];
                const client = users.find(u => u.id === r.userId);

                return (
                  <a
                    key={r.id}
                    className="work-row"
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
        <section className="card">
          <h2>Derniers documents déposés</h2>
          {docs.length === 0 ? (
            <p className="muted">Aucun document pour le moment.</p>
          ) : (
            <ul className="doc-list">
              {docs.map(d => {
                const meta = DOC_TYPE_META[d.type];
                const service = SERVICES.find(s => s.id === d.requestId) || SERVICES[0];
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
