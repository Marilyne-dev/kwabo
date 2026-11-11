import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus, DocumentType, RequestItem, MessageItem, User } from '../../types';
import { Icon } from '../common/Icon';
import { STATUS_MAP, DOC_TYPE_META } from '../../data/kwaboData';
import { api, ApiError, getFirstValidationError } from '../../services/api';
import { mapMessage, mapRequest, mapUser } from '../../services/mappers';

export const AdminRequestDetail: React.FC = () => {
  const {
    activeRequestId,
    services,
    navigate,
    setActiveClientId,
    openPhotoModal,
    downloadDocument,
    addToast,
    confirm,
    role,
    refreshCounters,
  } = useApp();

  const [r, setR] = useState<RequestItem | null>(null);
  const [reqMsgs, setReqMsgs] = useState<MessageItem[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>('pending');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [quoteAmount, setQuoteAmount] = useState<number>(150);
  const [quoteLabel, setQuoteLabel] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentType>('report');
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [newNote, setNewNote] = useState('');
  const [chatText, setChatText] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);

  const [savingStatus, setSavingStatus] = useState(false);
  const [savingOperator, setSavingOperator] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeRequestId) {
      setR(null);
      setLoading(false);
      return;
    }
    try {
      const [reqRes, msgRes] = await Promise.all([
        api<any>(`/admin/requests/${activeRequestId}`),
        role !== 'OPERATOR'
          ? api<any>(`/requests/${activeRequestId}/messages`).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      const mappedReq = mapRequest(reqRes?.data ?? reqRes);
      setR(mappedReq);
      setSelectedStatus(mappedReq.status);
      setSelectedOperatorId(mappedReq.operatorId || '');
      setQuoteAmount(mappedReq.quote?.amount || 150);
      setQuoteLabel(mappedReq.quote?.label || mappedReq.service?.name || mappedReq.title);

      if (role !== 'OPERATOR') {
        const rawMsgs = Array.isArray(msgRes?.data) ? msgRes.data : Array.isArray(msgRes) ? msgRes : [];
        setReqMsgs(rawMsgs.map((m: any) => mapMessage(m, mappedReq.id)));
        if ((mappedReq.unreadMessages ?? 0) > 0) {
          await api(`/requests/${activeRequestId}/messages/read`, { method: 'POST' }).catch(() => {});
          await refreshCounters();
        }
      }
    } catch {
      setR(null);
    } finally {
      setLoading(false);
    }
  }, [activeRequestId, role, refreshCounters]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    let cancelled = false;
    api<any>('/admin/team')
      .then((res) => {
        if (cancelled) return;
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setOperators(raw.map(mapUser).filter((u: User) => u.role === 'OPERATOR'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (loading) {
    return (
      <section className="card">
        <div className="empty-state">
          <p className="muted">Chargement de la demande…</p>
        </div>
      </section>
    );
  }

  if (!r) {
    return (
      <section className="card">
        <div className="empty-state">
          <span className="tile tile-lg">
            <Icon name="magnifying-glass" size={32} />
          </span>
          <h3>Demande introuvable</h3>
          <p className="muted">Elle n'existe pas ou ne vous est pas attribuée.</p>
          <div className="btn-row btn-row-center mt-4">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate(role === 'OPERATOR' ? 'operator-missions' : 'admin-requests')}
            >
              Retour aux demandes
            </button>
          </div>
        </div>
      </section>
    );
  }

  const client = r.client;
  const service = r.service || services.find(s => s.slug === r.serviceSlug || s.id === r.serviceId);
  const reqDocs = r.documents || [];
  const reqInvoices = r.invoices || [];
  const review = r.review;
  const dueInvoice = r.invoiceDue || reqInvoices.find(i => i.status === 'due');

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const statusOrder: RequestStatus[] = ['pending', 'active', 'done'];
  const reachedIndex = statusOrder.indexOf(r.status);

  // Form Handlers
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === r.status || savingStatus) return;
    if (selectedStatus === 'cancelled') {
      const ok = await confirm({
        title: 'Annuler cette demande ?',
        message: 'Le client sera prévenu par notification et son devis en attente sera annulé.',
        confirmLabel: 'Annuler la demande',
        cancelLabel: 'Conserver',
        variant: 'danger',
      });
      if (!ok) return;
    }
    setSavingStatus(true);
    try {
      await api(`/admin/requests/${r.id}/status`, {
        method: 'PATCH',
        body: { status: selectedStatus },
      });
      await Promise.all([loadData(), refreshCounters()]);
      addToast(`Statut mis à jour : ${STATUS_MAP[selectedStatus].label}. Le client est prévenu.`, 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du statut.'),
        'error'
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingOperator) return;
    setSavingOperator(true);
    try {
      const payloadId = selectedOperatorId
        ? (/^\d+$/.test(selectedOperatorId) ? Number(selectedOperatorId) : selectedOperatorId)
        : null;
      await api(`/admin/requests/${r.id}/assign`, {
        method: 'PATCH',
        body: { operator_id: payloadId },
      });
      const op = operators.find(u => u.id === selectedOperatorId);
      await loadData();
      addToast(selectedOperatorId ? `Attribuée à ${op ? `${op.firstName} ${op.lastName}` : "l'agent"}.` : 'Attribution retirée.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Erreur d'attribution."),
        'error'
      );
    } finally {
      setSavingOperator(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(quoteAmount) <= 0 || !quoteLabel.trim()) {
      addToast('Veuillez renseigner un montant et un objet valides.', 'error');
      return;
    }
    setSavingQuote(true);
    try {
      await api(`/admin/requests/${r.id}/quote`, {
        method: 'POST',
        body: {
          amount: Number(quoteAmount),
          label: quoteLabel.trim(),
        },
      });
      await Promise.all([loadData(), refreshCounters()]);
      addToast('Devis envoyé au client.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Erreur lors de l'envoi du devis."),
        'error'
      );
    } finally {
      setSavingQuote(false);
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile) {
      addToast('Sélectionnez un fichier à déposer.', 'error');
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('type', newDocType);
      fd.append('file', newDocFile);
      if (newDocName.trim()) {
        fd.append('name', newDocName.trim());
      }

      await api(`/admin/requests/${r.id}/documents`, {
        method: 'POST',
        body: fd,
      });
      setNewDocName('');
      setNewDocFile(null);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
      await loadData();
      addToast('Document déposé. Il est visible par le client.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Erreur lors du dépôt du document.'),
        'error'
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || savingNote) return;
    setSavingNote(true);
    try {
      await api(`/admin/requests/${r.id}/notes`, {
        method: 'POST',
        body: { text: newNote.trim() },
      });
      setNewNote('');
      await loadData();
      addToast('Note enregistrée.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Impossible d'ajouter la note."),
        'error'
      );
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatText.trim() && !chatFile) || sendingChat) return;
    setSendingChat(true);
    try {
      let body: any;
      if (chatFile) {
        const fd = new FormData();
        if (chatText.trim()) fd.append('text', chatText.trim());
        fd.append('attachment', chatFile);
        body = fd;
      } else {
        body = { text: chatText.trim() };
      }

      await api(`/requests/${r.id}/messages`, {
        method: 'POST',
        body,
      });
      setChatText('');
      setChatFile(null);
      const msgRes = await api<any>(`/requests/${r.id}/messages`);
      const rawMsgs = Array.isArray(msgRes?.data) ? msgRes.data : [];
      setReqMsgs(rawMsgs.map((m: any) => mapMessage(m, r.id)));
      addToast('Message envoyé.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Impossible d'envoyer le message."),
        'error'
      );
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <>
      <a
        className="breadcrumb cursor-pointer"
        href="#/demandes"
        onClick={(e) => {
          e.preventDefault();
          navigate(role === 'OPERATOR' ? 'operator-missions' : 'admin-requests');
        }}
      >
        <Icon name="arrow-left" size={16} />
        <span>{role === 'OPERATOR' ? 'Mes missions' : 'Demandes'}</span>
      </a>

      {/* Status Card with Step Progress */}
      <section className="card status-card">
        {r.status === 'cancelled' ? (
          <p className="notice notice-red">
            <Icon name="x-circle" size={18} />
            <span>Cette demande a été annulée.</span>
          </p>
        ) : (
          <ol className="status-steps">
            {statusOrder.map((key, i) => {
              const isDone = i < reachedIndex || r.status === 'done';
              const isCurrent = i === reachedIndex && r.status !== 'done';
              const meta = STATUS_MAP[key];

              return (
                <li
                  key={key}
                  className={`${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="status-step-dot">
                    {isDone ? (
                      <Icon name="check" size={16} />
                    ) : (
                      <Icon name={meta.icon} size={16} />
                    )}
                  </span>
                  <span>{meta.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Detail Grid */}
      <div className="detail-grid">
        {/* Left Column: Stack */}
        <div className="stack">
          {/* Informations Card */}
          <section className="card">
            <h2>Informations</h2>
            <dl className="info-list">
              <div>
                <dt>Service</dt>
                <dd><strong>{service?.name || r.title}</strong></dd>
              </div>
              <div>
                <dt>Ville</dt>
                <dd>{r.city}</dd>
              </div>
              <div>
                <dt>Urgence</dt>
                <dd>
                  {r.urgency === 'urgent' ? (
                    <span className="badge badge-red">
                      <Icon name="bolt" size={14} />
                      Urgent
                    </span>
                  ) : (
                    'Normale'
                  )}
                </dd>
              </div>
              {r.budget && (
                <div>
                  <dt>Budget indiqué</dt>
                  <dd>{r.budget}</dd>
                </div>
              )}
              <div>
                <dt>Date de la demande</dt>
                <dd>{formatDate(r.createdAt)}</dd>
              </div>
              {r.details && Object.entries(r.details).map(([k, v]) => (
                <div key={k}>
                  <dt className="capitalize">{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>

            {r.description && (
              <>
                <h3 className="mt-4 mb-1">Description</h3>
                <p>{r.description}</p>
              </>
            )}
          </section>

          {/* Messages avec le client */}
          {role !== 'OPERATOR' && (
            <section className="card">
              <h2>Messages avec le client</h2>
              <div className="thread">
                <div className="thread-messages" role="log" aria-label="Messages de la demande">
                  {reqMsgs.length === 0 ? (
                    <p className="muted thread-empty">Aucun message pour le moment.</p>
                  ) : (
                    reqMsgs.map(m => {
                      const isMine = m.from === 'team';
                      const attUrl = `/messages/${m.id}/attachment`;
                      return (
                        <div
                          key={m.id}
                          className={`bubble ${isMine ? 'bubble-mine' : ''}`}
                        >
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
                          <time dateTime={m.at}>{formatDateTime(m.at)}</time>
                        </div>
                      );
                    })
                  )}
                </div>

                {r.status === 'cancelled' ? (
                  <p className="notice">Cette demande est annulée : la discussion est fermée.</p>
                ) : (
                  <form className="thread-form" onSubmit={handleSendChat}>
                    {chatFile && (
                      <p className="attachment-name flex items-center gap-2">
                        <span>Pièce jointe : {chatFile.name}</span>
                        <button
                          type="button"
                          className="text-xs underline bg-transparent border-0 cursor-pointer"
                          onClick={() => setChatFile(null)}
                        >
                          Retirer
                        </button>
                      </p>
                    )}
                    <div className="thread-form-row">
                      <label className="icon-btn attach" title="Joindre un fichier" style={{ cursor: 'pointer' }}>
                        <Icon name="paper-clip" size={18} />
                        <span className="sr-only">Joindre un fichier</span>
                        <input
                          className="sr-only"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setChatFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <label className="sr-only" htmlFor="message-text">Votre message</label>
                      <textarea
                        id="message-text"
                        rows={1}
                        placeholder="Écrivez votre message…"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChat(e);
                          }
                        }}
                      />
                      <button
                        className="btn btn-primary btn-icon"
                        type="submit"
                        aria-label="Envoyer"
                        disabled={sendingChat}
                      >
                        <Icon name="paper-airplane" size={18} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}

          {/* Documents déposés & Formulaire de dépôt */}
          <section className="card">
            <h2>Documents</h2>
            {reqDocs.length === 0 ? (
              <p className="muted">Aucun document pour le moment.</p>
            ) : (
              <ul className="doc-list">
                {reqDocs.map(d => {
                  const meta = DOC_TYPE_META[d.type] || DOC_TYPE_META.report;
                  const downloadPath = `/documents/${d.id}/download`;
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
                        aria-label={`Voir ${d.name}`}
                        title="Voir"
                        onClick={() => openPhotoModal(downloadPath, d.name, downloadPath, true)}
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label={`Télécharger ${d.name}`}
                        title="Télécharger"
                        onClick={() => downloadDocument(downloadPath, d.name)}
                      >
                        <Icon name="arrow-down-tray" size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Formulaire de dépôt */}
            <form className="doc-form mt-4 pt-4 border-t border-[#e0e8e4]" onSubmit={handleDocSubmit}>
              <h3>Déposer un document</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="docType">Type</label>
                  <select
                    id="docType"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as DocumentType)}
                  >
                    {(Object.entries(DOC_TYPE_META) as [string, { label: string }][]).map(([key, item]) => (
                      <option key={key} value={key}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="docName">Nom du document (optionnel)</label>
                  <input
                    id="docName"
                    type="text"
                    placeholder="Rapport_semaine_5.pdf"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="docFile">Fichier (PDF, image ou vidéo)</label>
                <input
                  ref={docFileInputRef}
                  id="docFile"
                  type="file"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setNewDocFile(f);
                    if (f && !newDocName.trim()) {
                      setNewDocName(f.name);
                    }
                  }}
                />
              </div>
              <button className="btn btn-ghost" type="submit" disabled={uploadingDoc}>
                <Icon name="plus" size={18} />
                <span>{uploadingDoc ? 'Envoi…' : 'Déposer'}</span>
              </button>
            </form>
          </section>

          {/* Notes internes */}
          <section className="card card-note">
            <h2>
              <Icon name="lock-closed" size={18} />
              <span>Notes internes</span>
            </h2>
            <p className="muted small-text">Jamais visibles par le client.</p>

            {(r.notes || []).map((n, idx) => (
              <div key={idx} className="note">
                <p>{n.text}</p>
                <small>{n.author} · {formatDateTime(n.at)}</small>
              </div>
            ))}

            <form onSubmit={handleNoteSubmit}>
              <div className="field">
                <label htmlFor="noteText">Ajouter une note</label>
                <textarea
                  id="noteText"
                  rows={2}
                  placeholder="Note confidentielle sur l'avancement..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <button className="btn btn-ghost btn-sm" type="submit" disabled={savingNote}>
                {savingNote ? 'Enregistrement…' : 'Enregistrer la note'}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Aside */}
        <aside className="stack">
          {/* Fiche Client */}
          {client && (
            <section className="card">
              <div className="card-head">
                <h2>Client</h2>
                {role === 'ADMIN' && (
                  <a
                    href="#/clients"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveClientId(client.id);
                      navigate('admin-clients');
                    }}
                  >
                    Fiche
                  </a>
                )}
              </div>
              <div className="client-mini">
                <span className="avatar">
                  {`${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`.toUpperCase() || 'CL'}
                </span>
                <span>
                  <strong>{client.fullName || `${client.firstName} ${client.lastName}`}</strong>
                  <small>{client.country}</small>
                </span>
              </div>
              <ul className="contact-list">
                <li>
                  <Icon name="envelope" size={18} />
                  <a href={`mailto:${client.email}`}>{client.email}</a>
                </li>
                {client.phone && (
                  <li>
                    <Icon name="phone" size={18} />
                    <a href={`tel:${client.phone.replace(/\s/g, '')}`}>{client.phone}</a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Formulaire Statut */}
          <form className="card form-card" onSubmit={handleStatusSubmit}>
            <h2>Statut</h2>
            <div className="field">
              <label htmlFor="statusValue">Statut de la demande</label>
              <select
                id="statusValue"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
              >
                {(Object.entries(STATUS_MAP) as [string, { label: string }][]).map(([k, item]) => (
                  <option key={k} value={k}>{item.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={savingStatus}>
              {savingStatus ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>

          {/* Controls: Operator Assignment & Quote (Admin only) */}
          {role === 'ADMIN' && (
            <>
              {/* Formulaire Agent terrain */}
              <form className="card form-card" onSubmit={handleOperatorSubmit}>
                <h2>Agent terrain</h2>
                <div className="field">
                  <label htmlFor="operatorId">Attribuer à</label>
                  <select
                    id="operatorId"
                    value={selectedOperatorId}
                    onChange={(e) => setSelectedOperatorId(e.target.value)}
                  >
                    <option value="">Personne pour le moment</option>
                    {operators.map(o => (
                      <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-ghost btn-block" type="submit" disabled={savingOperator}>
                  {savingOperator ? 'Attribution…' : 'Attribuer'}
                </button>
              </form>

              {/* Formulaire Devis */}
              <form className="card form-card" onSubmit={handleQuoteSubmit}>
                <h2>Devis</h2>
                {r.quote && (
                  <p className="notice">
                    <Icon name="document-text" size={16} />
                    <span>
                      {dueInvoice ? 'En attente de paiement' : 'Dernier devis'} : <strong>{formatMoney(r.quote.amount)}</strong>, {r.quote.label}
                    </span>
                  </p>
                )}
                <div className="field">
                  <label htmlFor="quoteAmount">Montant (€)</label>
                  <input
                    id="quoteAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="quoteLabel">Objet</label>
                  <input
                    id="quoteLabel"
                    type="text"
                    required
                    value={quoteLabel}
                    onChange={(e) => setQuoteLabel(e.target.value)}
                  />
                </div>
                <button className="btn btn-gold btn-block" type="submit" disabled={savingQuote}>
                  {savingQuote ? 'Envoi…' : (r.quote ? 'Envoyer un nouveau devis' : 'Envoyer le devis')}
                </button>
              </form>

              {/* Factures liées */}
              {reqInvoices.length > 0 && (
                <section className="card">
                  <h2>Factures</h2>
                  <ul className="mini-invoices">
                    {reqInvoices.map(i => (
                      <li key={i.id}>
                        <button
                          className="link-btn"
                          type="button"
                          onClick={() => addToast(`Facture ${i.number || i.id} : ${formatMoney(i.amount)} (${i.label})`)}
                        >
                          {i.number || i.id}
                        </button>
                        <strong>{formatMoney(i.amount)}</strong>
                        <span className={`badge badge-${i.status === 'paid' ? 'green' : i.status === 'due' ? 'gold' : 'neutral'}`}>
                          {i.status === 'paid' ? 'Payée' : i.status === 'due' ? 'À payer' : i.status === 'refunded' ? 'Remboursée' : 'Annulée'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {/* Avis du client si présent */}
          {(r.rating || review) && (
            <section className="card">
              <h2>Avis du client</h2>
              <p className="rating-readout flex items-center gap-1.5 font-bold">
                <Icon name="star" size={20} className="text-amber-500 fill-amber-400" />
                <span>{review?.rating ?? r.rating} sur 5</span>
              </p>
              {review?.comment && <p className="muted mt-2">{review.comment}</p>}
            </section>
          )}

          {/* Historique timeline */}
          <section className="card">
            <h2>Historique</h2>
            <ol className="timeline">
              {[...(r.history || [])].reverse().map((h, idx) => (
                <li key={idx}>
                  <strong>{h.text}</strong>
                  <small>{formatDateTime(h.at)}</small>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
};
