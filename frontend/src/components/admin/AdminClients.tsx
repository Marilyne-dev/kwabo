import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { STATUS_MAP } from '../../data/kwaboData';
import { api, ApiError } from '../../services/api';
import { mapInvoice, mapRequest, mapUser } from '../../services/mappers';
import { InvoiceItem, RequestItem, User } from '../../types';

interface ClientRow extends User {
  requestsCount: number;
  totalPaid: number;
}

interface ClientDetailData {
  user: User;
  stats: {
    requestsCount: number;
    activeCount: number;
    totalPaid: number;
    totalDue: number;
  };
  requests: RequestItem[];
  invoices: InvoiceItem[];
  referrer?: { name?: string; email?: string } | null;
}

export const AdminClients: React.FC = () => {
  const { activeClientId, setActiveClientId, services, addToast, confirm, navigate } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(activeClientId);
  const [clientDetail, setClientDetail] = useState<ClientDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (activeClientId) {
      setSelectedClientId(activeClientId);
    }
  }, [activeClientId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadClients = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api<any>('/admin/clients', {
        params: {
          q: debouncedQ || undefined,
          state: stateFilter !== 'all' ? stateFilter : undefined,
          page,
          per_page: 20,
        },
      });
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setClients(
        raw.map((u: any) => ({
          ...mapUser(u),
          requestsCount: Number(u.requests_count ?? u.stats?.requests ?? 0),
          totalPaid: Number(u.total_paid ?? u.paid_total ?? u.stats?.paid ?? 0),
        }))
      );
      setTotalPages(Math.max(1, Number(res?.meta?.last_page ?? 1)));
    } catch {
      setClients([]);
    } finally {
      setLoadingList(false);
    }
  }, [debouncedQ, stateFilter, page]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const loadClientDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await api<any>(`/admin/clients/${id}`);
      const d = res?.data ?? res ?? {};
      const userObj = mapUser(d.client ?? d.user ?? d);
      const reqs: RequestItem[] = Array.isArray(d.requests) ? d.requests.map(mapRequest) : [];
      const invs: InvoiceItem[] = Array.isArray(d.invoices) ? d.invoices.map(mapInvoice) : [];
      const st = d.stats ?? {};
      setClientDetail({
        user: userObj,
        stats: {
          requestsCount: Number(st.requests ?? st.total_requests ?? reqs.length),
          activeCount: Number(st.active ?? st.active_requests ?? reqs.filter(r => r.status === 'active').length),
          totalPaid: Number(st.paid ?? st.total_paid ?? invs.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)),
          totalDue: Number(st.due ?? st.total_due ?? invs.filter(i => i.status === 'due').reduce((s, i) => s + i.amount, 0)),
        },
        requests: reqs,
        invoices: invs,
        referrer: d.referrer || d.sponsor || null,
      });
    } catch {
      setClientDetail(null);
      setSelectedClientId(null);
      setActiveClientId(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [setActiveClientId]);

  useEffect(() => {
    if (selectedClientId) {
      loadClientDetail(selectedClientId);
    } else {
      setClientDetail(null);
    }
  }, [selectedClientId, loadClientDetail]);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const closeDetail = () => {
    setSelectedClientId(null);
    setActiveClientId(null);
    setClientDetail(null);
  };

  // Client file view
  if (selectedClientId) {
    if (loadingDetail || !clientDetail) {
      return (
        <section className="card">
          <div className="empty-state">
            <p className="muted">Chargement de la fiche client…</p>
          </div>
        </section>
      );
    }

    const c = clientDetail.user;
    const clientRequests = clientDetail.requests;
    const clientInvoices = clientDetail.invoices;

    const handleToggleSuspend = async () => {
      const willSuspend = !c.suspended;
      const ok = await confirm({
        title: willSuspend
          ? `Suspendre ${c.firstName} ${c.lastName} ?`
          : `Réactiver ${c.firstName} ${c.lastName} ?`,
        message: willSuspend
          ? 'Cette personne perdra immédiatement l’accès à son espace client.'
          : 'Cette personne retrouvera immédiatement l’accès à son espace client.',
        confirmLabel: willSuspend ? 'Suspendre le compte' : 'Réactiver le compte',
        cancelLabel: 'Annuler',
        variant: willSuspend ? 'warning' : 'primary',
      });
      if (!ok) return;
      try {
        await api(`/admin/clients/${c.id}/suspend`, {
          method: 'POST',
          body: { suspended: willSuspend },
        });
        addToast(willSuspend ? 'Compte suspendu.' : 'Compte réactivé.', 'success');
        await Promise.all([loadClientDetail(c.id), loadClients()]);
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : 'Erreur lors de la modification.', 'error');
      }
    };

    const handleSendResetLink = async () => {
      try {
        await api(`/admin/clients/${c.id}/reset-link`, { method: 'POST' });
        addToast(`Lien de réinitialisation valable 1h envoyé à ${c.email}.`, 'success');
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : "Impossible d'envoyer le lien.", 'error');
      }
    };

    const handleErase = async () => {
      const ok = await confirm({
        title: `Effacer définitivement le compte de ${c.firstName} ${c.lastName} ?`,
        message: 'Toutes ses demandes, documents, messages et factures seront supprimés (RGPD). Cette action est irréversible.',
        confirmLabel: 'Supprimer définitivement',
        cancelLabel: 'Annuler',
        variant: 'danger',
      });
      if (!ok) return;
      try {
        await api(`/admin/clients/${c.id}`, { method: 'DELETE' });
        addToast(`Compte de ${c.firstName} ${c.lastName} effacé.`, 'info');
        closeDetail();
        await loadClients();
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : "Impossible d'effacer le compte.", 'error');
      }
    };

    return (
      <>
        <button
          className="breadcrumb cursor-pointer border-0 bg-transparent p-0 text-left"
          type="button"
          onClick={closeDetail}
        >
          <Icon name="arrow-left" size={16} />
          <span>Clients</span>
        </button>

        <ul className="stats stats-4">
          <li className="stat stat-neutral">
            <span className="tile tile-sm">
              <Icon name="clipboard-document-list" size={18} />
            </span>
            <strong>{clientDetail.stats.requestsCount}</strong>
            <span>Demandes</span>
          </li>
          <li className="stat stat-green">
            <span className="tile tile-sm">
              <Icon name="bolt" size={18} />
            </span>
            <strong>{clientDetail.stats.activeCount}</strong>
            <span>En cours</span>
          </li>
          <li className="stat stat-green">
            <span className="tile tile-sm">
              <Icon name="banknotes" size={18} />
            </span>
            <strong>{formatMoney(clientDetail.stats.totalPaid)}</strong>
            <span>Total payé</span>
          </li>
          <li className="stat stat-gold">
            <span className="tile tile-sm">
              <Icon name="clock" size={18} />
            </span>
            <strong>{formatMoney(clientDetail.stats.totalDue)}</strong>
            <span>À payer</span>
          </li>
        </ul>

        <div className="detail-grid">
          {/* Left Stack: Requests & Invoices */}
          <div className="stack">
            <section className="card">
              <h2>Demandes</h2>
              {clientRequests.length === 0 ? (
                <p className="muted">Aucune demande.</p>
              ) : (
                <div className="request-list">
                  {clientRequests.map(r => {
                    const s = r.service || services.find(srv => srv.slug === r.serviceSlug || srv.id === r.serviceId);
                    return (
                      <a
                        key={r.id}
                        className="request-row"
                        href={`#/demandes/${r.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('admin-request-detail', r.id);
                        }}
                      >
                        <span className={`tile cat-${s?.cat || 'demarches'}`}>
                          <Icon name={s?.icon || 'clipboard-document-list'} size={20} />
                        </span>
                        <span className="request-row-main">
                          <strong>{r.title}</strong>
                          <small>{r.tracking} · {r.city} · {formatDate(r.createdAt)}</small>
                        </span>
                        <span className="request-row-side">
                          {r.urgency === 'urgent' && (
                            <span className="badge badge-red">
                              <Icon name="bolt" size={14} />
                              Urgent
                            </span>
                          )}
                          <span className={`badge badge-${STATUS_MAP[r.status].color}`}>
                            <Icon name={STATUS_MAP[r.status].icon} size={14} />
                            {STATUS_MAP[r.status].label}
                          </span>
                          <Icon name="chevron-right" size={18} />
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card">
              <h2>Factures</h2>
              {clientInvoices.length === 0 ? (
                <p className="muted">Aucune facture.</p>
              ) : (
                <ul className="mini-invoices">
                  {clientInvoices.map(i => (
                    <li key={i.id}>
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => addToast(`Facture ${i.number || i.id} : ${formatMoney(i.amount)}`)}
                      >
                        {i.number || i.id}
                      </button>
                      <span className="muted">{i.label}</span>
                      <strong>{formatMoney(i.amount)}</strong>
                      <span className={`badge badge-${i.status === 'paid' ? 'green' : i.status === 'due' ? 'gold' : 'neutral'}`}>
                        {i.status === 'paid' ? 'Payée' : i.status === 'due' ? 'À payer' : i.status === 'refunded' ? 'Remboursée' : 'Annulée'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right Aside: Client Card & Account Actions */}
          <aside className="stack">
            <section className="card">
              <div className="client-mini">
                <span className="avatar">
                  {`${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || 'CL'}
                </span>
                <span>
                  <strong>{c.fullName || `${c.firstName} ${c.lastName}`}</strong>
                  <small>{c.country}</small>
                </span>
              </div>
              <p className="client-state">
                {c.suspended ? (
                  <span className="badge badge-red">Suspendu</span>
                ) : c.verified ? (
                  <span className="badge badge-green">Actif</span>
                ) : (
                  <span className="badge badge-gold">E-mail à confirmer</span>
                )}
              </p>
              <ul className="contact-list">
                <li>
                  <Icon name="envelope" size={18} />
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </li>
                {c.phone && (
                  <li>
                    <Icon name="phone" size={18} />
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
                  </li>
                )}
                {c.referralCode && (
                  <li>
                    <Icon name="gift" size={18} />
                    <span>Code : {c.referralCode}</span>
                  </li>
                )}
                {clientDetail.referrer?.name && (
                  <li>
                    <Icon name="users" size={18} />
                    <span>Parrain : {clientDetail.referrer.name}</span>
                  </li>
                )}
                <li>
                  <Icon name="shield-check" size={18} />
                  <span>Double authentification {c.twoFactor ? 'activée' : 'désactivée'}</span>
                </li>
              </ul>
            </section>

            <section className="card">
              <h2>Actions sur le compte</h2>
              <div className="action-stack">
                <button
                  className="btn btn-ghost btn-block"
                  type="button"
                  onClick={handleSendResetLink}
                >
                  <Icon name="envelope" size={18} />
                  <span>Envoyer un lien de mot de passe</span>
                </button>
                <button
                  className="btn btn-ghost btn-block"
                  type="button"
                  onClick={handleToggleSuspend}
                >
                  <Icon name={c.suspended ? 'check-circle' : 'hand-raised'} size={18} />
                  <span>{c.suspended ? 'Réactiver le compte' : 'Suspendre le compte'}</span>
                </button>
                <button
                  className="btn btn-danger-ghost btn-block"
                  type="button"
                  onClick={handleErase}
                >
                  <Icon name="x-circle" size={18} />
                  <span>Effacer le compte et ses données</span>
                </button>
              </div>
              <p className="muted small-text">L'effacement répond au droit à l'effacement (RGPD). Il est définitif.</p>
            </section>
          </aside>
        </div>
      </>
    );
  }

  const exportCsv = async () => {
    try {
      const res = await api<any>('/admin/clients', {
        params: {
          q: debouncedQ || undefined,
          state: stateFilter !== 'all' ? stateFilter : undefined,
          page: 1,
          per_page: 200,
        },
      });
      const raw = Array.isArray(res?.data) ? res.data : [];
      const rows = raw.map((u: any) => {
        const mapped = mapUser(u);
        return [
          mapped.fullName || `${mapped.firstName} ${mapped.lastName}`,
          mapped.email,
          mapped.phone,
          mapped.country,
          Number(u.requests_count ?? 0),
          formatDate(mapped.createdAt),
        ];
      });

      const header = ['Client', 'E-mail', 'Téléphone', 'Pays', 'Demandes', 'Inscription'];
      const csvContent = [header, ...rows]
        .map((row: (string | number)[]) => row.map((val: string | number) => `"${String(val).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'kwabo-clients.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      addToast('kwabo-clients.csv téléchargé.', 'success');
    } catch {
      addToast("Impossible d'exporter les clients.", 'error');
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Icon name="magnifying-glass" size={18} />
          <label className="sr-only" htmlFor="clients-q">Filtrer les clients</label>
          <input
            id="clients-q"
            type="search"
            placeholder="Nom, e-mail ou pays…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <label className="sr-only" htmlFor="clients-state">État</label>
        <select
          id="clients-state"
          className="select-inline"
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Tous les états</option>
          <option value="active">Actifs</option>
          <option value="unverified">E-mail à confirmer</option>
          <option value="suspended">Suspendus</option>
        </select>

        <button className="btn btn-ghost btn-sm" type="button" onClick={exportCsv}>
          <Icon name="arrow-down-tray" size={18} />
          <span>Exporter en CSV</span>
        </button>
      </div>

      <section className="card">
        {loadingList ? (
          <div className="empty-state">
            <p className="muted">Chargement des clients…</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg">
              <Icon name="magnifying-glass" size={32} />
            </span>
            <h3>Aucun client trouvé</h3>
            <p className="muted">Essayez un autre nom, e-mail ou pays.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table table-cards">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>E-mail</th>
                    <th>Pays</th>
                    <th>Demandes</th>
                    <th>Payé</th>
                    <th>État</th>
                    <th>Inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td data-label="Client">
                        <button
                          type="button"
                          className="client-mini table-link border-0 bg-transparent cursor-pointer p-0 text-left flex items-center gap-2"
                          onClick={() => setSelectedClientId(c.id)}
                        >
                          <span className="avatar avatar-sm">
                            {`${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || 'CL'}
                          </span>
                          <strong>{c.fullName || `${c.firstName} ${c.lastName}`}</strong>
                        </button>
                      </td>
                      <td data-label="E-mail">{c.email}</td>
                      <td data-label="Pays">{c.country}</td>
                      <td data-label="Demandes">{c.requestsCount}</td>
                      <td data-label="Payé" className="nowrap">
                        {formatMoney(c.totalPaid)}
                      </td>
                      <td data-label="État">
                        {c.suspended ? (
                          <span className="badge badge-red">Suspendu</span>
                        ) : c.verified ? (
                          <span className="badge badge-green">Actif</span>
                        ) : (
                          <span className="badge badge-gold">E-mail à confirmer</span>
                        )}
                      </td>
                      <td data-label="Inscription" className="nowrap">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
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
    </>
  );
};
