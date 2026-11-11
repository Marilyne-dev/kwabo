import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { InvoiceReceiptDrawer } from '../common/InvoiceReceiptDrawer';
import { PAYMENT_METHODS } from '../../data/kwaboData';
import type { InvoiceItem } from '../../types';
import { api, ApiError } from '../../services/api';
import { mapInvoice } from '../../services/mappers';
import { printInvoicePdf } from '../../utils/printPdf';

export const AdminInvoices: React.FC = () => {
  const { setActiveClientId, addToast, confirm, navigate } = useApp();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totals, setTotals] = useState({ month: 0, paid: 0, due: 0, refunded: 0 });
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [drawerInvoice, setDrawerInvoice] = useState<InvoiceItem | null>(null);
  const drawerOpen = drawerInvoice !== null;
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>('/admin/invoices', {
        params: {
          q: debouncedQ || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          per_page: 20,
        },
      });
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const mapped: InvoiceItem[] = raw.map(mapInvoice);
      setInvoices(mapped);
      setTotalPages(Math.max(1, Number(res?.meta?.last_page ?? 1)));
      const m = res?.meta ?? {};
      setTotals({
        month: Number(m.month_total ?? m.paid_month ?? m.revenue_month ?? 0),
        paid: Number(m.paid_total ?? m.total_paid ?? mapped.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)),
        due: Number(m.due_total ?? m.total_due ?? mapped.filter(i => i.status === 'due').reduce((s, i) => s + i.amount, 0)),
        refunded: Number(m.refunded_total ?? m.total_refunded ?? mapped.filter(i => i.status === 'refunded').reduce((s, i) => s + i.amount, 0)),
      });
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, statusFilter, page]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

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

  const getClientName = (inv: InvoiceItem) =>
    inv.client ? (inv.client.fullName || `${inv.client.firstName} ${inv.client.lastName}`.trim()) : 'Client';

  const handleOpenDrawer = async (inv: InvoiceItem) => {
    setDrawerInvoice(inv);
    try {
      const res = await api<any>(`/admin/invoices/${inv.id}`);
      const mapped = mapInvoice(res?.data ?? res);
      setDrawerInvoice(mapped);
    } catch {
      // Keep list version
    }
  };

  const handleRefund = async (inv: InvoiceItem) => {
    const label = inv.number || inv.id;
    const ok = await confirm({
      title: `Rembourser ${formatMoney(inv.amount)} ?`,
      message: `La facture ${label} sera marquée comme remboursée et le client en sera notifié.`,
      confirmLabel: 'Confirmer le remboursement',
      cancelLabel: 'Annuler',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await api(`/admin/invoices/${inv.id}/refund`, { method: 'POST' });
      addToast(`Remboursement de ${formatMoney(inv.amount)} enregistré.`, 'success');
      await loadInvoices();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Erreur lors du remboursement.', 'error');
    }
  };

  const handlePrint = (inv: InvoiceItem) => {
    const opened = printInvoicePdf({
      invoice: inv,
      clientName: getClientName(inv),
      clientEmail: inv.client?.email,
      clientCountry: inv.client?.country,
    });
    if (!opened) {
      addToast('Autorisez les fenêtres pop-up pour afficher ou enregistrer le PDF.', 'warning');
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api<any>('/admin/invoices', {
        params: {
          q: debouncedQ || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: 1,
          per_page: 200,
        },
      });
      const list: InvoiceItem[] = (Array.isArray(res?.data) ? res.data : []).map(mapInvoice);
      const rows = list.map(i => {
        const methodLabel = i.method ? PAYMENT_METHODS[i.method]?.label ?? i.method : '';
        return [
          i.number || i.id,
          getClientName(i),
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
      addToast('kwabo-factures.csv téléchargé.', 'success');
    } catch {
      addToast("Impossible d'exporter les factures.", 'error');
    }
  };

  return (
    <>
      {/* Receipt / Invoice Drawer */}
      <InvoiceReceiptDrawer
        invoice={drawerInvoice}
        clientName={drawerInvoice ? getClientName(drawerInvoice) : 'Client'}
        clientEmail={drawerInvoice?.client?.email}
        clientCountry={drawerInvoice?.client?.country}
        closeButtonRef={drawerCloseRef}
        onClose={() => setDrawerInvoice(null)}
        onPrint={handlePrint}
      />

      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-green">
          <span className="tile tile-sm">
            <Icon name="banknotes" size={18} />
          </span>
          <strong>{formatMoney(totals.month)}</strong>
          <span>Encaissé ce mois-ci</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="chart-bar" size={18} />
          </span>
          <strong>{formatMoney(totals.paid)}</strong>
          <span>Total encaissé</span>
        </li>
        <li className="stat stat-gold">
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong>{formatMoney(totals.due)}</strong>
          <span>En attente</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="arrow-left" size={18} />
          </span>
          <strong>{formatMoney(totals.refunded)}</strong>
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
            onChange={(e) => setQ(e.target.value)}
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
          <option value="paid">Payées</option>
          <option value="due">À payer</option>
          <option value="refunded">Remboursées</option>
          <option value="cancelled">Annulées</option>
        </select>

        <button className="btn btn-ghost btn-sm" type="button" onClick={exportCsv}>
          <Icon name="arrow-down-tray" size={18} />
          <span>Exporter en CSV</span>
        </button>
      </div>

      {/* Table */}
      <section className="card">
        {loading ? (
          <div className="empty-state">
            <p className="muted">Chargement des factures…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg">
              <Icon name="banknotes" size={32} />
            </span>
            <h3>Aucune facture</h3>
            <p className="muted">Changez votre recherche ou le filtre d'état.</p>
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
                  {invoices.map(i => {
                    const method = i.method ? PAYMENT_METHODS[i.method] : null;
                    const clientName = getClientName(i);

                    return (
                      <tr key={i.id}>
                        <td data-label="Facture" className="nowrap">
                          <strong>{i.number || i.id}</strong>
                        </td>
                        <td data-label="Client">
                          {i.client?.id ? (
                            <a
                              className="table-link"
                              href="#/clients"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveClientId(i.client!.id);
                                navigate('admin-clients');
                              }}
                            >
                              {clientName}
                            </a>
                          ) : (
                            clientName
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
                              onClick={() => handleOpenDrawer(i)}
                            >
                              Voir
                            </button>
                            {i.status === 'paid' && (
                              <button
                                className="btn btn-danger-ghost btn-sm"
                                type="button"
                                onClick={() => handleRefund(i)}
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
