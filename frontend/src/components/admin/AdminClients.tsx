import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, STATUS_MAP } from '../../data/kwaboData';

export const AdminClients: React.FC = () => {
  const { users, requests, invoices, toggleSuspendUser, eraseUser, addToast, navigate } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const clients = users.filter(u => u.role === 'USER');

  // Client file view
  if (selectedClientId) {
    const c = clients.find(u => u.id === selectedClientId);
    if (!c) {
      setSelectedClientId(null);
      return null;
    }

    const clientRequests = requests.filter(r => r.userId === c.id);
    const clientInvoices = invoices.filter(i => i.userId === c.id);
    const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const totalDue = clientInvoices.filter(i => i.status === 'due').reduce((sum, i) => sum + i.amount, 0);

    const handleToggleSuspend = () => {
      const willSuspend = !c.suspended;
      if (window.confirm(willSuspend ? `Suspendre ${c.firstName} ${c.lastName} ? Cette personne perd l'accès immédiatement.` : `Réactiver ${c.firstName} ${c.lastName} ?`)) {
        toggleSuspendUser(c.id);
        addToast(willSuspend ? 'Compte suspendu.' : 'Compte réactivé.');
      }
    };

    const handleErase = () => {
      if (window.confirm(`Effacer définitivement le compte de ${c.firstName} ${c.lastName} ? Toutes ses données seront supprimées (RGPD).`)) {
        eraseUser(c.id);
        addToast(`Compte de ${c.firstName} ${c.lastName} effacé.`);
        setSelectedClientId(null);
      }
    };

    return (
      <>
        <button
          className="breadcrumb cursor-pointer border-0 bg-transparent p-0 text-left"
          type="button"
          onClick={() => setSelectedClientId(null)}
        >
          <Icon name="arrow-left" size={16} />
          <span>Clients</span>
        </button>

        <ul className="stats stats-4">
          <li className="stat stat-neutral">
            <span className="tile tile-sm">
              <Icon name="clipboard-document-list" size={18} />
            </span>
            <strong>{clientRequests.length}</strong>
            <span>Demandes</span>
          </li>
          <li className="stat stat-green">
            <span className="tile tile-sm">
              <Icon name="bolt" size={18} />
            </span>
            <strong>{clientRequests.filter(r => r.status === 'active').length}</strong>
            <span>En cours</span>
          </li>
          <li className="stat stat-green">
            <span className="tile tile-sm">
              <Icon name="banknotes" size={18} />
            </span>
            <strong>{formatMoney(totalPaid)}</strong>
            <span>Total payé</span>
          </li>
          <li className="stat stat-gold">
            <span className="tile tile-sm">
              <Icon name="clock" size={18} />
            </span>
            <strong>{formatMoney(totalDue)}</strong>
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
                    const s = SERVICES.find(srv => srv.id === r.serviceId) || SERVICES[0];
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
                        <span className={`tile cat-${s.cat}`}>
                          <Icon name={s.icon} size={20} />
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
                        onClick={() => addToast(`Facture ${i.id} : ${formatMoney(i.amount)}`)}
                      >
                        {i.id}
                      </button>
                      <span className="muted">{i.label}</span>
                      <strong>{formatMoney(i.amount)}</strong>
                      <span className={`badge badge-${i.status === 'paid' ? 'green' : i.status === 'due' ? 'gold' : 'neutral'}`}>
                        {i.status === 'paid' ? 'Payée' : i.status === 'due' ? 'À payer' : 'Remboursée'}
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
                <span className="avatar">{c.firstName[0]}{c.lastName[0]}</span>
                <span>
                  <strong>{c.firstName} {c.lastName}</strong>
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
                <li>
                  <Icon name="phone" size={18} />
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
                </li>
                <li>
                  <Icon name="gift" size={18} />
                  <span>Code : {c.referralCode}</span>
                </li>
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
                  onClick={() => addToast(`Lien de réinitialisation valable 1h envoyé à ${c.email}.`)}
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

  // Directory Table View
  const filtered = clients.filter(c => {
    const state = c.suspended ? 'suspended' : c.verified ? 'active' : 'unverified';
    const needle = q.trim().toLowerCase();
    const matchesQ = !needle || (`${c.firstName} ${c.lastName} ${c.email} ${c.country}`).toLowerCase().includes(needle);
    const matchesState = stateFilter === 'all' || state === stateFilter;
    return matchesQ && matchesState;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    const rows = filtered.map(c => [
      `${c.firstName} ${c.lastName}`,
      c.email,
      c.phone,
      c.country,
      requests.filter(r => r.userId === c.id).length,
      formatDate(c.createdAt),
    ]);

    const header = ['Client', 'E-mail', 'Téléphone', 'Pays', 'Demandes', 'Inscription'];
    const csvContent = [header, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kwabo-clients.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    addToast('kwabo-clients.csv téléchargé.');
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
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
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
        {filtered.length === 0 ? (
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
                  {pagedList.map(c => {
                    const clientReqs = requests.filter(r => r.userId === c.id);
                    const paidAmount = invoices
                      .filter(i => i.userId === c.id && i.status === 'paid')
                      .reduce((sum, i) => sum + i.amount, 0);

                    return (
                      <tr key={c.id}>
                        <td data-label="Client">
                          <button
                            type="button"
                            className="client-mini table-link border-0 bg-transparent cursor-pointer p-0 text-left flex items-center gap-2"
                            onClick={() => setSelectedClientId(c.id)}
                          >
                            <span className="avatar avatar-sm">{c.firstName[0]}{c.lastName[0]}</span>
                            <strong>{c.firstName} {c.lastName}</strong>
                          </button>
                        </td>
                        <td data-label="E-mail">{c.email}</td>
                        <td data-label="Pays">{c.country}</td>
                        <td data-label="Demandes">{clientReqs.length}</td>
                        <td data-label="Payé" className="nowrap">
                          {formatMoney(paidAmount)}
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
    </>
  );
};
