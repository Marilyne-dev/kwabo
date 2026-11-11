import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { STATUS_MAP } from '../../data/kwaboData';
import { api, ApiError, getFirstValidationError } from '../../services/api';
import { mapMessage, mapRequest } from '../../services/mappers';
import { MessageItem, RequestItem } from '../../types';

interface AdminThread {
  requestId: string;
  r: RequestItem;
  lastText: string;
  unread: number;
}

function mapAdminThread(raw: any): AdminThread {
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
    r: reqObj.id ? reqObj : { ...reqObj, id: reqId },
    lastText,
    unread: Number(raw?.unread ?? 0),
  };
}

export const AdminMessages: React.FC = () => {
  const { role, activeRequestId, navigate, downloadDocument, refreshCounters, addToast } = useApp();
  const isOperator = role === 'OPERATOR';

  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [currentMessages, setCurrentMessages] = useState<MessageItem[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const res = await api<any>('/messages');
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const mapped: AdminThread[] = raw.map(mapAdminThread);
      setThreads(mapped);
      setSelectedId((prev) => {
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
      setCurrentMessages([]);
      return;
    }
    setLoadingMsgs(true);
    try {
      const res = await api<any>(`/requests/${reqId}/messages`);
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCurrentMessages(raw.map((m: any) => mapMessage(m, reqId)));

      await api(`/requests/${reqId}/messages/read`, { method: 'POST' }).catch(() => {});
      setThreads(prev => prev.map(t => (t.requestId === reqId ? { ...t, unread: 0 } : t)));
      await refreshCounters();
    } catch {
      setCurrentMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, [refreshCounters]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [selectedId, currentMessages]);

  const selectedThread = threads.find(t => t.requestId === selectedId);
  const selectedRequest = selectedThread?.r || null;
  const selectedClient = selectedRequest?.client || null;

  const handleSelectThread = (reqId: string) => {
    setSelectedId(reqId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || !selectedId || sending) return;

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

      await api(`/requests/${selectedId}/messages`, {
        method: 'POST',
        body,
      });

      const preview = inputText.trim() || attachment?.name || 'Message';
      setInputText('');
      setAttachment(null);
      setThreads(prev =>
        prev.map(t => (t.requestId === selectedId ? { ...t, lastText: preview } : t))
      );
      await loadMessages(selectedId);
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

  if (!threads.length) {
    return (
      <div className="empty-state">
        <span className="tile tile-lg tile-muted">
          <Icon name="chat-bubble-left-right" size={32} />
        </span>
        <h3>Aucune discussion</h3>
        <p className="muted">
          {isOperator
            ? 'Les messages des clients sur vos missions attribuées apparaîtront ici.'
            : 'Les messages des clients apparaîtront ici.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`messenger ${selectedRequest ? 'has-thread' : ''}`}>
      {/* Liste des discussions */}
      <nav className="messenger-list" aria-label="Discussions">
        {threads.map(({ requestId, r, lastText, unread }) => {
          const client = r.client;
          const clientName = client
            ? client.fullName || `${client.firstName} ${client.lastName}`.trim()
            : 'Client';
          const initials = client
            ? `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`.toUpperCase() || 'CL'
            : 'CL';
          const isSelected = selectedId === requestId;

          return (
            <button
              key={requestId}
              type="button"
              className={`w-full text-left border-0 bg-transparent cursor-pointer p-0 block ${isSelected ? 'active' : ''}`}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => handleSelectThread(requestId)}
            >
              <span className="avatar avatar-sm">{initials}</span>
              <span className="messenger-item">
                <strong>{clientName}</strong>
                <small>{r.title}</small>
                <small>{lastText}</small>
              </span>
              {unread > 0 && (
                <span className="count count-gold">{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Fil de discussion */}
      <section className="messenger-thread">
        {selectedRequest ? (
          <>
            <header>
              <button
                className="icon-btn messenger-back"
                type="button"
                onClick={() => setSelectedId('')}
                aria-label="Retour aux discussions"
              >
                <Icon name="arrow-left" size={18} />
              </button>
              <div>
                <button
                  type="button"
                  className="font-bold border-0 bg-transparent p-0 text-left cursor-pointer hover:underline text-base text-[var(--text)]"
                  onClick={() => navigate('admin-request-detail', selectedRequest.id)}
                >
                  {selectedRequest.title}
                </button>
                <small className="muted block">
                  {selectedRequest.tracking}
                  {selectedClient
                    ? ` · ${selectedClient.fullName || `${selectedClient.firstName} ${selectedClient.lastName}`}`
                    : ''}
                </small>
              </div>
              <span className={`badge badge-${STATUS_MAP[selectedRequest.status].color}`}>
                <Icon name={STATUS_MAP[selectedRequest.status].icon} size={14} />
                {STATUS_MAP[selectedRequest.status].label}
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
                ) : currentMessages.length === 0 ? (
                  <p className="muted thread-empty">Aucun message pour le moment. Répondez au client ici.</p>
                ) : (
                  currentMessages.map(m => {
                    const isMine = m.from === 'team';
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
                      <span className="sr-only">Joindre un fichier</span>
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
            <p className="muted">Les discussions non lues sont en haut de la liste.</p>
          </div>
        )}
      </section>
    </div>
  );
};
