import React from 'react';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Printer,
  CreditCard,
  Smartphone,
  Landmark,
  ShieldCheck,
  Calendar,
  Hash,
  User as UserIcon,
  FileText,
  X,
} from 'lucide-react';
import type { InvoiceItem } from '../../types';
import { PAYMENT_METHODS } from '../../data/kwaboData';

interface InvoiceReceiptDrawerProps {
  invoice: InvoiceItem | null;
  clientName: string;
  clientEmail?: string | null;
  clientCountry?: string | null;
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onPrint: (invoice: InvoiceItem) => void;
  onPay?: (invoice: InvoiceItem) => void;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDateLong = (iso?: string | null) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getMethodIcon = (method?: string | null) => {
  if (method === 'momo') return Smartphone;
  if (method === 'wise') return Landmark;
  return CreditCard;
};

export const InvoiceReceiptDrawer: React.FC<InvoiceReceiptDrawerProps> = ({
  invoice,
  clientName,
  clientEmail,
  clientCountry,
  closeButtonRef,
  onClose,
  onPrint,
  onPay,
}) => {
  const open = invoice !== null;

  const statusConfig = {
    paid: {
      kicker: 'Reçu de paiement',
      badge: 'Paiement confirmé',
      badgeCls: 'bg-[#e8f5ee] text-[#14532d] border-[#b7dfc4]',
      amountLabel: 'Montant réglé TTC',
      amountBoxCls: 'bg-gradient-to-br from-[#f2f9f5] to-[#e8f5ee] border-[#b7dfc4]',
      amountTextCls: 'text-[#14532d]',
      Icon: CheckCircle2,
    },
    due: {
      kicker: 'Facture à régler',
      badge: 'En attente de règlement',
      badgeCls: 'bg-[#fef5df] text-[#854d0e] border-[#f5da91]',
      amountLabel: 'Montant à payer TTC',
      amountBoxCls: 'bg-gradient-to-br from-[#fdf9ee] to-[#fef5df] border-[#f5da91]',
      amountTextCls: 'text-[#854d0e]',
      Icon: Clock,
    },
    refunded: {
      kicker: 'Reçu de remboursement',
      badge: 'Remboursée',
      badgeCls: 'bg-[#e8f2fc] text-[#1e40af] border-[#bfdbfe]',
      amountLabel: 'Montant remboursé TTC',
      amountBoxCls: 'bg-gradient-to-br from-[#f3f8fe] to-[#e8f2fc] border-[#bfdbfe]',
      amountTextCls: 'text-[#1e40af]',
      Icon: RotateCcw,
    },
    cancelled: {
      kicker: 'Facture annulée',
      badge: 'Annulée',
      badgeCls: 'bg-[#fdeaea] text-[#991b1b] border-[#f8c6c6]',
      amountLabel: 'Montant annulé',
      amountBoxCls: 'bg-[#f9faf9] border-[#e2e7e3]',
      amountTextCls: 'text-[#56635b]',
      Icon: XCircle,
    },
  } as const;

  return (
    <>
      <div
        className={`drawer-overlay${open ? ' open' : ''}`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={`drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={invoice ? `Reçu ${invoice.number || invoice.id}` : 'Détail du reçu'}
      >
        {invoice && (() => {
          const cfg = statusConfig[invoice.status] ?? statusConfig.due;
          const StatusIcon = cfg.Icon;
          const MethodIcon = getMethodIcon(invoice.method);
          const invNum = invoice.number || invoice.id;
          const methodLabel = invoice.method ? PAYMENT_METHODS[invoice.method]?.label ?? invoice.method : '–';
          const isPaid = invoice.status === 'paid';

          return (
            <div className="flex min-h-full flex-col bg-[#f7f8f6]">
              {/* Header band */}
              <div className="relative bg-gradient-to-br from-[#103823] to-[#1a5c38] px-6 pb-6 pt-5 text-white border-b-4 border-[#f0c040]">
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Fermer"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90 transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0c040] font-display text-lg font-bold text-[#103823]">
                    K
                  </span>
                  <div>
                    <div className="font-display text-base font-bold tracking-wide leading-none">
                      KWABO<span className="text-[#f0c040]">.</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/75">
                      Services de confiance · Cotonou
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f5d162]">
                      {cfg.kicker}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                      {invNum}
                    </h2>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.badgeCls}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span>{cfg.badge}</span>
                  </span>
                </div>
              </div>

              {/* Body receipt sheet */}
              <div className="flex-1 space-y-4 p-5">
                {/* Highlighted Amount Receipt Card */}
                <div className={`rounded-2xl border p-4 shadow-sm ${cfg.amountBoxCls}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#4b5a50]">
                        {cfg.amountLabel}
                      </p>
                      <p className={`mt-1 font-display text-3xl font-bold tracking-tight ${cfg.amountTextCls}`}>
                        {formatMoney(invoice.amount)}
                      </p>
                    </div>
                    {isPaid && (
                      <span className="rounded-lg border-2 border-[#1a5c3a] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1a5c3a]">
                        Acquitté
                      </span>
                    )}
                  </div>
                  {isPaid && invoice.paidAt && (
                    <p className="mt-2.5 border-t border-[#b7dfc4]/70 pt-2 text-xs font-medium text-[#14532d]">
                      Règlement validé le {formatDateLong(invoice.paidAt)} via {methodLabel}
                    </p>
                  )}
                </div>

                {/* Perforated-style Details Card */}
                <div className="rounded-2xl border border-[#e0e6e2] bg-white p-4 shadow-sm space-y-3.5">
                  <div className="border-b border-dashed border-[#d7dfd9] pb-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5f6f64]">
                      <FileText className="h-3.5 w-3.5 text-[#1a5c3a]" />
                      <span>Prestation réglée</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#1a1f1b]">
                      {invoice.label}
                    </p>
                    {invoice.request && (
                      <p className="mt-0.5 text-xs text-[#56635b]">
                        Mission : {invoice.request.title} ({invoice.request.tracking})
                      </p>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                    <div>
                      <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-[#6b7870]">
                        <UserIcon className="h-3 w-3" /> Client
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#1a1f1b]">{clientName}</dd>
                      {(clientEmail || clientCountry) && (
                        <dd className="mt-0.5 text-[11px] text-[#56635b] break-all">
                          {clientEmail || clientCountry}
                        </dd>
                      )}
                    </div>

                    <div>
                      <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-[#6b7870]">
                        <Hash className="h-3 w-3" /> Référence
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#1a1f1b]">
                        {invoice.request?.tracking || invNum}
                      </dd>
                    </div>

                    <div>
                      <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-[#6b7870]">
                        <Calendar className="h-3 w-3" /> Date d'émission
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#1a1f1b]">
                        {formatDateLong(invoice.createdAt)}
                      </dd>
                    </div>

                    <div>
                      <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-[#6b7870]">
                        <MethodIcon className="h-3 w-3" /> Moyen
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#1a1f1b]">{methodLabel}</dd>
                    </div>
                  </dl>
                </div>

                {/* Security / Official Notice */}
                <div className="flex items-start gap-2.5 rounded-2xl border border-[#e3e7e4] bg-white/80 p-3.5 text-xs text-[#56635b]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1a5c3a]" />
                  <p className="leading-relaxed">
                    {isPaid
                      ? 'Justificatif officiel KWABO Services. Ce reçu atteste du règlement complet de la prestation.'
                      : 'Document généré par KWABO Services. Aucune donnée bancaire n’est conservée sur la plateforme.'}
                  </p>
                </div>
              </div>

              {/* Sticky Footer Actions */}
              <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#e0e6e2] bg-white px-5 py-3.5">
                {invoice.status === 'due' && onPay && (
                  <button
                    type="button"
                    onClick={() => onPay(invoice)}
                    className="btn btn-gold btn-sm mr-auto"
                  >
                    Régler maintenant
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onPrint(invoice)}
                  className="btn btn-ghost btn-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>{isPaid ? 'Télécharger le reçu PDF' : 'Imprimer ou PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary btn-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          );
        })()}
      </aside>
    </>
  );
};

