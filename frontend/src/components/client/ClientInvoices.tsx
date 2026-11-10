import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem } from '../../types';
import { Icon } from '../common/Icon';
import { PAYMENT_METHODS } from '../../data/kwaboData';

export const ClientInvoices: React.FC = () => {
  const { currentUser, invoices, users, payInvoice, addToast } = useApp();

  /* ── local state ── */
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [payStep, setPayStep] = useState<'choose' | 'provider'>('choose');
  const [payMethod, setPayMethod] = useState<'card' | 'momo' | 'wise'>('card');
  const [drawerInvoice, setDrawerInvoice] = useState<InvoiceItem | null>(null);
  const drawerOpen = drawerInvoice !== null;
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const [methods, setMethods] = useState<Array<{ type: string; label: string; icon: string }>>([
    { type: 'card', label: 'Visa se terminant par 4242', icon: 'credit-card' },
  ]);

  /* ── derived ── */
  const userInvoices = invoices.filter(i => i.userId === currentUser?.id);
  const due  = userInvoices.filter(i => i.status === 'due');
  const paid = userInvoices.filter(i => i.status === 'paid');
  const totalDue  = due.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = paid.reduce((sum, i) => sum + i.amount, 0);

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
  const handleSimulateSuccess = () => {
    if (selectedInvoice) {
      payInvoice(selectedInvoice.id, payMethod);
      setSelectedInvoice(null);
      addToast('Paiement confirmé. Merci !');
    }
  };
  const handleSimulateFail = () => {
    addToast('Le paiement a échoué. Aucun montant n\'a été prélevé, vous pouvez réessayer.', 'error');
    setSelectedInvoice(null);
  };
  const handleRemoveMethod = (idx: number) => {
    setMethods(prev => prev.filter((_, i) => i !== idx));
    addToast('Moyen de paiement retiré.');
  };

  /* ── print ── */
  const handlePrint = (inv: InvoiceItem) => {
    const client = users.find(u => u.id === inv.userId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';
    const method = inv.method ? PAYMENT_METHODS[inv.method]?.label ?? '' : '–';
    const statusLabel = inv.status === 'paid' ? 'Payée' : inv.status === 'due' ? 'À payer' : inv.status === 'refunded' ? 'Remboursée' : 'Annulée';
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>Facture ${inv.id}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:#1a2e1d;padding:40px;font-size:15px}
.logo-wrap{display:flex;align-items:center;gap:10px;margin-bottom:32px}
.logo-mark{width:42px;height:42px;border-radius:11px;background:#1a5c2e;color:#f0c040;font:700 24px/42px sans-serif;text-align:center}
.logo-name{font:700 22px/1 sans-serif;color:#1a5c2e;letter-spacing:.02em}.logo-dot{color:#f0c040}
h1{font-size:26px;margin-bottom:6px}
.badge{display:inline-block;border:1.5px solid #1a5c2e;border-radius:100px;padding:3px 12px;font-size:13px;font-weight:600;color:#1a5c2e;margin-bottom:24px}
.dl{display:grid;grid-template-columns:1fr 1fr;gap:20px 32px;margin-bottom:24px}
.dl dt{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.dl dd{font-weight:600;font-size:15px}
hr{border:0;border-top:2px solid #1a5c2e;margin:20px 0}
.total-row{display:flex;justify-content:space-between;align-items:baseline}
.total-row span{font-size:15px}.total-row strong{font-size:28px;font-weight:700;color:#1a5c2e}
@media print{body{padding:20px}}
</style></head><body>
<div class="logo-wrap"><div class="logo-mark">K</div><div class="logo-name">KWABO<span class="logo-dot">.</span></div></div>
<h1>Facture ${inv.id}</h1><span class="badge">✓ ${statusLabel}</span>
<div class="dl">
<div><dt>Client</dt><dd>${clientName}</dd></div>
<div><dt>Date</dt><dd>${fmtDate(inv.createdAt)}</dd></div>
${inv.paidAt ? `<div><dt>Payée le</dt><dd>${fmtDate(inv.paidAt)}</dd></div><div><dt>Moyen</dt><dd>${method}</dd></div>` : ''}
<div><dt>Objet</dt><dd>${inv.label}</dd></div>
</div><hr/>
<div class="total-row"><span>Total</span><strong>${money(inv.amount)}</strong></div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;
    const win = window.open('', '_blank', 'width=700,height=800');
    if (win) { win.document.write(html); win.document.close(); }
  };

  /* ── badge helper ── */
  const invoiceBadge = (inv: InvoiceItem) => {
    if (inv.status === 'paid')      return <span className="badge badge-green"><Icon name="check-circle" size={14} /> Payée</span>;
    if (inv.status === 'due')       return <span className="badge badge-gold"><Icon name="clock" size={14} /> À payer</span>;
    if (inv.status === 'refunded')  return <span className="badge badge-red"><Icon name="arrow-left" size={14} /> Remboursée</span>;
    return <span className="badge badge-neutral"><Icon name="x-circle" size={14} /> Annulée</span>;
  };

  const paymentProviders: Record<string, { label: string; via: string; icon: string }> = {
    card: { label: 'Carte bancaire', via: 'Stripe (CB, Visa, Mastercard)', icon: 'credit-card' },
    momo: { label: 'Mobile Money', via: 'MTN MoMo, Moov Money (Bénin)', icon: 'device-phone-mobile' },
    wise: { label: 'Virement bancaire', via: 'Wise / IBAN européen', icon: 'building-library' },
  };

  return (
    <div>
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
          const method = inv.method ? PAYMENT_METHODS[inv.method]?.label ?? '–' : '–';
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
                  <div className="drawer-title">Facture {inv.id}</div>
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
                    <dd>{fmtDate(inv.createdAt)}</dd>
                  </div>
                  {inv.paidAt && (
                    <>
                      <div>
                        <dt>Payée le</dt>
                        <dd>{fmtDate(inv.paidAt)}</dd>
                      </div>
                      <div>
                        <dt>Moyen</dt>
                        <dd>{method}</dd>
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <dt>Objet</dt>
                    <dd>{inv.label}</dd>
                  </div>
                </dl>

                <div className="invoice-total">
                  <span>Total</span>
                  <strong>{money(inv.amount)}</strong>
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

      {/* ── 3 Stats Cards ── */}
      <ul className="stats stats-3">
        <li className="stat stat-gold">
          <span className="tile tile-sm"><Icon name="clock" size={18} /></span>
          <strong>{money(totalDue)}</strong>
          <span>À payer</span>
        </li>
        <li className="stat stat-green">
          <span className="tile tile-sm"><Icon name="check-circle" size={18} /></span>
          <strong>{money(totalPaid)}</strong>
          <span>Total payé</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm"><Icon name="receipt-percent" size={18} /></span>
          <strong>{userInvoices.length}</strong>
          <span>Factures</span>
        </li>
      </ul>

      {/* ── Due Alerts ── */}
      {due.map(i => (
        <div key={i.id} className="alert">
          <span className="tile tile-sm"><Icon name="banknotes" size={18} /></span>
          <p>
            <strong>{i.label} : {money(i.amount)}</strong>
            <br />
            <small>Facture {i.id} du {fmtDate(i.createdAt)}</small>
          </p>
          <button className="btn btn-gold btn-sm" type="button" onClick={() => handleOpenPay(i)}>
            Payer
          </button>
        </div>
      ))}

      <div className="stack">
        {/* ── Historique ── */}
        <section className="card">
          <h2>Historique</h2>
          {userInvoices.length ? (
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
                <tbody>
                  {userInvoices.map(i => (
                    <tr key={i.id}>
                      <td data-label="Facture"><strong>{i.id}</strong></td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Aucune facture pour le moment.</p>
          )}
        </section>

        {/* ── Moyens enregistrés + Paiement sécurisé ── */}
        <div className="dash-grid dash-grid-even">
          <section className="card">
            <h2>Moyens enregistrés</h2>
            {methods.length ? (
              <ul className="method-list">
                {methods.map((m, index) => (
                  <li key={index}>
                    <Icon name={m.icon as any} size={20} />
                    <span>{m.label}</span>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Retirer ${m.label}`}
                      onClick={() => handleRemoveMethod(index)}
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
        </div>
      </div>

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
                    Démonstration : aucun paiement réel. Ici, le client serait sur la page sécurisée du prestataire.
                  </p>
                </div>

                <div className="dialog-actions">
                  <button className="btn btn-ghost" type="button" onClick={handleSimulateFail}>
                    Simuler un échec
                  </button>
                  <button className="btn btn-primary" type="button" onClick={handleSimulateSuccess}>
                    Simuler le paiement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
