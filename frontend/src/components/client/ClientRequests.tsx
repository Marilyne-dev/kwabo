import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestItem, RequestStatus } from '../../types';
import { Icon } from '../common/Icon';
import { api } from '../../services/api';
import { mapRequest } from '../../services/mappers';
import { printRequestsPdf } from '../../utils/printPdf';

export const ClientRequests: React.FC = () => {
  const { currentUser, services, navigate, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api<any>('/requests', {
      params: {
        status: filterStatus === 'all' ? '' : filterStatus,
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      },
    })
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped = rows.map(mapRequest);
        setRequests(mapped);
        setLastPage(Number(res?.meta?.last_page ?? 1));
        setTotal(Number(res?.meta?.total ?? mapped.length));
        if (res?.meta?.counts) {
          setStatusCounts(res.meta.counts);
        }
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterStatus, debouncedSearch, page]);

  // Fetch accurate totals per status if meta.counts isn't supplied by backend
  useEffect(() => {
    let cancelled = false;
    api<any>('/requests', { params: { per_page: 200 } })
      .then((res) => {
        if (cancelled || res?.meta?.counts) return;
        const rows: RequestItem[] = (Array.isArray(res?.data) ? res.data : []).map(mapRequest);
        setStatusCounts({
          all: rows.length,
          pending: rows.filter(r => r.status === 'pending').length,
          active: rows.filter(r => r.status === 'active').length,
          done: rows.filter(r => r.status === 'done').length,
          cancelled: rows.filter(r => r.status === 'cancelled').length,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-green">En cours</span>;
      case 'pending':
        return <span className="badge badge-gold">En attente</span>;
      case 'done':
        return <span className="badge badge-neutral">Terminée</span>;
      case 'cancelled':
        return <span className="badge badge-red">Annulée</span>;
    }
  };

  const handlePrint = () => {
    const filterLabels: Record<string, string> = {
      all: 'Toutes',
      pending: 'En attente',
      active: 'En cours',
      done: 'Terminées',
      cancelled: 'Annulées',
    };
    const enrichedRequests = requests.map((r) => {
      const svc = services.find((s) => s.id === r.serviceId || s.slug === r.serviceSlug);
      return svc && !r.serviceName ? { ...r, serviceName: svc.name } : r;
    });
    const clientName = currentUser?.fullName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Client');
    const opened = printRequestsPdf({
      requests: enrichedRequests,
      clientName,
      filterLabel: filterLabels[filterStatus] ?? 'Toutes',
      searchQuery: debouncedSearch || undefined,
    });
    if (!opened) {
      addToast('Autorisez les fenêtres pop-up pour afficher ou enregistrer le PDF.', 'warning');
    }
  };

  const handleSelectStatus = (next: string) => {
    setFilterStatus(next);
    setPage(1);
  };

  return (
    <div>
      <div className="toolbar no-print">
        <div className="search-field">
          <Icon name="magnifying-glass" size={18} />
          <input
            id="requests-q"
            type="search"
            placeholder="Rechercher par titre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={handlePrint}
        >
          <Icon name="printer" size={18} />
          <span>Exporter en PDF</span>
        </button>
      </div>

      <div className="chips no-print" role="group" aria-label="Filtrer par statut">
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'all'}
          onClick={() => handleSelectStatus('all')}
        >
          Toutes <span className="chip-count">{statusCounts.all ?? total}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'pending'}
          onClick={() => handleSelectStatus('pending')}
        >
          En attente <span className="chip-count">{statusCounts.pending ?? 0}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'active'}
          onClick={() => handleSelectStatus('active')}
        >
          En cours <span className="chip-count">{statusCounts.active ?? 0}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'done'}
          onClick={() => handleSelectStatus('done')}
        >
          Terminées <span className="chip-count">{statusCounts.done ?? 0}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'cancelled'}
          onClick={() => handleSelectStatus('cancelled')}
        >
          Annulées <span className="chip-count">{statusCounts.cancelled ?? 0}</span>
        </button>
      </div>

      <section className="card" id="requests-list">
        {loading ? (
          <div className="empty-state">
            <p className="muted">Chargement de vos demandes…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg tile-muted">
              <Icon name="magnifying-glass" size={32} />
            </span>
            <h3>Aucune demande trouvée</h3>
            <p className="muted">Changez votre recherche ou le filtre de statut.</p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('client-new-request')}
            >
              Faire une demande
            </button>
          </div>
        ) : (
          <>
            <div className="request-list">
              {requests.map(r => {
                const s = r.service || services.find(serv => serv.slug === r.serviceSlug || serv.id === r.serviceId);
                return (
                  <div
                    key={r.id}
                    className="request-row cursor-pointer"
                    onClick={() => navigate('client-request-detail', r.id)}
                  >
                    <span className={`tile cat-${s?.cat || 'demarches'}`}>
                      <Icon name={s?.icon || 'clipboard-document-list'} size={20} />
                    </span>
                    <span className="request-row-main">
                      <strong>{r.title}</strong>
                      <small>{r.tracking} · {r.city} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</small>
                    </span>
                    <span className="request-row-side">
                      {r.urgency === 'urgent' && (
                        <span className="badge badge-red">
                          <Icon name="bolt" size={14} /> Urgent
                        </span>
                      )}
                      {getStatusBadge(r.status)}
                      <Icon name="chevron-right" size={18} />
                    </span>
                  </div>
                );
              })}
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-200 text-xs">
                <span className="muted">Page {page} sur {lastPage} ({total} au total)</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={page >= lastPage}
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
