import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES } from '../../data/kwaboData';

export const ClientDocuments: React.FC = () => {
  const { currentUser, documents, requests, openPhotoModal, navigate } = useApp();

  const userRequests = requests.filter(r => r.userId === currentUser?.id);
  const groups = userRequests
    .map(r => ({
      r,
      docs: documents.filter(d => d.requestId === r.id)
    }))
    .filter(g => g.docs.length > 0);

  const docIconMap: Record<string, string> = {
    report: 'document-text',
    photo: 'photo',
    video: 'video-camera',
    receipt: 'receipt-percent',
    contract: 'document-check',
  };

  const docTypeLabel: Record<string, string> = {
    report: 'Rapport',
    photo: 'Photo datée',
    video: 'Vidéo 360°',
    receipt: 'Reçu / Facture',
    contract: 'Contrat / Acte',
  };

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <span className="tile tile-lg tile-muted">
          <Icon name="folder" size={32} />
        </span>
        <h3>Aucun document</h3>
        <p className="muted">Les documents de vos missions apparaîtront ici.</p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate('client-new-request')}
        >
          Faire une demande
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      {groups.map(({ r, docs }) => {
        const s = SERVICES.find(serv => serv.id === r.serviceId);
        return (
          <section key={r.id} className="card">
            <div className="card-head">
              <div>
                <h2>{r.title}</h2>
                <small className="muted">{r.tracking} · {docs.length} document{docs.length > 1 ? 's' : ''}</small>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('client-request-detail', r.id)}
              >
                Voir la demande
              </button>
            </div>

            <ul className="doc-list doc-list-grid">
              {docs.map(d => {
                const photoUrl = d.url || (d.photoName ? `/assets/photos/${d.photoName}.jpg` : s?.photo || '/assets/photos/chantier-gros-oeuvre.jpg');
                return (
                  <li key={d.id} className="doc-item">
                    <span className="tile tile-sm">
                      <Icon name={docIconMap[d.type] || 'document-text'} size={18} />
                    </span>
                    <span className="doc-item-main">
                      <strong>{d.name}</strong>
                      <small>{docTypeLabel[d.type] || d.type} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}</small>
                    </span>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label="Voir le document"
                      title="Voir"
                      onClick={() => openPhotoModal(photoUrl, d.name)}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label="Télécharger le document"
                      title="Télécharger"
                      onClick={() => alert(`Téléchargement de « ${d.name} » démarré.`)}
                    >
                      <Icon name="arrow-down-tray" size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
