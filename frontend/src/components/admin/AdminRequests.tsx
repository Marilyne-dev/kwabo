import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestItem, RequestStatus, User } from '../../types';
import { Icon } from '../common/Icon';
import { STATUS_MAP } from '../../data/kwaboData';
import { api, ApiError } from '../../services/api';
import { mapRequest, mapUser } from '../../services/mappers';

interface AdminRequestsProps {
  isOperatorView?: boolean;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ isOperatorView }) => {
  const { categories, services, navigate, addToast, confirm, role, refreshCounters } = useApp();

  const isOperator = isOperatorView || role === 'OPERATOR';

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (isOperator) return;
    let cancelled = false;
    api<any>('/admin/team')
      .then((res) => {
        if (cancelled) return;
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped = raw.map(mapUser);
        setOperators(mapped.filter((u: User) => u.role === 'OPERATOR'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOperator]);

  const buildFilterParams = useCallback(
    (overridePerPage?: number, overridePage?: number) => ({
      q: debouncedQ || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      operator: !isOperator && operatorFilter !== 'all' ? operatorFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
      page: overridePage ?? (viewMode === 'kanban' ? 1 : page),
      per_page: overridePerPage ?? (viewMode === 'kanban' ? 200 : 20),
    }),
    [debouncedQ, statusFilter, isOperator, operatorFilter, categoryFilter, urgencyFilter, viewMode, page]
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>('/admin/requests', { params: buildFilterParams() });
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRequests(raw.map(mapRequest));
      setTotalPages(Math.max(1, Number(res?.meta?.last_page ?? 1)));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const renderStatusBadge = (status: RequestStatus) => {
    const meta = STATUS_MAP[status];
    return (
      <span className={`badge badge-${meta.color}`}>
        <Icon name={meta.icon} size={14} />
        {meta.label}
      </span>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const exportCsv = async () => {
    try {
      const res = await api<any>('/admin/requests', { params: buildFilterParams(200, 1) });
      const list: RequestItem[] = (Array.isArray(res?.data) ? res.data : []).map(mapRequest);

      const rows = list.map(r => {
        const s = r.service || services.find(srv => srv.slug === r.serviceSlug || srv.id === r.serviceId);
        const clientName = r.client
          ? r.client.fullName || `${r.client.firstName} ${r.client.lastName}`.trim()
          : '';
        const opName = r.operator
          ? r.operator.fullName || `${r.operator.firstName} ${r.operator.lastName}`.trim()
          : 'Non attribuée';
        const row = [r.tracking, r.title, s ? s.name : '', clientName];
        if (!isOperator) {
          row.push(opName);
        }
        row.push(
          STATUS_MAP[r.status].label,
          r.urgency === 'urgent' ? 'Urgent' : 'Normale',
          formatDate(r.createdAt)
        );
        return row;
      });

      const header = isOperator
        ? ['Suivi', 'Titre', 'Service', 'Client', 'Statut', 'Urgence', 'Date']
        : ['Suivi', 'Titre', 'Service', 'Client', 'Agent', 'Statut', 'Urgence', 'Date'];
      const csvContent = [header, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'kwabo-demandes.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      addToast('kwabo-demandes.csv téléchargé.', 'success');
    } catch {
      addToast("Impossible d'exporter les demandes.", 'error');
    }
  };

  const handleDragStart = (e: React.DragEvent, reqId: string) => {
    e.dataTransfer.setData('text/plain', reqId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: RequestStatus) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData('text/plain');
    if (!reqId) return;
    const req = requests.find(r => r.id === reqId);
    if (!req || req.status === targetStatus) return;

    if (targetStatus === 'cancelled') {
      const ok = await confirm({
        title: 'Annuler cette demande ?',
        message: `La demande « ${req.title} » sera marquée comme annulée et le client sera prévenu.`,
        confirmLabel: 'Annuler la demande',
        cancelLabel: 'Conserver',
        variant: 'danger',
      });
      if (!ok) return;
    }

    try {
      await api(`/admin/requests/${reqId}/status`, {
        method: 'PATCH',
        body: { status: targetStatus },
      });
      setRequests(prev => prev.map(r => (r.id === reqId ? { ...r, status: targetStatus } : r)));
      await refreshCounters();
      addToast(`Statut mis à jour : ${STATUS_MAP[targetStatus].label}. Le client est prévenu.`, 'success');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Erreur lors du changement de statut.', 'error');
    }
  };

  const kanbanColumns: RequestStatus[] = ['pending', 'active', 'done', 'cancelled'];

  return (
    <>
      {/* Filters Toolbar */}
      <div className="toolbar">
        <div className="search-field">
          <Icon name="magnifying-glass" size={18} />
          <label className="sr-only" htmlFor="requests-filter-q">
            Filtrer les demandes
          </label>
          <input
            id="requests-filter-q"
            type="search"
            placeholder="Filtrer : titre, suivi ou client…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <label className="sr-only" htmlFor="filter-status">Statut</label>
        <select
          id="filter-status"
          className="select-inline"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Tous les statuts</option>
          {(Object.entries(STATUS_MAP) as [string, { label: string }][]).map(([key, item]) => (
            <option key={key} value={key}>{item.label}</option>
          ))}
        </select>

        {!isOperator && (
          <>
            <label className="sr-only" htmlFor="filter-operator">Agent</label>
            <select
              id="filter-operator"
              className="select-inline"
              value={operatorFilter}
              onChange={(e) => {
                setOperatorFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tous les agents</option>
              <option value="none">Non attribuées</option>
              {operators.map(o => (
                <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
              ))}
            </select>
          </>
        )}

        <label className="sr-only" htmlFor="filter-category">Univers</label>
        <select
          id="filter-category"
          className="select-inline"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Tous les univers</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug || c.id}>{c.short}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-urgency">Urgence</label>
        <select
          id="filter-urgency"
          className="select-inline"
          value={urgencyFilter}
          onChange={(e) => {
            setUrgencyFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Toute urgence</option>
          <option value="urgent">Urgentes</option>
          <option value="normal">Normales</option>
        </select>
      </div>

      {/* Toolbar secondary: View switcher (segmented) & CSV export */}
      <div className="toolbar toolbar-between">
        <div className="segmented" role="group" aria-label="Affichage">
          <button
            type="button"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <Icon name="bars-3" size={18} />
            <span>Liste</span>
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'kanban'}
            onClick={() => setViewMode('kanban')}
          >
            <Icon name="squares-2x2" size={18} />
            <span>Tableau</span>
          </button>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={exportCsv}
        >
          <Icon name="arrow-down-tray" size={18} />
          <span>Exporter en CSV</span>
        </button>
      </div>

      {/* Requests Body: List Table vs Kanban */}
      {viewMode === 'list' ? (
        <section className="card">
          {loading ? (
            <div className="empty-state">
              <p className="muted">Chargement des demandes…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="tile tile-lg">
                <Icon name="magnifying-glass" size={32} />
              </span>
              <h3>Aucune demande</h3>
              <p className="muted">Changez votre recherche ou vos filtres.</p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table table-cards">
                  <thead>
                    <tr>
                      <th>Suivi</th>
                      <th>Demande</th>
                      <th>Client</th>
                      {!isOperator && <th>Agent</th>}
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => {
                      const clientName = r.client
                        ? r.client.fullName || `${r.client.firstName} ${r.client.lastName}`.trim()
                        : 'Client';
                      const opName = r.operator
                        ? r.operator.fullName || `${r.operator.firstName} ${r.operator.lastName}`.trim()
                        : null;
                      const unread = r.unreadMessages ?? 0;

                      return (
                        <tr key={r.id}>
                          <td data-label="Suivi" className="nowrap">
                            <strong>{r.tracking}</strong>
                          </td>
                          <td data-label="Demande">
                            <a
                              className="table-link"
                              href={`#/demandes/${r.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('admin-request-detail', r.id);
                              }}
                            >
                              {r.title}
                            </a>
                            {r.urgency === 'urgent' && (
                              <span className="badge badge-red ml-1.5">
                                <Icon name="bolt" size={14} />
                                Urgent
                              </span>
                            )}
                            {!isOperator && unread > 0 && (
                              <span className="count count-gold ml-1.5" title="Messages non lus">
                                {unread}
                              </span>
                            )}
                          </td>
                          <td data-label="Client">{clientName}</td>
                          {!isOperator && (
                            <td data-label="Agent">
                              {opName || <span className="muted">Non attribuée</span>}
                            </td>
                          )}
                          <td data-label="Statut">
                            {renderStatusBadge(r.status)}
                          </td>
                          <td data-label="Date" className="nowrap">
                            {formatDate(r.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Précédent
                  </button>
                  <span className="pagination-info">
                    Page {page} sur {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Suivant
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      ) : (
        <div className="kanban">
          {kanbanColumns.map(statusKey => {
            const columnCards = requests.filter(r => r.status === statusKey);
            const meta = STATUS_MAP[statusKey];

            return (
              <section
                key={statusKey}
                className="kanban-col"
                data-status={statusKey}
                aria-label={meta.label}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, statusKey)}
              >
                <header>
                  {renderStatusBadge(statusKey)}
                  <strong>{columnCards.length}</strong>
                </header>

                <div className="kanban-cards">
                  {columnCards.length === 0 ? (
                    <p className="muted small-text kanban-empty">Aucune demande</p>
                  ) : (
                    columnCards.map(r => {
                      const clientName = r.client
                        ? r.client.fullName || `${r.client.firstName} ${r.client.lastName}`.trim()
                        : 'Client';
                      const opInitials = r.operator
                        ? `${r.operator.firstName?.[0] || ''}${r.operator.lastName?.[0] || ''}`.toUpperCase() || 'OP'
                        : null;
                      const opFull = r.operator
                        ? r.operator.fullName || `${r.operator.firstName} ${r.operator.lastName}`
                        : '';

                      return (
                        <a
                          key={r.id}
                          className="kanban-card"
                          href={`#/demandes/${r.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, r.id)}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('admin-request-detail', r.id);
                          }}
                        >
                          <strong>{r.title}</strong>
                          <small>{r.tracking}</small>
                          <small>{clientName}</small>
                          <span className="kanban-foot">
                            {r.urgency === 'urgent' && (
                              <span className="badge badge-red">
                                <Icon name="bolt" size={14} />
                                Urgent
                              </span>
                            )}
                            {opInitials ? (
                              <span className="avatar avatar-xs" title={opFull}>
                                {opInitials}
                              </span>
                            ) : (
                              <span className="muted small-text">Sans agent</span>
                            )}
                          </span>
                        </a>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
};
