import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';

export const AdminAudit: React.FC = () => {
  const { auditLogs } = useApp();

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Journal des opérations</h2>
        <span className="muted small-text">{auditLogs.length} entrées enregistrées</span>
      </div>
      <p className="muted mb-4">
        Traçabilité complète des actions : créations de demandes, attributions d'agents, devis émis, documents déposés et règlements.
      </p>

      <ol className="timeline">
        {auditLogs.map(log => (
          <li key={log.id}>
            <strong>{log.text}</strong>
            <small>
              {log.actor} · {formatDateTime(log.at)}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
};
