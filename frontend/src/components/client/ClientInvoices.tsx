import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem, PaymentMethodItem } from '../../types';
import { Icon } from '../common/Icon';
import { InvoiceReceiptDrawer } from '../common/InvoiceReceiptDrawer';
import { api, ApiError } from '../../services/api';
import { mapInvoice } from '../../services/mappers';
import { printInvoicePdf } from '../../utils/printPdf';

// Apparition en cascade : chaque bloc monte légèrement en fondu, l'un après l'autre.
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const cascade: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export const ClientInvoices: React.FC = () => {
  const { currentUser, refreshCounters, addToast, confirm } = useApp();
  const reduceMotion = useReducedMotion();

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [metaTotals, setMetaTotals] = useState<{ dueTotal: number; paidTotal: number; count: number } | null>(null);
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── local state ── */
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [payStep, setPayStep] = useState<'choose' | 'provider'>('choose');
  const [payMethod, setPayMethod] = useState<'card' | 'momo' | 'wise'>('card');
  const [paying, setPaying] = useState(false);
  const [drawerInvoice, setDrawerInvoice] = useState<InvoiceItem | null>(null);
  const drawerOpen = drawerInvoice !== null;
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [invRes, methRes] = await Promise.all([
        api<any>('/invoices'),
        api<any>('/payment-methods').catch(() => ({ data: [] })),
      ]);

      const rawInvs = Array.isArray(invRes?.data) ? invRes.data : Array.isArray(invRes) ? invRes : [];
      setInvoices(rawInvs.map(mapInvoice));
      if (invRes?.meta) {
        setMetaTotals({
          dueTotal: Number(invRes.meta.due_total ?? 0),
          paidTotal: Number(invRes.meta.paid_total ?? 0),
          count: Number(invRes.meta.count ?? rawInvs.length),
        });
      }

      const rawMeths = Array.isArray(methRes?.data) ? methRes.data : Array.isArray(methRes) ? methRes : [];
      setMethods(
        rawMeths.map((m: any) => ({
          id: String(m.id),
          type: m.type || m.method || 'card',
          label: m.label || m.name || 'Moyen de paiement',
          icon: m.icon || (m.type === 'momo' ? 'device-phone-mobile' : m.type === 'wise' ? 'building-library' : 'credit-card'),
        }))
      );
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  /* ── derived ── */
  const due = invoices.filter(i => i.status === 'due');
  const paid = invoices.filter(i => i.status === 'paid');
  const totalDue = metaTotals ? metaTotals.dueTotal : due.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = metaTotals ? metaTotals.paidTotal : paid.reduce((sum, i) => sum + i.amount, 0);
  const invoiceCount = metaTotals ? metaTotals.count : invoices.length;

  /* ── helpers ── */
  const money = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── drawer keyboard + focus ── */
  useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => drawerCloseRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerInvoice(null); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [drawerOpen]);

  /* ── pay flow ── */
  const handleOpenPay = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setPayStep('choose');
  };
  const handleProceedToProvider = (e: React.FormEvent) => {
    e.preventDefault();
    setPayStep('provider');
  };

  const handleSimulateSuccess = async () => {
    if (!selectedInvoice || paying) return;
    setPaying(true);
    try {
      await api(`/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        body: { method: payMethod },
      });
      setSelectedInvoice(null);
      addToast('Paiement confirmé. Merci !', 'success');
      await Promise.all([loadData(), refreshCounters()]);
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Erreur lors du paiement.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleSimulateFail = async () => {
    if (!selectedInvoice || paying) return;
    setPaying(true);
    try {
      await api(`/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        body: { method: payMethod, simulate: 'fail' },
      });
      setSelectedInvoice(null);
    } catch (err) {
      addToast(
        err instanceof ApiError
          ? err.message
          : "Le paiement a échoué. Aucun montant n'a été prélevé, vous pouvez réessayer.",
        'error'
      );
      setSelectedInvoice(null);
    } finally {
      setPaying(false);
    }
  };

  const handleRemoveMethod = async (id: string, label?: string) => {
    const ok = await confirm({
      title: 'Retirer ce moyen de paiement ?',
      message: label ? `« ${label} » sera supprimé de vos moyens enregistrés.` : 'Ce moyen de paiement sera supprimé de votre compte.',
      confirmLabel: 'Retirer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/payment-methods/${id}`, { method: 'DELETE' });
      setMethods(prev => prev.filter(m => m.id !== id));
      addToast('Moyen de paiement retiré.', 'info');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Impossible de retirer ce moyen de paiement.', 'error');
    }
  };

  /* ── print ── */
  const handlePrint = (inv: InvoiceItem) => {
    const clientName = currentUser?.fullName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Client');
    const opened = printInvoicePdf({
      invoice: inv,
      clientName,
      clientEmail: currentUser?.email,
      clientCountry: currentUser?.country,
    });
    if (!opened) {
      addToast('Autorisez les fenêtres pop-up pour afficher ou enregistrer le PDF.', 'warning');
    }
  };

  /* ── badge helper ── */
  const invoiceBadge = (inv: InvoiceItem) => {
    if (inv.status === 'paid') return <span className="badge badge-green"><Icon name="check-circle" size={14} /> Payée</span>;
    if (inv.status === 'due') return <span className="badge badge-gold"><Icon name="clock" size={14} /> À payer</span>;
    if (inv.status === 'refunded') return <span className="badge badge-red"><Icon name="arrow-left" size={14} /> Remboursée</span>;
    return <span className="badge badge-neutral"><Icon name="x-circle" size={14} /> Annulée</span>;
  };

  const paymentProviders: Record<string, { label: string; via: string; icon: string }> = {
    card: { label: 'Carte bancaire', via: 'Stripe (CB, Visa, Mastercard)', icon: 'credit-card' },
    momo: { label: 'Mobile Money', via: 'MTN MoMo, Moov Money (Bénin)', icon: 'device-phone-mobile' },
    wise: { label: 'Virement bancaire', via: 'Wise / IBAN européen', icon: 'building-library' },
  };

  return (
    <motion.div
      className="stack"
      variants={container}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      {/* ── Receipt / Invoice Drawer ── */}
      <InvoiceReceiptDrawer
        invoice={drawerInvoice}
        clientName={currentUser?.fullName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Client')}
        clientEmail={currentUser?.email}
        clientCountry={currentUser?.country}
        closeButtonRef={drawerCloseRef}
        onClose={() => setDrawerInvoice(null)}
        onPrint={handlePrint}
        onPay={(inv) => {
          setDrawerInvoice(null);
          handleOpenPay(inv);
        }}
      />

      {/* ── 3 Stats Cards ── */}
      <motion.ul className="stats stats-3" variants={cascade}>
        <motion.li className="stat stat-gold" variants={item} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
          <span className="tile tile-sm"><Icon name="clock" size={18} /></span>
          <strong>{money(totalDue)}</strong>
          <span>À payer</span>
        </motion.li>
        <motion.li className="stat stat-green" variants={item} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
          <span className="tile tile-sm"><Icon name="check-circle" size={18} /></span>
          <strong>{money(totalPaid)}</strong>
          <span>Total payé</span>
        </motion.li>
        <motion.li className="stat stat-neutral" variants={item} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
          <span className="tile tile-sm"><Icon name="receipt-percent" size={18} /></span>
          <strong>{invoiceCount}</strong>
          <span>Factures</span>
        </motion.li>
      </motion.ul>

      {/* ── Due Alerts ── */}
      {due.map(i => (
        <motion.div key={i.id} className="alert" variants={item}>
          <span className="tile tile-sm"><Icon name="banknotes" size={18} /></span>
          <p>
            <strong>{i.label} : {money(i.amount)}</strong>
            <br />
            <small>Facture {i.number || i.id} du {fmtDate(i.createdAt)}</small>
          </p>
          <motion.button
            className="btn btn-gold btn-sm"
            type="button"
            onClick={() => handleOpenPay(i)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
          >
            Payer
          </motion.button>
        </motion.div>
      ))}

      <motion.div className="stack" variants={cascade}>
        {/* ── Historique ── */}
        <motion.section className="card" variants={item}>
          <h2>Historique</h2>
          {loading ? (
            <p className="muted">Chargement des factures…</p>
          ) : invoices.length ? (
            <div className="table-wrap">
              <table className="table table-cards">
                <thead>
                  <tr>
                    <th>Facture</th>
                    <th>Objet</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>État</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <motion.tbody variants={cascade}>
                  {invoices.map(i => (
                    <motion.tr key={i.id} variants={item}>
                      <td data-label="Facture"><strong>{i.number || i.id}</strong></td>
                      <td data-label="Objet">{i.label}</td>
                      <td data-label="Date" className="nowrap">{fmtDate(i.paidAt || i.createdAt)}</td>
                      <td data-label="Montant"><strong>{money(i.amount)}</strong></td>
                      <td data-label="État">{invoiceBadge(i)}</td>
                      <td className="td-action">
                        {i.status === 'due' ? (
                          <button className="btn btn-gold btn-sm" type="button" onClick={() => handleOpenPay(i)}>
                            Payer
                          </button>
                        ) : (
                          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDrawerInvoice(i)}>
                            Voir
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Aucune facture pour le moment.</p>
          )}
        </motion.section>

        {/* ── Moyens enregistrés + Paiement sécurisé ── */}
        <motion.div className="dash-grid dash-grid-even" variants={item}>
          <section className="card">
            <h2>Moyens enregistrés</h2>
            {methods.length ? (
              <ul className="method-list">
                {methods.map((m) => (
                  <li key={m.id}>
                    <Icon name={m.icon as any} size={20} />
                    <span>{m.label}</span>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Retirer ${m.label}`}
                      onClick={() => handleRemoveMethod(m.id, m.label)}
                    >
                      <Icon name="x-mark" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Aucun moyen enregistré.</p>
            )}
          </section>

          <section className="card card-soft">
            <h2><Icon name="lock-closed" size={20} /> Paiement sécurisé</h2>
            <p className="muted">
              Le paiement se fait chez Stripe, Flutterwave ou Wise. KWABO ne conserve jamais les données de votre carte bancaire.
            </p>
          </section>
        </motion.div>
      </motion.div>

      {/* ── Pay Invoice Dialog ── */}
      {selectedInvoice && (
        <div className="dialog-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            {payStep === 'choose' ? (
              <form onSubmit={handleProceedToProvider}>
                <h2 className="dialog-title">Payer {money(selectedInvoice.amount)}</h2>
                <p className="muted">{selectedInvoice.label}</p>

                <fieldset className="pay-options my-4">
                  <legend className="sr-only">Moyen de paiement</legend>
                  {Object.entries(paymentProviders).map(([key, m]) => (
                    <label key={key} className="pay-option">
                      <input
                        type="radio"
                        name="method"
                        value={key}
                        checked={payMethod === key}
                        onChange={() => setPayMethod(key as any)}
                      />
                      <span className="tile tile-sm"><Icon name={m.icon as any} size={18} /></span>
                      <span>
                        <strong>{m.label}</strong>
                        <small>{m.via}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <p className="muted small">
                  <Icon name="lock-closed" size={16} /> Vous serez redirigé vers le prestataire. KWABO ne voit jamais les données de votre carte.
                </p>

                <div className="dialog-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setSelectedInvoice(null)}>
                    Annuler
                  </button>
                  <button className="btn btn-primary" type="submit">Continuer</button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="dialog-title">Page du prestataire</h2>
                <div className="doc-preview my-4" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', padding: 16, borderRadius: 16, background: 'var(--neutral-pale)', marginBottom: 8 }}>
                    <Icon name={paymentProviders[payMethod].icon as any} size={48} />
                  </div>
                  <p><strong>{paymentProviders[payMethod].label} : {money(selectedInvoice.amount)}</strong></p>
                  <p className="muted">
                    Mode test sécurisé : confirmez le paiement ou simulez un échec bancaire.
                  </p>
                </div>

                <div className="dialog-actions">
                  <button className="btn btn-ghost" type="button" disabled={paying} onClick={handleSimulateFail}>
                    Simuler un échec
                  </button>
                  <button className="btn btn-primary" type="button" disabled={paying} onClick={handleSimulateSuccess}>
                    {paying ? 'Traitement…' : 'Confirmer le paiement'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
