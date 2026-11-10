import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, STATUS_MAP } from '../../data/kwaboData';

export const ClientMessages: React.FC = () => {
  const { currentUser, requests, messages, sendMessage, markThreadRead, navigate, activeRequestId } = useApp();
  
  const userRequests = requests.filter(r => r.userId === currentUser?.id);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(() => {
    if (activeRequestId && userRequests.some(r => r.id === activeRequestId)) {
      return activeRequestId;
    }
    return userRequests[0]?.id || '';
  });
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with activeRequestId if changed from outside
  useEffect(() => {
    if (activeRequestId && userRequests.some(r => r.id === activeRequestId)) {
      setSelectedRequestId(activeRequestId);
    }
  }, [activeRequestId, userRequests]);

  // Mark thread read for client
  useEffect(() => {
    if (selectedRequestId) {
      markThreadRead(selectedRequestId, 'client');
    }
  }, [selectedRequestId, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [selectedRequestId, messages]);

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const activeMessages = selectedRequestId ? messages.filter(m => m.requestId === selectedRequestId) : [];

  const handleSelect = (reqId: string) => {
    setSelectedRequestId(reqId);
    markThreadRead(reqId, 'client');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;
    if (!selectedRequestId) return;

    sendMessage(selectedRequestId, inputText, attachment ? attachment.name : undefined);
    setInputText('');
    setAttachment(null);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (userRequests.length === 0) {
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
        {userRequests.map(r => {
          const s = SERVICES.find(serv => serv.id === r.serviceId) || SERVICES[0];
          const reqMsgs = messages.filter(m => m.requestId === r.id);
          const lastMsg = reqMsgs[reqMsgs.length - 1];
          const unreadCount = reqMsgs.filter(m => m.from === 'team' && !m.read).length;
          const isSelected = r.id === selectedRequestId;

          return (
            <button
              key={r.id}
              type="button"
              className={`w-full text-left border-0 bg-transparent cursor-pointer p-0 block ${isSelected ? 'active' : ''}`}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => handleSelect(r.id)}
            >
              <span className={`tile tile-sm cat-${s.cat}`}>
                <Icon name={s.icon} size={18} />
              </span>
              <span className="messenger-item">
                <strong>{r.title}</strong>
                <small>{lastMsg ? (lastMsg.text || lastMsg.attachment) : 'Aucun message'}</small>
              </span>
              {unreadCount > 0 && (
                <span className="count count-gold">{unreadCount}</span>
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
                {activeMessages.length === 0 ? (
                  <p className="muted thread-empty">Aucun message pour le moment. Posez votre question ici.</p>
                ) : (
                  activeMessages.map(m => {
                    const isClient = m.from === 'client';
                    return (
                      <div key={m.id} className={`bubble ${isClient ? 'bubble-mine' : ''}`}>
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
            <p className="muted">Sélectionnez une demande pour voir ses messages.</p>
          </div>
        )}
      </section>
    </div>
  );
};
