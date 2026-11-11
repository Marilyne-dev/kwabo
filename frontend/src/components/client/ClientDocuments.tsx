import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { api } from '../../services/api';
import { mapDocument, mapRequest } from '../../services/mappers';
import { DocumentItem, RequestItem } from '../../types';

interface DocGroup {
  r: RequestItem;
  docs: DocumentItem[];
}

export const ClientDocuments: React.FC = () => {
  const { openPhotoModal, downloadDocument, navigate } = useApp();
  const [groups, setGroups] = useState<DocGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<any>('/documents')
      .then((res) => {
        if (cancelled) return;
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const parsed: DocGroup[] = raw
          .map((item: any) => {
            const req = mapRequest(item.request || item);
            const docs = Array.isArray(item.documents) ? item.documents.map((d: any) => mapDocument(d, req.id)) : [];
            return { r: req, docs };
          })
          .filter((g: DocGroup) => g.docs.length > 0);
        setGroups(parsed);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  if (loading) {
    return (
      <div className="empty-state">
        <p className="muted">Chargement de vos documents…</p>
      </div>
    );
  }

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
      {groups.map(({ r, docs }) => (
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
              const downloadPath = `/documents/${d.id}/download`;
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
                    onClick={() => openPhotoModal(downloadPath, d.name, downloadPath, true)}
                  >
                    <Icon name="eye" size={18} />
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label="Télécharger le document"
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
      ))}
    </div>
  );
};
