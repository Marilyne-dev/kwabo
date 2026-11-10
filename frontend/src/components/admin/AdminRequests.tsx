import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus } from '../../types';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES, STATUS_MAP } from '../../data/kwaboData';

interface AdminRequestsProps {
  isOperatorView?: boolean;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ isOperatorView }) => {
  const { requests, users, messages, updateRequestStatus, navigate, addToast, role, currentUser } = useApp();

  const isOperator = isOperatorView || role === 'OPERATOR';
  const baseRequests = isOperator
    ? requests.filter(r => r.operatorId === currentUser?.id)
    : requests;

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const operators = users.filter(u => u.role === 'OPERATOR');

  const filtered = baseRequests.filter(r => {
    const client = users.find(u => u.id === r.userId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : '';
    const needle = q.trim().toLowerCase();
    const service = SERVICES.find(s => s.id === r.serviceId);

    const matchesQ = !needle || (r.title + ' ' + r.tracking + ' ' + clientName).toLowerCase().includes(needle);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesOperator = isOperator || operatorFilter === 'all' || 
      (operatorFilter === 'none' ? !r.operatorId : r.operatorId === operatorFilter);
    const matchesCategory = categoryFilter === 'all' || (service && service.cat === categoryFilter);
    const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;

    return matchesQ && matchesStatus && matchesOperator && matchesCategory && matchesUrgency;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const exportCsv = () => {
    const rows = filtered.map(r => {
      const s = SERVICES.find(srv => srv.id === r.serviceId);
      const c = users.find(u => u.id === r.userId);
      const o = users.find(u => u.id === r.operatorId);
      const row = [
        r.tracking,
        r.title,
        s ? s.name : '',
        c ? `${c.firstName} ${c.lastName}` : '',
      ];
      if (!isOperator) {
        row.push(o ? `${o.firstName} ${o.lastName}` : 'Non attribuée');
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
    addToast('kwabo-demandes.csv téléchargé.');
  };

  const handleDragStart = (e: React.DragEvent, reqId: string) => {
    e.dataTransfer.setData('text/plain', reqId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: RequestStatus) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData('text/plain');
    if (!reqId) return;
    const req = requests.find(r => r.id === reqId);
    if (!req || req.status === targetStatus) return;

    if (targetStatus === 'cancelled') {
      if (!window.confirm(`Annuler la demande « ${req.title} » ?`)) return;
    }
    updateRequestStatus(reqId, targetStatus);
    addToast(`Statut mis à jour : ${STATUS_MAP[targetStatus].label}. Le client est prévenu.`);
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
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
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
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.short}</option>
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
          {filtered.length === 0 ? (
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
                    {pagedList.map(r => {
                      const client = users.find(u => u.id === r.userId);
                      const operator = users.find(u => u.id === r.operatorId);
                      const unread = messages.filter(m => m.requestId === r.id && m.from === 'client' && !m.read).length;

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
                          <td data-label="Client">
                            {client ? `${client.firstName} ${client.lastName}` : 'Client'}
                          </td>
                          {!isOperator && (
                            <td data-label="Agent">
                              {operator ? (
                                `${operator.firstName} ${operator.lastName}`
                              ) : (
                                <span className="muted">Non attribuée</span>
                              )}
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
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Précédent
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
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
            const columnCards = filtered.filter(r => r.status === statusKey);
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
                      const client = users.find(u => u.id === r.userId);
                      const operator = users.find(u => u.id === r.operatorId);

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
                          <small>{client ? `${client.firstName} ${client.lastName}` : 'Client'}</small>
                          <span className="kanban-foot">
                            {r.urgency === 'urgent' && (
                              <span className="badge badge-red">
                                <Icon name="bolt" size={14} />
                                Urgent
                              </span>
                            )}
                            {operator ? (
                              <span className="avatar avatar-xs" title={`${operator.firstName} ${operator.lastName}`}>
                                {operator.firstName[0]}{operator.lastName[0]}
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

