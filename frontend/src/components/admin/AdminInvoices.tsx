import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { PAYMENT_METHODS } from '../../data/kwaboData';
import type { Invoice } from '../../types';

export const AdminInvoices: React.FC = () => {
  const { invoices, users, refundInvoice, addToast, navigate } = useApp();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Drawer state
  const [drawerInvoice, setDrawerInvoice] = useState<Invoice | null>(null);
  const drawerOpen = drawerInvoice !== null;
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  // Focus trap + keyboard close
  useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => drawerCloseRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerInvoice(null); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [drawerOpen]);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalDue = invoices.filter(i => i.status === 'due').reduce((sum, i) => sum + i.amount, 0);
  const totalRefunded = invoices.filter(i => i.status === 'refunded').reduce((sum, i) => sum + i.amount, 0);

  const filtered = invoices.filter(i => {
    const client = users.find(u => u.id === i.userId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : '';
    const needle = q.trim().toLowerCase();
    const matchesQ = !needle || (i.id + ' ' + i.label + ' ' + clientName).toLowerCase().includes(needle);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRefund = (id: string, amount: number) => {
    if (window.confirm(`Rembourser ${formatMoney(amount)} pour la facture ${id} ? Le client sera prévenu.`)) {
      refundInvoice(id);
      addToast(`Remboursement de ${formatMoney(amount)} enregistré.`);
    }
  };

  const handlePrint = (inv: Invoice) => {
    const client = users.find(u => u.id === inv.userId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';
    const method = inv.method ? PAYMENT_METHODS[inv.method]?.label : '–';
    const statusLabel = inv.status === 'paid' ? 'Payée' : inv.status === 'due' ? 'À payer' : inv.status === 'refunded' ? 'Remboursée' : 'Annulée';
    const dateCreated = formatDate(inv.createdAt);
    const datePaid = inv.paidAt ? formatDate(inv.paidAt) : '–';
    const amount = formatMoney(inv.amount);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${inv.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; color: #1a2e1d; padding: 40px; font-size: 15px; }
    .logo-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo-mark { width: 42px; height: 42px; border-radius: 11px; background: #1a5c2e; color: #f0c040; font: 700 24px/42px sans-serif; text-align: center; }
    .logo-name { font: 700 22px/1 sans-serif; color: #1a5c2e; letter-spacing: .02em; }
    .logo-dot { color: #f0c040; }
    h1 { font-size: 26px; margin-bottom: 6px; }
    .badge { display: inline-block; border: 1.5px solid #1a5c2e; border-radius: 100px; padding: 3px 12px; font-size: 13px; font-weight: 600; color: #1a5c2e; margin-bottom: 24px; }
    .dl { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; margin-bottom: 24px; }
    .dl dt { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; }
    .dl dd { font-weight: 600; font-size: 15px; }
    hr { border: 0; border-top: 2px solid #1a5c2e; margin: 20px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: baseline; }
    .total-row span { font-size: 15px; }
    .total-row strong { font-size: 28px; font-weight: 700; color: #1a5c2e; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="logo-wrap">
    <div class="logo-mark">K</div>
    <div class="logo-name">KWABO<span class="logo-dot">.</span></div>
  </div>
  <h1>Facture ${inv.id}</h1>
  <span class="badge">✓ ${statusLabel}</span>
  <div class="dl">
    <div><dt>Client</dt><dd>${clientName}</dd></div>
    <div><dt>Date</dt><dd>${dateCreated}</dd></div>
    <div><dt>Payée le</dt><dd>${datePaid}</dd></div>
    <div><dt>Moyen</dt><dd>${method}</dd></div>
    <div><dt>Objet</dt><dd>${inv.label}</dd></div>
  </div>
  <hr/>
  <div class="total-row"><span>Total</span><strong>${amount}</strong></div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=700,height=800');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const exportCsv = () => {
    const rows = filtered.map(i => {
      const c = users.find(u => u.id === i.userId);
      const methodLabel = i.method ? PAYMENT_METHODS[i.method]?.label : '';
      return [
        i.id,
        c ? `${c.firstName} ${c.lastName}` : '',
        i.label,
        methodLabel,
        formatDate(i.paidAt || i.createdAt),
        i.amount,
        i.status,
      ];
    });

    const header = ['Facture', 'Client', 'Objet', 'Moyen', 'Date', 'Montant (€)', 'État'];
    const csvContent = [header, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kwabo-factures.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    addToast('kwabo-factures.csv téléchargé.');
  };

  return (
    <>
      {/* ── Drawer overlay ── */}
      <div
        className={`drawer-overlay${drawerOpen ? ' open' : ''}`}
        aria-hidden="true"
        onClick={() => setDrawerInvoice(null)}
      />

      {/* ── Drawer panel ── */}
      <aside
        className={`drawer${drawerOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={drawerInvoice ? `Facture ${drawerInvoice.id}` : 'Détail facture'}
      >
        {drawerInvoice && (() => {
          const inv = drawerInvoice;
          const client = users.find(u => u.id === inv.userId);
          const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';
          const method = inv.method ? PAYMENT_METHODS[inv.method]?.label : '–';
          const statusLabel = inv.status === 'paid' ? 'Payée' : inv.status === 'due' ? 'À payer' : inv.status === 'refunded' ? 'Remboursée' : 'Annulée';
          const statusColor = inv.status === 'paid' ? 'green' : inv.status === 'due' ? 'gold' : 'neutral';
          return (
            <>
              <div className="drawer-header">
                <div>
                  {/* Logo KWABO */}
                  <div className="logo" style={{ marginBottom: 10 }}>
                    <span className="logo-mark">K</span>
                    <span className="logo-text">KWABO<span className="logo-dot">.</span></span>
                  </div>
                  <div className="drawer-title">{inv.id}</div>
                  <span className={`badge badge-${statusColor}`} style={{ marginTop: 6 }}>
                    {inv.status === 'paid' && <Icon name="check-circle" size={13} />}
                    {statusLabel}
                  </span>
                </div>
                <button
                  ref={drawerCloseRef}
                  className="drawer-close"
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setDrawerInvoice(null)}
                >
                  <Icon name="x-mark" size={20} />
                </button>
              </div>

              <div className="drawer-body">
                <dl className="invoice-dl">
                  <div>
                    <dt>Client</dt>
                    <dd>{clientName}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{formatDate(inv.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Payée le</dt>
                    <dd>{inv.paidAt ? formatDate(inv.paidAt) : '–'}</dd>
                  </div>
                  <div>
                    <dt>Moyen</dt>
                    <dd>{method}</dd>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <dt>Objet</dt>
                    <dd>{inv.label}</dd>
                  </div>
                </dl>

                <div className="invoice-total">
                  <span>Total</span>
                  <strong>{formatMoney(inv.amount)}</strong>
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => handlePrint(inv)}
                >
                  <Icon name="printer" size={16} />
                  Imprimer ou PDF
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={() => setDrawerInvoice(null)}
                >
                  Fermer
                </button>
              </div>
            </>
          );
        })()}
      </aside>
      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-green">
          <span className="tile tile-sm">
            <Icon name="banknotes" size={18} />
          </span>
          <strong>{formatMoney(1650)}</strong>
          <span>Encaissé ce mois-ci</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="chart-bar" size={18} />
          </span>
          <strong>{formatMoney(totalPaid)}</strong>
          <span>Total encaissé</span>
        </li>
        <li className="stat stat-gold">
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong>{formatMoney(totalDue)}</strong>
          <span>En attente</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="arrow-left" size={18} />
          </span>
          <strong>{formatMoney(totalRefunded)}</strong>
          <span>Remboursé</span>
        </li>
      </ul>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-field">
          <Icon name="magnifying-glass" size={18} />
          <label className="sr-only" htmlFor="invoices-q">Filtrer les factures</label>
          <input
            id="invoices-q"
            type="search"
            placeholder="Facture, client ou objet…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <label className="sr-only" htmlFor="invoices-status">État</label>
        <select
          id="invoices-status"
          className="select-inline"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Tous les états</option>
          <option value="due">À payer</option>
          <option value="paid">Payées</option>
          <option value="refunded">Remboursées</option>
          <option value="cancelled">Annulées</option>
        </select>

        <button className="btn btn-ghost btn-sm" type="button" onClick={exportCsv}>
          <Icon name="arrow-down-tray" size={18} />
          <span>Exporter en CSV</span>
        </button>
      </div>

      {/* Table Card */}
      <section className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg">
              <Icon name="magnifying-glass" size={32} />
            </span>
            <h3>Aucune facture</h3>
            <p className="muted">Changez votre recherche ou le filtre.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table table-cards">
                <thead>
                  <tr>
                    <th>Facture</th>
                    <th>Client</th>
                    <th>Objet</th>
                    <th>Moyen</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>État</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedList.map(i => {
                    const client = users.find(u => u.id === i.userId);
                    const method = i.method ? PAYMENT_METHODS[i.method] : null;

                    return (
                      <tr key={i.id}>
                        <td data-label="Facture" className="nowrap">
                          <strong>{i.id}</strong>
                        </td>
                        <td data-label="Client">
                          {client ? (
                            <a
                              className="table-link"
                              href="#/clients"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('admin-clients');
                              }}
                            >
                              {client.firstName} {client.lastName}
                            </a>
                          ) : (
                            'Client'
                          )}
                        </td>
                        <td data-label="Objet">{i.label}</td>
                        <td data-label="Moyen">
                          {method ? method.label : <span className="muted">–</span>}
                        </td>
                        <td data-label="Date" className="nowrap">
                          {formatDate(i.paidAt || i.createdAt)}
                        </td>
                        <td data-label="Montant">
                          <strong>{formatMoney(i.amount)}</strong>
                        </td>
                        <td data-label="État">
                          <span className={`badge badge-${i.status === 'paid' ? 'green' : i.status === 'due' ? 'gold' : 'neutral'}`}>
                            {i.status === 'paid' ? 'Payée' : i.status === 'due' ? 'À payer' : i.status === 'refunded' ? 'Remboursée' : 'Annulée'}
                          </span>
                        </td>
                        <td className="td-action">
                          <span className="row-actions">
                            <button
                              className="btn btn-ghost btn-sm"
                              type="button"
                              onClick={() => setDrawerInvoice(i)}
                            >
                              Voir
                            </button>
                            {i.status === 'paid' && (
                              <button
                                className="btn btn-danger-ghost btn-sm"
                                type="button"
                                onClick={() => handleRefund(i.id, i.amount)}
                              >
                                Rembourser
                              </button>
                            )}
                          </span>
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
