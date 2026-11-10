import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { STATUS_MAP } from '../../data/kwaboData';

export const AdminMessages: React.FC = () => {
  const { 
    currentUser, role, requests, users, messages, activeRequestId,
    sendMessage, markThreadRead, navigate 
  } = useApp();

  const isOperator = role === 'OPERATOR';
  const visibleRequests = isOperator
    ? requests.filter(r => r.operatorId === currentUser?.id)
    : requests;

  // Build threads
  const threads = visibleRequests.map(r => {
    const threadMsgs = messages.filter(m => m.requestId === r.id);
    const lastMsg = threadMsgs[threadMsgs.length - 1];
    const unreadCount = threadMsgs.filter(m => m.from === 'client' && !m.read).length;
    return { r, last: lastMsg, unread: unreadCount };
  })
  .filter(t => t.last || t.r.id === activeRequestId)
  .sort((a, b) => (b.unread - a.unread) || (new Date(b.last?.at || 0).getTime() - new Date(a.last?.at || 0).getTime()));

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (activeRequestId && visibleRequests.some(r => r.id === activeRequestId)) {
      return activeRequestId;
    }
    return threads[0]?.r.id || '';
  });

  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selectedId with activeRequestId if it changes externally
  useEffect(() => {
    if (activeRequestId && visibleRequests.some(r => r.id === activeRequestId)) {
      setSelectedId(activeRequestId);
    }
  }, [activeRequestId, visibleRequests]);

  // Mark thread as read for team when selected
  useEffect(() => {
    if (selectedId) {
      markThreadRead(selectedId, 'team');
    }
  }, [selectedId, messages]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [selectedId, messages]);

  const selectedRequest = visibleRequests.find(r => r.id === selectedId);
  const selectedClient = selectedRequest ? users.find(u => u.id === selectedRequest.userId) : null;
  const currentMessages = selectedId ? messages.filter(m => m.requestId === selectedId) : [];

  const handleSelectThread = (reqId: string) => {
    setSelectedId(reqId);
    markThreadRead(reqId, 'team');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;
    if (!selectedId) return;

    sendMessage(selectedId, inputText, attachment ? attachment.name : undefined);
    setInputText('');
    setAttachment(null);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!visibleRequests.length || !threads.length) {
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
        {threads.map(({ r, last, unread }) => {
          const client = users.find(u => u.id === r.userId);
          const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';
          const initials = client ? `${client.firstName[0]}${client.lastName[0]}`.toUpperCase() : 'CL';
          const isSelected = selectedId === r.id;

          return (
            <button
              key={r.id}
              type="button"
              className={`w-full text-left border-0 bg-transparent cursor-pointer p-0 block ${isSelected ? 'active' : ''}`}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => handleSelectThread(r.id)}
            >
              <span className="avatar avatar-sm">{initials}</span>
              <span className="messenger-item">
                <strong>{clientName}</strong>
                <small>{r.title}</small>
                <small>{last ? (last.text || last.attachment) : 'Aucun message'}</small>
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
        {selectedRequest && selectedClient ? (
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
                  {selectedRequest.tracking} · {selectedClient.firstName} {selectedClient.lastName}
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
                {currentMessages.length === 0 ? (
                  <p className="muted thread-empty">Aucun message pour le moment. Répondez au client ici.</p>
                ) : (
                  currentMessages.map(m => {
                    const isMine = m.from === 'team';
                    return (
                      <div key={m.id} className={`bubble ${isMine ? 'bubble-mine' : ''}`}>
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

              {selectedRequest.status === 'cancelled' ? (
                <p className="notice">Cette demande est annulée : la discussion est fermée.</p>
              ) : (
                <form className="thread-form" onSubmit={handleSend}>
                  {attachment && (
                    <p className="attachment-name">Pièce jointe : {attachment.name}</p>
                  )}
                  <div className="thread-form-row">
                    <label className="icon-btn attach" title="Joindre un fichier" style={{ cursor: 'pointer' }}>
                      <Icon name="paper-clip" size={18} />
                      <span className="sr-only">Joindre un fichier</span>
                      <input
                        type="file"
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
                    <button className="btn btn-primary btn-icon" type="submit" aria-label="Envoyer">
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

