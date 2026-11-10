import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus, DocumentType } from '../../types';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES, STATUS_MAP, DOC_TYPE_META } from '../../data/kwaboData';

export const AdminRequestDetail: React.FC = () => {
  const { 
    activeRequestId, requests, users, documents, messages, invoices, reviews,
    navigate, updateRequestStatus, assignOperator, setQuote, 
    addDocument, sendMessage, addNote, openPhotoModal, addToast, role
  } = useApp();

  const r = requests.find(req => req.id === activeRequestId);

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

  const client = users.find(u => u.id === r.userId);
  const operator = users.find(u => u.id === r.operatorId);
  const operators = users.filter(u => u.role === 'OPERATOR');
  const service = SERVICES.find(s => s.id === r.serviceId) || SERVICES[0];
  const reqDocs = documents.filter(d => d.requestId === r.id);
  const reqMsgs = messages.filter(m => m.requestId === r.id);
  const reqInvoices = invoices.filter(i => i.requestId === r.id);
  const review = reviews.find(a => a.requestId === r.id);
  const dueInvoice = reqInvoices.find(i => i.status === 'due');

  // Form states
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(r.status);
  const [selectedOperatorId, setSelectedOperatorId] = useState(r.operatorId || '');
  const [quoteAmount, setQuoteAmount] = useState(r.quote?.amount || 150);
  const [quoteLabel, setQuoteLabel] = useState(r.quote?.label || service.name);
  const [newDocType, setNewDocType] = useState<DocumentType>('report');
  const [newDocName, setNewDocName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [chatText, setChatText] = useState('');

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

  // Status steps logic from shared.js
  const statusOrder: RequestStatus[] = ['pending', 'active', 'done'];
  const reachedIndex = statusOrder.indexOf(r.status);

  // Form Handlers
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === r.status) return;
    if (selectedStatus === 'cancelled') {
      if (!window.confirm('Annuler cette demande ? Le client sera prévenu et son devis en attente sera annulé.')) return;
    }
    updateRequestStatus(r.id, selectedStatus);
    addToast(`Statut mis à jour : ${STATUS_MAP[selectedStatus].label}. Le client est prévenu.`);
  };

  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignOperator(r.id, selectedOperatorId);
    const op = users.find(u => u.id === selectedOperatorId);
    addToast(selectedOperatorId ? `Attribuée à ${op ? op.firstName + ' ' + op.lastName : 'l\'agent'}.` : 'Attribution retirée.');
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(quoteAmount) <= 0 || !quoteLabel.trim()) {
      addToast('Veuillez renseigner un montant et un objet valides.');
      return;
    }
    setQuote(r.id, Number(quoteAmount), quoteLabel.trim());
    addToast('Devis envoyé au client.');
  };

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      addToast('Donnez un nom au document.');
      return;
    }
    addDocument({
      requestId: r.id,
      name: newDocName.trim(),
      type: newDocType,
      photoName: 'chantier-terrain',
    });
    setNewDocName('');
    addToast('Document déposé. Il est visible par le client.');
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(r.id, newNote.trim());
    setNewNote('');
    addToast('Note enregistrée.');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendMessage(r.id, chatText.trim());
    setChatText('');
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
                <dd><strong>{service.name}</strong></dd>
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
                  <dd>{v}</dd>
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

          {/* Messages avec le client (masqué pour l'agent de terrain qui utilise l'onglet dédié Messagerie) */}
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
                      return (
                        <div
                          key={m.id}
                          className={`bubble ${isMine ? 'bubble-mine' : ''}`}
                        >
                          <span className="bubble-author">{m.author}</span>
                          {m.text && <p>{m.text}</p>}
                          {m.attachment && (
                            <span className="bubble-file">
                              <Icon name="paper-clip" size={16} />
                              {m.attachment}
                            </span>
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
                    <div className="thread-form-row">
                      <label className="icon-btn attach" title="Joindre un fichier">
                        <Icon name="paper-clip" size={18} />
                        <span className="sr-only">Joindre un fichier</span>
                        <input 
                          className="sr-only" 
                          type="file" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              addToast(`Fichier sélectionné : ${e.target.files[0].name}`);
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
                      <button className="btn btn-primary btn-icon" type="submit" aria-label="Envoyer">
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
                        aria-label={`Voir ${d.name}`}
                        title="Voir"
                        onClick={() => openPhotoModal(d.name, d.photoName ? `/assets/photos/${d.photoName}.jpg` : service.photo)}
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label={`Télécharger ${d.name}`}
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
                  <label htmlFor="docName">Nom du document</label>
                  <input
                    id="docName"
                    type="text"
                    placeholder="Rapport_semaine_5.pdf"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn btn-ghost" type="submit">
                <Icon name="plus" size={18} />
                <span>Déposer</span>
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
              <button className="btn btn-ghost btn-sm" type="submit">
                Enregistrer la note
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
                  <a href="#/clients" onClick={(e) => { e.preventDefault(); navigate('admin-clients'); }}>
                    Fiche
                  </a>
                )}
              </div>
              <div className="client-mini">
                <span className="avatar">{client.firstName[0]}{client.lastName[0]}</span>
                <span>
                  <strong>{client.firstName} {client.lastName}</strong>
                  <small>{client.country}</small>
                </span>
              </div>
              <ul className="contact-list">
                <li>
                  <Icon name="envelope" size={18} />
                  <a href={`mailto:${client.email}`}>{client.email}</a>
                </li>
                <li>
                  <Icon name="phone" size={18} />
                  <a href={`tel:${client.phone.replace(/\s/g, '')}`}>{client.phone}</a>
                </li>
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
            <button className="btn btn-primary btn-block" type="submit">
              Mettre à jour
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
                <button className="btn btn-ghost btn-block" type="submit">
                  Attribuer
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
                <button className="btn btn-gold btn-block" type="submit">
                  {r.quote ? 'Envoyer un nouveau devis' : 'Envoyer le devis'}
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
                          onClick={() => addToast(`Facture ${i.id} : ${formatMoney(i.amount)} (${i.label})`)}
                        >
                          {i.id}
                        </button>
                        <strong>{formatMoney(i.amount)}</strong>
                        <span className={`badge badge-${i.status === 'paid' ? 'green' : i.status === 'due' ? 'gold' : 'neutral'}`}>
                          {i.status === 'paid' ? 'Payée' : i.status === 'due' ? 'À payer' : 'Remboursée'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {/* Avis du client si présent */}
          {r.rating && (
            <section className="card">
              <h2>Avis du client</h2>
              <p className="rating-readout flex items-center gap-1.5 font-bold">
                <Icon name="star" size={20} className="text-amber-500 fill-amber-400" />
                <span>{r.rating} sur 5</span>
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
