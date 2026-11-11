import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { WHATSAPP_LINK } from '../../data/kwaboData';
import { api, ApiError, getFirstValidationError } from '../../services/api';
import { mapMessage, mapRequest } from '../../services/mappers';
import { MessageItem, RequestItem } from '../../types';

export const ClientRequestDetail: React.FC = () => {
  const {
    activeRequestId,
    services,
    navigate,
    openPhotoModal,
    downloadDocument,
    addToast,
    confirm,
    refreshCounters,
  } = useApp();

  const [request, setRequest] = useState<RequestItem | null>(null);
  const [reqMessages, setReqMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('card');
  const [paying, setPaying] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeRequestId) {
      setRequest(null);
      setLoading(false);
      return;
    }
    try {
      const [reqRes, msgRes] = await Promise.all([
        api<any>(`/requests/${activeRequestId}`),
        api<any>(`/requests/${activeRequestId}/messages`).catch(() => ({ data: [] })),
      ]);
      const mappedReq = mapRequest(reqRes?.data ?? reqRes);
      setRequest(mappedReq);
      if (mappedReq.review) {
        setReviewRating(mappedReq.review.rating);
        setReviewComment(mappedReq.review.comment || '');
        setHasRated(true);
      } else if (mappedReq.rating) {
        setReviewRating(mappedReq.rating);
        setHasRated(true);
      }
      const rawMsgs = Array.isArray(msgRes?.data) ? msgRes.data : Array.isArray(msgRes) ? msgRes : [];
      setReqMessages(rawMsgs.map((m: any) => mapMessage(m, mappedReq.id)));

      if ((mappedReq.unreadMessages ?? 0) > 0) {
        await api(`/requests/${activeRequestId}/messages/read`, { method: 'POST' }).catch(() => {});
        await refreshCounters();
      }
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [activeRequestId, refreshCounters]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="empty-state">
        <p className="muted">Chargement de la demande…</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <div className="empty-state">
          <span className="tile tile-lg tile-muted">
            <Icon name="magnifying-glass" size={32} />
          </span>
          <h3>Demande introuvable</h3>
          <p className="muted">Elle n'existe pas ou n'est pas liée à votre compte.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('client-requests')}
          >
            Mes demandes
          </button>
        </div>
      </div>
    );
  }

  const service = request.service || services.find(s => s.slug === request.serviceSlug || s.id === request.serviceId);
  const reqDocs = request.documents || [];
  const dueInvoice = request.invoiceDue || request.invoices?.find(i => i.status === 'due') || null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachmentFile) || sendingMsg) return;

    setSendingMsg(true);
    try {
      let body: any;
      if (attachmentFile) {
        const fd = new FormData();
        if (messageText.trim()) fd.append('text', messageText.trim());
        fd.append('attachment', attachmentFile);
        body = fd;
      } else {
        body = { text: messageText.trim() };
      }

      await api(`/requests/${request.id}/messages`, {
        method: 'POST',
        body,
      });

      setMessageText('');
      setAttachmentFile(null);
      const msgRes = await api<any>(`/requests/${request.id}/messages`);
      const rawMsgs = Array.isArray(msgRes?.data) ? msgRes.data : [];
      setReqMessages(rawMsgs.map((m: any) => mapMessage(m, request.id)));
      addToast('Message envoyé.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Erreur d'envoi du message."),
        'error'
      );
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Annuler cette demande ?',
      message: `« ${request.title} » sera annulée définitivement, et son devis éventuel aussi.`,
      confirmLabel: 'Annuler la demande',
      cancelLabel: 'Conserver',
      variant: 'danger',
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await api(`/requests/${request.id}/cancel`, { method: 'POST' });
      addToast('Demande annulée.', 'info');
      await refreshCounters();
      await loadData();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : "Impossible d'annuler cette demande.", 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleRate = (val: number) => {
    setReviewRating(val);
    setHasRated(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      await api(`/requests/${request.id}/review`, {
        method: 'PUT',
        body: {
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        },
      });
      addToast('Merci ! Votre avis a été envoyé (en attente de modération).', 'success');
      await loadData();
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Impossible d'enregistrer votre avis."),
        'error'
      );
    } finally {
      setSavingReview(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!dueInvoice || paying) return;
    setPaying(true);
    try {
      await api(`/invoices/${dueInvoice.id}/pay`, {
        method: 'POST',
        body: { method: selectedPayMethod },
      });
      setShowPaymentModal(false);
      addToast('Paiement confirmé ! Votre mission passe En cours.', 'success');
      await refreshCounters();
      await loadData();
    } catch (err) {
      addToast(
        err instanceof ApiError ? err.message : 'Échec du paiement. Veuillez réessayer.',
        'error'
      );
    } finally {
      setPaying(false);
    }
  };

  const statusOrder: Array<'pending' | 'active' | 'done'> = ['pending', 'active', 'done'];
  const reached = statusOrder.indexOf(request.status as any);

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

  return (
    <div>
      <button
        type="button"
        className="breadcrumb border-0 bg-transparent cursor-pointer p-0 mb-4 inline-flex items-center gap-1.5"
        onClick={() => navigate('client-requests')}
      >
        <Icon name="arrow-left" size={16} />
        <span>Mes demandes</span>
      </button>

      {/* Status Card */}
      <section className="card status-card">
        {request.status === 'cancelled' ? (
          <p className="notice notice-red">
            <Icon name="x-circle" size={18} />
            <span>Cette demande a été annulée.</span>
          </p>
        ) : (
          <ol className="status-steps">
            <li className={reached > 0 || request.status === 'done' ? 'is-done' : (reached === 0 ? 'is-current' : '')}>
              <span className="status-step-dot">
                {reached > 0 || request.status === 'done' ? <Icon name="check" size={16} /> : <Icon name="clock" size={16} />}
              </span>
              <span>En attente</span>
            </li>
            <li className={reached > 1 || request.status === 'done' ? 'is-done' : (reached === 1 ? 'is-current' : '')}>
              <span className="status-step-dot">
                {reached > 1 || request.status === 'done' ? <Icon name="check" size={16} /> : <Icon name="bolt" size={16} />}
              </span>
              <span>En cours</span>
            </li>
            <li className={request.status === 'done' ? 'is-done is-current' : ''}>
              <span className="status-step-dot">
                {request.status === 'done' ? <Icon name="check" size={16} /> : <Icon name="check-circle" size={16} />}
              </span>
              <span>Terminée</span>
            </li>
          </ol>
        )}
      </section>

      {/* Due Invoice Alert */}
      {dueInvoice && (
        <div className="alert">
          <span className="tile tile-sm">
            <Icon name="banknotes" size={18} />
          </span>
          <p>
            <strong>Devis : {dueInvoice.amount} €</strong> ({dueInvoice.label}). La mission démarre dès le paiement.
          </p>
          <button
            className="btn btn-gold btn-sm"
            type="button"
            onClick={() => setShowPaymentModal(true)}
          >
            Payer
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="detail-grid">
        <div className="stack">
          {/* Info Card */}
          <section className="card">
            <h2>Informations</h2>
            <dl className="info-list">
              <div><dt>Service</dt><dd>{service?.name || request.title}</dd></div>
              <div><dt>Ville</dt><dd>{request.city}</dd></div>
              <div><dt>Urgence</dt><dd>{request.urgency === 'urgent' ? 'Urgent' : 'Normale'}</dd></div>
              {request.budget && <div><dt>Budget indiqué</dt><dd>{request.budget}</dd></div>}
              {request.operator && <div><dt>Agent terrain</dt><dd>{request.operator.fullName || `${request.operator.firstName} ${request.operator.lastName}`}</dd></div>}
              <div><dt>Date de la demande</dt><dd>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</dd></div>
              {request.details && Object.entries(request.details).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
              ))}
            </dl>
            {request.description && (
              <>
                <h3 className="mt-4">Description</h3>
                <p className="muted">{request.description}</p>
              </>
            )}
          </section>

          {/* Messages */}
          <section className="card">
            <h2>Messages</h2>
            <div className="thread">
              <div className="thread-messages" role="log" aria-label="Messages de la demande">
                {reqMessages.length === 0 ? (
                  <p className="muted thread-empty">Aucun message pour le moment. Posez votre question ici.</p>
                ) : (
                  reqMessages.map(m => {
                    const isMine = m.from === 'client';
                    const attUrl = `/messages/${m.id}/attachment`;
                    return (
                      <div key={m.id} className={`bubble ${isMine ? 'bubble-mine' : ''}`}>
                        <span className="bubble-author">{m.author}</span>
                        {m.text && <p>{m.text}</p>}
                        {m.attachment && (
                          <button
                            type="button"
                            className="bubble-file border-0 cursor-pointer"
                            onClick={() => downloadDocument(attUrl, m.attachment!.name)}
                          >
                            <Icon name="paper-clip" size={16} />
                            <span>{m.attachment.name}</span>
                          </button>
                        )}
                        <time dateTime={m.at}>{new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                    );
                  })
                )}
              </div>

              {request.status === 'cancelled' ? (
                <p className="notice">Cette demande est annulée : la discussion est fermée.</p>
              ) : (
                <form className="thread-form" onSubmit={handleSendMessage}>
                  {attachmentFile && (
                    <p className="attachment-name flex items-center gap-2">
                      <span>Pièce jointe : {attachmentFile.name}</span>
                      <button
                        type="button"
                        className="text-xs underline bg-transparent border-0 cursor-pointer"
                        onClick={() => setAttachmentFile(null)}
                      >
                        Retirer
                      </button>
                    </p>
                  )}
                  <div className="thread-form-row">
                    <label className="icon-btn attach" title="Joindre un fichier" style={{ cursor: 'pointer' }}>
                      <Icon name="paper-clip" size={18} />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAttachmentFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <textarea
                      name="text"
                      rows={1}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Écrivez votre message…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary btn-icon"
                      type="submit"
                      aria-label="Envoyer"
                      disabled={sendingMsg}
                    >
                      <Icon name="paper-airplane" size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Documents */}
          <section className="card">
            <h2>Documents</h2>
            {reqDocs.length ? (
              <ul className="doc-list">
                {reqDocs.map(d => {
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
            ) : (
              <p className="muted">Vos rapports, photos, reçus et contrats apparaîtront ici.</p>
            )}
          </section>
        </div>

        {/* Aside */}
        <aside className="stack">
          {request.status === 'done' && (
            <section className="card">
              <h2>Votre avis</h2>
              <p className="muted">
                {hasRated ? `Merci. Vous avez donné ${reviewRating} sur 5.` : 'Comment s\'est passée cette mission ?'}
              </p>
              <div className="stars" role="group" aria-label="Noter la mission">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star ${reviewRating >= n ? 'is-on' : ''}`}
                    onClick={() => handleRate(n)}
                    aria-label={`Donner ${n} sur 5`}
                  >
                    <Icon name="star" size={26} />
                  </button>
                ))}
              </div>

              {hasRated && (
                <form className="review-form mt-3" onSubmit={handleSaveReview}>
                  <label className="field-label">Votre commentaire</label>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Partagez votre expérience avec la diaspora..."
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300"
                  />
                  <p className="hint text-[11px] text-neutral-400 mt-1">
                    {request.review?.status === 'published'
                      ? 'Avis publié sur la vitrine KWABO.'
                      : 'Votre avis passe en attente de modération avant publication.'}
                  </p>
                  <button className="btn btn-ghost btn-sm mt-2" type="submit" disabled={savingReview}>
                    {savingReview ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </form>
              )}
            </section>
          )}

          {/* History */}
          <section className="card">
            <h2>Historique</h2>
            <ol className="timeline">
              {[...(request.history || [])].reverse().map((h, idx) => (
                <li key={idx}>
                  <strong>{h.text}</strong>
                  <small>{new Date(h.at).toLocaleDateString('fr-FR')} {new Date(h.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
                </li>
              ))}
            </ol>
          </section>

          {/* Cancel button */}
          {request.status === 'pending' && (
            <section className="card">
              <h2>Changement de programme ?</h2>
              <p className="muted">Vous pouvez annuler tant que la mission n'a pas démarré.</p>
              <button
                className="btn btn-danger-ghost btn-block"
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
              >
                <Icon name="x-circle" size={18} />
                <span>{cancelling ? 'Annulation…' : 'Annuler la demande'}</span>
              </button>
            </section>
          )}

          {/* WhatsApp Direct link */}
          <a
            className="card card-link card-link-whatsapp"
            href={`${WHATSAPP_LINK}?text=${encodeURIComponent(`Bonjour KWABO, ma demande ${request.tracking}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.214 8.214 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.237 8.237 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.63c-.19.53-1.09 1.03-1.52 1.07-.39.04-.9.06-2.58-.64-2.15-.89-3.53-3.09-3.64-3.23-.11-.15-.86-1.15-.86-2.19 0-1.04.55-1.55.74-1.76.19-.22.42-.27.56-.27.14 0 .28 0 .4.01.13.01.3.06.46.43.17.39.58 1.41.63 1.52.05.11.08.24.01.39-.07.15-.11.24-.22.37-.11.13-.23.29-.33.39-.11.11-.23.23-.1.45.13.22.58.96 1.25 1.56.86.77 1.59 1.01 1.81 1.12.22.11.35.09.48-.06.13-.15.56-.65.71-.87.15-.22.3-.19.5-.11.2.08 1.28.6 1.5.71.22.11.37.17.42.27.06.1.06.6-.13 1.13Z"/>
            </svg>
            <span>
              <strong>Besoin d'une réponse rapide ?</strong>
              <small>Écrivez-nous sur WhatsApp</small>
            </span>
          </a>
        </aside>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && dueInvoice && (
        <div className="dialog-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="dialog-title">Payer {dueInvoice.amount} €</h2>
            <p className="muted">{dueInvoice.label}</p>
            <div className="pay-options">
              {[
                { id: 'card', name: 'Carte bancaire', via: 'Stripe (Visa, Mastercard)', icon: 'credit-card' },
                { id: 'momo', name: 'Mobile Money Bénin', via: 'MTN MoMo, Moov Money', icon: 'device-phone-mobile' },
                { id: 'wise', name: 'Virement bancaire européen', via: 'Wise / IBAN SEPA', icon: 'building-library' },
              ].map(opt => (
                <label key={opt.id} className="pay-option">
                  <input
                    type="radio"
                    name="method"
                    value={opt.id}
                    checked={selectedPayMethod === opt.id}
                    onChange={() => setSelectedPayMethod(opt.id)}
                  />
                  <span className="tile tile-sm">
                    <Icon name={opt.icon} size={18} />
                  </span>
                  <span>
                    <strong>{opt.name}</strong>
                    <small>{opt.via}</small>
                  </span>
                </label>
              ))}
            </div>

            <p className="muted small mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
              <Icon name="lock-closed" size={16} />
              <span>Paiement 100% sécurisé et garanti satisfait ou remboursé.</span>
            </p>

            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowPaymentModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={paying}
                onClick={handlePayInvoice}
              >
                {paying ? 'Paiement en cours…' : 'Confirmer le règlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
