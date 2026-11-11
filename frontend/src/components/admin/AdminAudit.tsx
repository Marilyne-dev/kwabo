import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, ApiError } from '../../services/api';
import { mapAudit } from '../../services/mappers';
import { AuditItem } from '../../types';
import { Icon } from '../common/Icon';

export const AdminAudit: React.FC = () => {
  const { addToast } = useApp();
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>('/admin/audit', {
        params: {
          q: debouncedQuery || undefined,
          page,
          per_page: 50,
        },
      });
      const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const mapped = rawList.map(mapAudit);
      setAuditLogs(mapped);
      setLastPage(Number(res?.meta?.last_page ?? 1));
      setTotal(Number(res?.meta?.total ?? mapped.length));
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : "Impossible de charger le journal d'audit.", 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, addToast]);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Journal des opérations</h2>
        <span className="muted small-text">{total} entrées enregistrées</span>
      </div>
      <p className="muted mb-4">
        Traçabilité complète des actions : créations de demandes, attributions d'agents, devis émis, documents déposés et règlements.
      </p>

      <div className="search-wrap mb-4">
        <Icon name="magnifying-glass" size={16} />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une action, un auteur ou un dossier…"
          aria-label="Filtrer le journal des opérations"
        />
      </div>

      {loading ? (
        <div className="empty">Chargement du journal…</div>
      ) : auditLogs.length === 0 ? (
        <div className="empty">Aucune entrée trouvée.</div>
      ) : (
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
      )}

      {lastPage > 1 && (
        <div className="pager mt-4">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          <span className="muted small-text">
            Page {page} / {lastPage}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage(p => Math.min(lastPage, p + 1))}
          >
            Suivant
          </button>
        </div>
      )}
    </section>
  );
};
