import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { CategoryBreakdownCard } from '../common/CategoryBreakdownCard';
import { api } from '../../services/api';
import { mapAudit, mapRequest } from '../../services/mappers';
import { AuditLogItem, Category, RequestItem } from '../../types';

/* Palette des graphiques */
const CHART_COLORS = ['#1a5c38', '#d4a017', '#3f8f63', '#8a6d1d', '#6bb38a', '#b8860b', '#2f7a4f', '#e3c14f'];

/* Animations ajoutées (CSS uniquement, aucune logique modifiée) */
const ADMIN_DASHBOARD_ANIMATIONS = `
@keyframes kwFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwPopIn {
  0%   { opacity: 0; transform: scale(0.85); }
  70%  { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes kwSlideRight {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes kwGrowY {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
@keyframes kwGrowX {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes kwValueIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwUrgentPulse {
  0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
  70%  { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
@keyframes kwTimelineIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwDonutDraw {
  from { stroke-dasharray: 0 var(--circ); }
  to   { stroke-dasharray: var(--len) var(--circ); }
}
@keyframes kwChartSwap {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}

/* Statistiques */
.kw-stat {
  opacity: 0;
  animation: kwPopIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.kw-stat:hover {
  transform: translateY(-4px);
}
.kw-stat .tile {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.kw-stat:hover .tile {
  transform: scale(1.15) rotate(-6deg);
}
.kw-stat strong {
  display: inline-block;
  animation: kwValueIn 0.6s ease both;
}

/* Cartes */
.kw-card {
  opacity: 0;
  animation: kwFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.kw-card:hover {
  transform: translateY(-2px);
}

/* Lignes « à traiter » */
.kw-row {
  opacity: 0;
  animation: kwSlideRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.25s ease, background-color 0.25s ease;
}
.kw-row:hover {
  transform: translateX(4px);
}
.kw-row > svg:last-child {
  transition: transform 0.25s ease;
}
.kw-row:hover > svg:last-child {
  transform: translateX(4px);
}
.kw-row .badge-red {
  animation: kwUrgentPulse 1.8s ease-out infinite;
}

/* Histogramme vertical : les barres poussent depuis le bas */
.kw-vbar .vbar-fill {
  transform-origin: bottom;
  animation: kwGrowY 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: inherit;
  transition: filter 0.25s ease;
}
.kw-vbar:hover .vbar-fill,
.kw-vbar:focus .vbar-fill {
  filter: brightness(1.12);
}
.kw-vbar .vbar-value {
  animation: kwValueIn 0.5s ease both;
  animation-delay: inherit;
}
.kw-vbar .vbar-label {
  animation: kwValueIn 0.5s ease both;
  animation-delay: inherit;
}

/* Barres horizontales : elles s'étirent depuis la gauche */
.kw-bar .bars-fill {
  transform-origin: left;
  animation: kwGrowX 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: inherit;
}
.kw-bar {
  opacity: 0;
  animation: kwSlideRight 0.45s ease forwards;
  transition: transform 0.2s ease;
}
.kw-bar:hover {
  transform: translateX(3px);
}
.kw-bar .bars-value {
  animation: kwValueIn 0.5s ease both;
  animation-delay: inherit;
}

/* Timeline */
.kw-timeline-item {
  opacity: 0;
  animation: kwTimelineIn 0.5s ease forwards;
}

/* Tableau déroulant */
.kw-details[open] .table {
  animation: kwFadeUp 0.4s ease both;
}
.kw-details summary {
  transition: opacity 0.2s ease;
}
.kw-details summary:hover {
  opacity: 0.75;
}

/* Liens des stats */
.kw-stat a {
  transition: opacity 0.2s ease;
}
.kw-stat a:hover {
  opacity: 0.8;
}

/* Cartes de statistiques : une couleur par carte, texte blanc, sans soulignement */
.stats .kw-stat {
  position: relative;
  overflow: hidden;
  border: none !important;
  box-shadow: 0 8px 20px rgba(18, 63, 40, 0.25);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.stats .kw-stat::after {
  content: '';
  position: absolute;
  right: -28px;
  bottom: -34px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.stats .kw-stat:hover::after {
  transform: scale(1.35);
}
.stats .kw-stat,
.stats .kw-stat * {
  color: #ffffff !important;
}
.stats .kw-stat a,
.stats .kw-stat a:hover,
.stats .kw-stat a:focus {
  text-decoration: none !important;
}
.stats .kw-stat .tile {
  background: rgba(255, 255, 255, 0.2) !important;
}
.stats .kw-stat:hover {
  box-shadow: 0 14px 28px rgba(18, 63, 40, 0.35);
}

/* 1. Vert profond */
.stats .kw-stat:nth-child(1) {
  background: linear-gradient(135deg, #1a5c38 0%, #123f28 100%) !important;
}
/* 2. Vert franc */
.stats .kw-stat:nth-child(2) {
  background: linear-gradient(135deg, #3a8a5c 0%, #2a7048 100%) !important;
}
/* 3. Or foncé */
.stats .kw-stat:nth-child(3) {
  background: linear-gradient(135deg, #b8860b 0%, #8f6a08 100%) !important;
}
/* 4. Ardoise */
.stats .kw-stat:nth-child(4) {
  background: linear-gradient(135deg, #455a4f 0%, #2f4036 100%) !important;
}

/* Bouton « Voir le graphe » */
.kw-toggle-row {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 10px;
}
.kw-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  color: #1a5c38;
  background: rgba(26, 92, 56, 0.08);
  border: 1px solid rgba(26, 92, 56, 0.25);
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}
.kw-toggle-btn:hover {
  transform: translateY(-2px);
  background: #1a5c38;
  color: #fff;
  box-shadow: 0 4px 12px rgba(26, 92, 56, 0.25);
}
.kw-toggle-btn:active {
  transform: scale(0.96);
}
.kw-toggle-btn:focus-visible {
  outline: 2px solid #d4a017;
  outline-offset: 2px;
}

/* Graphiques SVG */
.kw-chart {
  animation: kwChartSwap 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.kw-donut-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.kw-donut {
  width: 150px;
  height: 150px;
  flex: none;
}
.kw-donut circle.kw-seg {
  animation: kwDonutDraw 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: opacity 0.2s ease, stroke-width 0.2s ease;
  cursor: pointer;
}
.kw-donut:hover circle.kw-seg {
  opacity: 0.55;
}
.kw-donut circle.kw-seg:hover {
  opacity: 1;
  stroke-width: 26;
}
.kw-donut-total {
  font-size: 22px;
  font-weight: 700;
  fill: currentColor;
}
.kw-donut-sub {
  font-size: 9px;
  opacity: 0.65;
  fill: currentColor;
}
.kw-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
}
.kw-legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: kwSlideRight 0.45s ease forwards;
}
.kw-legend .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}
.kw-legend strong {
  margin-left: auto;
  padding-left: 12px;
}
.kw-colchart {
  width: 100%;
  height: auto;
  max-height: 210px;
  display: block;
}
.kw-colchart rect.kw-col {
  transform-box: fill-box;
  transform-origin: bottom;
  animation: kwGrowY 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: filter 0.2s ease;
  cursor: pointer;
}
.kw-colchart rect.kw-col:hover {
  filter: brightness(1.15);
}
.kw-colchart text {
  fill: currentColor;
  font-size: 11px;
}
.kw-colchart text.kw-col-value {
  font-weight: 700;
  animation: kwValueIn 0.5s ease both;
}
.kw-chart-empty {
  text-align: center;
  padding: 16px 0;
  opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {
  .kw-stat,
  .kw-stat strong,
  .kw-card,
  .kw-row,
  .kw-bar,
  .kw-timeline-item,
  .kw-vbar .vbar-fill,
  .kw-vbar .vbar-value,
  .kw-vbar .vbar-label,
  .kw-bar .bars-fill,
  .kw-bar .bars-value,
  .kw-details[open] .table,
  .kw-chart,
  .kw-donut circle.kw-seg,
  .kw-legend li,
  .kw-colchart rect.kw-col,
  .kw-colchart text.kw-col-value {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
  .kw-row .badge-red {
    animation: none !important;
  }
}
`;

interface WorkItem {
  r: RequestItem;
  reasons: Array<[string, string]>;
}

interface MonthDatum {
  label: string;
  full: string;
  amount: number;
}

interface CatRow {
  c: Pick<Category, 'id' | 'name' | 'short'>;
  value: number;
}

interface OpLoadRow {
  o: { id: string; firstName: string; lastName: string };
  count: number;
}

function reasonIconFromCode(code: string): string {
  switch (code) {
    case 'quote':
    case 'needs_quote':
    case 'quote_missing':
      return 'document-text';
    case 'assign':
    case 'unassigned':
    case 'needs_operator':
      return 'user-plus';
    case 'messages':
    case 'unread_messages':
      return 'chat-bubble-left-right';
    default:
      return 'exclamation-circle';
  }
}

export const AdminDashboard: React.FC = () => {
  const { categories, services, navigate } = useApp();
  const [showChartTable, setShowChartTable] = useState(false);
  const [showOpChart, setShowOpChart] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    quotesToPrepare: 0,
    activeMissions: 0,
    revenueMonth: 0,
    awaitingPayment: 0,
  });
  const [pendingWork, setPendingWork] = useState<WorkItem[]>([]);
  const [monthsData, setMonthsData] = useState<MonthDatum[]>([]);
  const [catRows, setCatRows] = useState<CatRow[]>([]);
  const [opRows, setOpRows] = useState<OpLoadRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<any>('/admin/dashboard')
      .then((res) => {
        if (cancelled) return;
        const d = res?.data ?? res ?? {};
        const st = d.stats ?? {};
        setStats({
          quotesToPrepare: Number(st.quotes_to_prepare ?? 0),
          activeMissions: Number(st.active_missions ?? 0),
          revenueMonth: Number(st.revenue_month ?? 0),
          awaitingPayment: Number(st.awaiting_payment ?? 0),
        });

        const rawWork = Array.isArray(d.work) ? d.work : [];
        setPendingWork(
          rawWork.map((w: any) => {
            const req = mapRequest(w.request ?? w);
            const rawReasons = Array.isArray(w.reasons) ? w.reasons : [];
            const reasons: Array<[string, string]> = rawReasons.map((rs: any) => {
              if (Array.isArray(rs)) return [String(rs[0]), String(rs[1])];
              return [reasonIconFromCode(String(rs?.code ?? '')), String(rs?.label ?? rs?.code ?? '')];
            });
            return { r: req, reasons };
          })
        );

        const rawRev = Array.isArray(d.revenue) ? d.revenue : [];
        setMonthsData(
          rawRev.map((m: any) => ({
            label: m.label || m.short || m.month || '',
            full: m.full || m.label || m.month || '',
            amount: Number(m.amount ?? m.total ?? m.value ?? 0),
          }))
        );

        const rawCats = Array.isArray(d.by_category) ? d.by_category : [];
        if (rawCats.length > 0) {
          setCatRows(
            rawCats.map((item: any) => {
              const slug = String(item.slug ?? item.category ?? item.id ?? '');
              const matched = categories.find(c => c.id === slug || c.slug === slug);
              return {
                c: {
                  id: slug || matched?.id || String(item.name),
                  name: item.name || matched?.name || slug,
                  short: item.short || matched?.short || item.name || slug,
                },
                value: Number(item.count ?? item.value ?? item.total ?? 0),
              };
            })
          );
        } else {
          setCatRows(categories.map(c => ({ c, value: 0 })));
        }

        const rawOps = Array.isArray(d.operator_load) ? d.operator_load : [];
        setOpRows(
          rawOps.map((item: any) => {
            const op = item.operator ?? item;
            const fullName = String(op.full_name ?? op.name ?? `${op.first_name ?? ''} ${op.last_name ?? ''}`.trim());
            const parts = fullName.split(/\s+/);
            return {
              o: {
                id: String(op.id ?? fullName),
                firstName: op.first_name || parts[0] || fullName,
                lastName: op.last_name || parts.slice(1).join(' ') || '',
              },
              count: Number(item.count ?? item.active ?? item.active_count ?? item.missions ?? 0),
            };
          })
        );

        const rawActivity = Array.isArray(d.recent_activity) ? d.recent_activity : [];
        setAuditLogs(rawActivity.map(mapAudit));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categories]);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const maxRevenue = Math.max(1, ...monthsData.map(m => m.amount));
  const maxOpLoad = Math.max(1, ...opRows.map(o => o.count));

  // Données du graphique (colonnes des agents)

  const COL_W = 300;
  const COL_BASE = 150;
  const COL_MAX_H = 110;
  const colSlot = opRows.length > 0 ? Math.min(100, 280 / opRows.length) : 100;
  const colStart = (COL_W - colSlot * opRows.length) / 2;
  const colBarW = Math.min(40, colSlot * 0.55);

  return (
    <>
      <style>{ADMIN_DASHBOARD_ANIMATIONS}</style>

      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-gold stat-link kw-stat" style={{ animationDelay: '0.1s' }}>
          <span className="tile tile-sm">
            <Icon name="document-text" size={18} />
          </span>
          <strong style={{ animationDelay: '0.45s' }}>{stats.quotesToPrepare}</strong>
          <span>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('admin-requests'); }}>
              Devis à préparer
            </a>
          </span>
        </li>

        <li className="stat stat-green stat-link kw-stat" style={{ animationDelay: '0.2s' }}>
          <span className="tile tile-sm">
            <Icon name="bolt" size={18} />
          </span>
          <strong style={{ animationDelay: '0.55s' }}>{stats.activeMissions}</strong>
          <span>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('admin-requests'); }}>
              Missions en cours
            </a>
          </span>
        </li>

        <li className="stat stat-green stat-link kw-stat" style={{ animationDelay: '0.3s' }}>
          <span className="tile tile-sm">
            <Icon name="banknotes" size={18} />
          </span>
          <strong style={{ animationDelay: '0.65s' }}>{formatMoney(stats.revenueMonth)}</strong>
          <span>
            <a href="#/paiements" onClick={(e) => { e.preventDefault(); navigate('admin-invoices'); }}>
              Encaissé ce mois-ci
            </a>
          </span>
        </li>

        <li className="stat stat-gold stat-link kw-stat" style={{ animationDelay: '0.4s' }}>
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong style={{ animationDelay: '0.75s' }}>{formatMoney(stats.awaitingPayment)}</strong>
          <span>
            <a href="#/paiements" onClick={(e) => { e.preventDefault(); navigate('admin-invoices'); }}>
              En attente de paiement
            </a>
          </span>
        </li>
      </ul>

      {/* Main Dashboard Grid */}
      <div className="dash-grid">
        {/* À traiter en priorité */}
        <section className="card kw-card" style={{ animationDelay: '0.5s' }}>
          <div className="card-head">
            <h2>À traiter en priorité</h2>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('admin-requests'); }}>
              Toutes les demandes
            </a>
          </div>

          {loading ? (
            <p className="muted">Chargement…</p>
          ) : pendingWork.length === 0 ? (
            <div className="empty-state">
              <span className="tile tile-lg">
                <Icon name="check-circle" size={32} />
              </span>
              <h3>Tout est à jour</h3>
              <p className="muted">Aucune demande n'attend d'action administrative.</p>
            </div>
          ) : (
            <div className="request-list">
              {pendingWork.slice(0, 6).map(({ r, reasons }, rowIdx) => {
                const s = r.service || services.find(srv => srv.slug === r.serviceSlug || srv.id === r.serviceId);
                const clientName = r.client
                  ? (r.client.fullName || `${r.client.firstName} ${r.client.lastName}`.trim())
                  : 'Client';
                return (
                  <a
                    key={r.id}
                    className="work-row kw-row"
                    style={{ animationDelay: `${0.7 + rowIdx * 0.1}s` }}
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
                      <small>
                        {r.tracking} · {clientName}
                      </small>
                      <span className="reasons">
                        {r.urgency === 'urgent' && (
                          <span className="badge badge-red">
                            <Icon name="bolt" size={14} />
                            Urgent
                          </span>
                        )}
                        {reasons.map(([ic, text], idx) => (
                          <span key={idx} className="badge badge-gold">
                            <Icon name={ic} size={14} />
                            {text}
                          </span>
                        ))}
                      </span>
                    </span>

                    <Icon name="chevron-right" size={18} />
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* Encaissements (vchart) */}
        <section className="card kw-card" style={{ animationDelay: '0.6s' }}>
          <div className="card-head">
            <h2>Encaissements</h2>
            <a href="#/indicateurs" onClick={(e) => { e.preventDefault(); navigate('admin-kpis'); }}>
              Indicateurs
            </a>
          </div>

          <figure className="vchart">
            <figcaption className="sr-only">Chiffre d'affaires encaissé par mois</figcaption>
            <ul className="vbars">
              {monthsData.map((m, idx) => (
                <li
                  key={idx}
                  className="vbar kw-vbar"
                  style={{ animationDelay: `${0.9 + idx * 0.12}s` }}
                  tabIndex={0}
                  data-tip={`${m.full} : ${formatMoney(m.amount)}`}
                >
                  <span className="vbar-value">
                    {m.amount ? formatMoney(m.amount) : '0 €'}
                  </span>
                  <span className="vbar-track">
                    <span
                      className="vbar-fill"
                      style={{ height: `${(m.amount / maxRevenue) * 100}%` }}
                    />
                  </span>
                  <span className="vbar-label">{m.label}</span>
                </li>
              ))}
            </ul>
          </figure>

          <details className="chart-table kw-details" open={showChartTable} onToggle={(e) => setShowChartTable((e.target as HTMLDetailsElement).open)}>
            <summary>Voir en tableau</summary>
            <table className="table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Encaissé</th>
                </tr>
              </thead>
              <tbody>
                {monthsData.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.full}</td>
                    <td>{formatMoney(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      </div>

      {/* Grid 3 Columns */}
      <div className="grid-3">
        {/* Demandes par univers */}
        <CategoryBreakdownCard
          title="Demandes par univers"
          rows={catRows}
          defaultView="bars"
          className="kw-card"
          style={{ animationDelay: '0.8s' }}
        />

        {/* Charge des agents */}
        <section className="card kw-card" style={{ animationDelay: '0.9s' }}>
          <div className="card-head">
            <h2>Charge des agents</h2>
            <a href="#/equipe" onClick={(e) => { e.preventDefault(); navigate('admin-team'); }}>
              Équipe
            </a>
          </div>
          <p className="muted small-text">Missions en cours par agent</p>

          <div className="kw-toggle-row">
            <button
              type="button"
              className="kw-toggle-btn"
              aria-pressed={showOpChart}
              onClick={() => setShowOpChart(v => !v)}
            >
              <Icon name={showOpChart ? 'squares-2x2' : 'chart-bar'} size={16} />
              <span>{showOpChart ? 'Voir les barres' : 'Voir le graphe'}</span>
            </button>
          </div>

          {showOpChart ? (
            <div className="kw-chart">
              {opRows.length === 0 ? (
                <p className="muted kw-chart-empty">Aucun agent à représenter pour le moment.</p>
              ) : (
                <svg
                  className="kw-colchart"
                  viewBox={`0 0 ${COL_W} 190`}
                  role="img"
                  aria-label="Missions en cours par agent"
                >
                  <line x1="10" y1={COL_BASE} x2={COL_W - 10} y2={COL_BASE} stroke="currentColor" strokeOpacity="0.2" />
                  {opRows.map(({ o, count }, idx) => {
                    const h = (count / maxOpLoad) * COL_MAX_H;
                    const x = colStart + idx * colSlot + (colSlot - colBarW) / 2;
                    const cx = colStart + idx * colSlot + colSlot / 2;
                    const color = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <g key={o.id}>
                        <rect
                          className="kw-col"
                          x={x}
                          y={COL_BASE - h}
                          width={colBarW}
                          height={h}
                          rx="6"
                          fill={color}
                          style={{ animationDelay: `${idx * 0.12}s` }}
                        >
                          <title>{`${o.firstName} ${o.lastName} : ${count} en cours`}</title>
                        </rect>
                        <text
                          className="kw-col-value"
                          x={cx}
                          y={COL_BASE - h - 6}
                          textAnchor="middle"
                          style={{ animationDelay: `${0.5 + idx * 0.12}s` }}
                        >
                          {count}
                        </text>
                        <text x={cx} y={COL_BASE + 16} textAnchor="middle">{o.firstName}</text>
                        <text x={cx} y={COL_BASE + 30} textAnchor="middle" fillOpacity="0.65">{o.lastName}</text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          ) : (
            <ul className="bars bars-wide">
              {opRows.map(({ o, count }, idx) => (
                <li
                  key={o.id}
                  className="kw-bar"
                  style={{ animationDelay: `${1.1 + idx * 0.1}s` }}
                  title={`${o.firstName} ${o.lastName} : ${count} en cours`}
                >
                  <span className="bars-label">{o.firstName} {o.lastName}</span>
                  <span className="bars-track">
                    <span
                      className="bars-fill"
                      style={{ width: `${(count / maxOpLoad) * 100}%` }}
                    />
                  </span>
                  <span className="bars-value">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activité récente (timeline) */}
        <section className="card kw-card" style={{ animationDelay: '1s' }}>
          <div className="card-head">
            <h2>Activité récente</h2>
            <a href="#/journal" onClick={(e) => { e.preventDefault(); navigate('admin-audit'); }}>
              Journal
            </a>
          </div>
          <ol className="timeline">
            {auditLogs.slice(0, 4).map((j, idx) => (
              <li
                key={j.id}
                className="kw-timeline-item"
                style={{ animationDelay: `${1.2 + idx * 0.15}s` }}
              >
                <strong>{j.text}</strong>
                <small>{j.actor} · {formatDateTime(j.at)}</small>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
};
