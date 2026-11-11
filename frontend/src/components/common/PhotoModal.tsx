import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchAuthenticatedBlob } from '../../services/api';
import { Icon } from './Icon';

export const PhotoModal: React.FC = () => {
  const { activePhotoModal, closePhotoModal, downloadDocument, addToast } = useApp();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePhotoModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closePhotoModal]);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (!activePhotoModal) {
      setBlobUrl(null);
      setContentType('');
      setLoading(false);
      setError(null);
      return;
    }

    if (!activePhotoModal.requiresAuth) {
      setBlobUrl(activePhotoModal.url);
      setContentType('image/*');
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setBlobUrl(null);

    fetchAuthenticatedBlob(activePhotoModal.url)
      .then(({ blob, contentType: mime }) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setContentType(mime || blob.type || '');
      })
      .catch(() => {
        if (!active) return;
        setError('Impossible de charger ce fichier sécurisé.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [activePhotoModal]);

  if (!activePhotoModal) return null;

  const isImage = !contentType || contentType.startsWith('image/');
  const isPdf = contentType.includes('pdf');

  const handleDownload = async () => {
    const targetUrl = activePhotoModal.downloadUrl || activePhotoModal.url;
    if (activePhotoModal.requiresAuth) {
      await downloadDocument(targetUrl, activePhotoModal.title || 'document');
      return;
    }
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = activePhotoModal.title || 'document';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      addToast('Téléchargement lancé.', 'info');
    }
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePhotoModal();
      }}
    >
      <div className="modal modal-photo" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{activePhotoModal.title}</h3>
          <button
            className="icon-btn"
            aria-label="Fermer"
            onClick={closePhotoModal}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: 12 }}>
          {loading ? (
            <div style={{ padding: '48px 16px' }}>
              <div className="w-8 h-8 rounded-full border-4 border-[#e2ddd5] border-t-[#1d3a2f] animate-spin mx-auto mb-3" />
              <p className="muted">Chargement sécurisé du fichier…</p>
            </div>
          ) : error ? (
            <div style={{ padding: '32px 16px' }}>
              <Icon name="alert-circle" size={32} />
              <p style={{ marginTop: 8 }}>{error}</p>
            </div>
          ) : blobUrl && isImage ? (
            <img
              src={blobUrl}
              alt={activePhotoModal.title}
              style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 10, objectFit: 'contain', margin: '0 auto' }}
            />
          ) : blobUrl && isPdf ? (
            <iframe
              src={blobUrl}
              title={activePhotoModal.title}
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 10 }}
            />
          ) : (
            <div style={{ padding: '32px 16px' }}>
              <Icon name="file-text" size={40} />
              <p style={{ marginTop: 12 }}>
                Aperçu direct indisponible pour ce format. Utilisez le bouton ci-dessous pour le télécharger.
              </p>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            <Icon name="download" size={15} /> Télécharger
          </button>
          <button type="button" className="btn btn-outline" onClick={closePhotoModal}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
