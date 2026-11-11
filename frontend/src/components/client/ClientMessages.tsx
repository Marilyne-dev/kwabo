import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { api, ApiError, getFirstValidationError } from '../../services/api';
import { mapMessage, mapRequest } from '../../services/mappers';
import { MessageItem, RequestItem } from '../../types';

interface MessageThread {
  requestId: string;
  request: RequestItem;
  lastText: string;
  unread: number;
}

function mapThread(raw: any): MessageThread {
  const reqObj = raw?.request ? mapRequest(raw.request) : mapRequest(raw);
  const reqId = String(raw?.request_id ?? reqObj.id);
  const lastRaw = raw?.last_message;
  let lastText = 'Aucun message';
  if (typeof lastRaw === 'string') {
    lastText = lastRaw;
  } else if (lastRaw && typeof lastRaw === 'object') {
    lastText = lastRaw.text || lastRaw.attachment?.name || 'Pièce jointe';
  }
  return {
    requestId: reqId,
    request: reqObj.id ? reqObj : { ...reqObj, id: reqId },
    lastText,
    unread: Number(raw?.unread ?? 0),
  };
}

export const ClientMessages: React.FC = () => {
  const {
    services,
    navigate,
    activeRequestId,
    downloadDocument,
    refreshCounters,
    addToast,
  } = useApp();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const res = await api<any>('/messages');
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const mapped: MessageThread[] = raw.map(mapThread);
      setThreads(mapped);
      setSelectedRequestId((prev) => {
        if (activeRequestId && mapped.some(t => t.requestId === activeRequestId)) {
          return activeRequestId;
        }
        if (prev && mapped.some(t => t.requestId === prev)) {
          return prev;
        }
        return mapped[0]?.requestId || '';
      });
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [activeRequestId]);

  useEffect(() => {
    setLoadingThreads(true);
    loadThreads();
  }, [loadThreads]);

  const loadMessages = useCallback(async (reqId: string) => {
    if (!reqId) {
      setActiveMessages([]);
      return;
    }
    setLoadingMsgs(true);
    try {
      const res = await api<any>(`/requests/${reqId}/messages`);
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setActiveMessages(raw.map((m: any) => mapMessage(m, reqId)));

      await api(`/requests/${reqId}/messages/read`, { method: 'POST' }).catch(() => {});
      setThreads(prev => prev.map(t => (t.requestId === reqId ? { ...t, unread: 0 } : t)));
      await refreshCounters();
    } catch {
      setActiveMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, [refreshCounters]);

  useEffect(() => {
    if (selectedRequestId) {
      loadMessages(selectedRequestId);
    }
  }, [selectedRequestId, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [selectedRequestId, activeMessages]);

  const selectedThread = threads.find(t => t.requestId === selectedRequestId);
  const selectedRequest = selectedThread?.request || null;

  const handleSelect = (reqId: string) => {
    setSelectedRequestId(reqId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || !selectedRequestId || sending) return;

    setSending(true);
    try {
      let body: any;
      if (attachment) {
        const fd = new FormData();
        if (inputText.trim()) fd.append('text', inputText.trim());
        fd.append('attachment', attachment);
        body = fd;
      } else {
        body = { text: inputText.trim() };
      }

      await api(`/requests/${selectedRequestId}/messages`, {
        method: 'POST',
        body,
      });

      const preview = inputText.trim() || attachment?.name || 'Message';
      setInputText('');
      setAttachment(null);
      setThreads(prev =>
        prev.map(t => (t.requestId === selectedRequestId ? { ...t, lastText: preview } : t))
      );
      await loadMessages(selectedRequestId);
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : "Impossible d'envoyer le message."),
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loadingThreads) {
    return (
      <div className="empty-state">
        <p className="muted">Chargement des discussions…</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="empty-state">
        <span className="tile tile-lg tile-muted">
          <Icon name="chat-bubble-left-right" size={32} />
        </span>
        <h3>Aucune discussion</h3>
        <p className="muted">Chaque demande a son fil de discussion avec notre équipe.</p>
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
    <div className={`messenger ${selectedRequest ? 'has-thread' : ''}`}>
      {/* Discussions list */}
      <nav className="messenger-list" aria-label="Discussions">
        {threads.map(t => {
          const r = t.request;
          const s = r.service || services.find(serv => serv.slug === r.serviceSlug || serv.id === r.serviceId);
          const isSelected = t.requestId === selectedRequestId;

          return (
            <button
              key={t.requestId}
              type="button"
              className={`w-full text-left border-0 bg-transparent cursor-pointer p-0 block ${isSelected ? 'active' : ''}`}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => handleSelect(t.requestId)}
            >
              <span className={`tile tile-sm cat-${s?.cat || 'demarches'}`}>
                <Icon name={s?.icon || 'chat-bubble-left-right'} size={18} />
              </span>
              <span className="messenger-item">
                <strong>{r.title}</strong>
                <small>{t.lastText}</small>
              </span>
              {t.unread > 0 && (
                <span className="count count-gold">{t.unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Discussion thread */}
      <section className="messenger-thread">
        {selectedRequest ? (
          <>
            <header>
              <button
                className="icon-btn messenger-back"
                type="button"
                onClick={() => setSelectedRequestId('')}
                aria-label="Retour aux discussions"
              >
                <Icon name="arrow-left" size={18} />
              </button>
              <div>
                <button
                  type="button"
                  className="font-bold border-0 bg-transparent p-0 text-left cursor-pointer hover:underline text-base text-[var(--text)]"
                  onClick={() => navigate('client-request-detail', selectedRequest.id)}
                >
                  {selectedRequest.title}
                </button>
                <small className="muted block">{selectedRequest.tracking} · {selectedRequest.city}</small>
              </div>
              <span className={`badge ${
                selectedRequest.status === 'active' ? 'badge-green' :
                selectedRequest.status === 'pending' ? 'badge-gold' :
                selectedRequest.status === 'done' ? 'badge-neutral' : 'badge-red'
              }`}>
                {selectedRequest.status === 'active' ? 'En cours' :
                 selectedRequest.status === 'pending' ? 'En attente' :
                 selectedRequest.status === 'done' ? 'Terminée' : 'Annulée'}
              </span>
            </header>

            <div className="thread">
              <div
                className="thread-messages"
                ref={messagesEndRef}
                role="log"
                aria-label="Messages de la demande"
              >
                {loadingMsgs ? (
                  <p className="muted thread-empty">Chargement des messages…</p>
                ) : activeMessages.length === 0 ? (
                  <p className="muted thread-empty">Aucun message pour le moment. Posez votre question ici.</p>
                ) : (
                  activeMessages.map(m => {
                    const isClient = m.from === 'client';
                    const attUrl = `/messages/${m.id}/attachment`;
                    return (
                      <div key={m.id} className={`bubble ${isClient ? 'bubble-mine' : ''}`}>
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

              {selectedRequest.status === 'cancelled' ? (
                <p className="notice">Cette demande est annulée : la discussion est fermée.</p>
              ) : (
                <form className="thread-form" onSubmit={handleSend}>
                  {attachment && (
                    <p className="attachment-name flex items-center gap-2">
                      <span>Pièce jointe : {attachment.name}</span>
                      <button
                        type="button"
                        className="text-xs underline bg-transparent border-0 cursor-pointer"
                        onClick={() => setAttachment(null)}
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
                            setAttachment(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <textarea
                      name="text"
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Écrivez votre message…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary btn-icon"
                      type="submit"
                      aria-label="Envoyer"
                      disabled={sending}
                    >
                      <Icon name="paper-airplane" size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="tile tile-lg tile-muted">
              <Icon name="chat-bubble-left-right" size={32} />
            </span>
            <h3>Choisissez une discussion</h3>
            <p className="muted">Sélectionnez une demande pour voir ses messages.</p>
          </div>
        )}
      </section>
    </div>
  );
};
