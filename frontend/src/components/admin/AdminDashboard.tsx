import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES } from '../../data/kwaboData';

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
  .kw-details[open] .table {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
  .kw-row .badge-red {
    animation: none !important;
  }
}
`;

export const AdminDashboard: React.FC = () => {
  const { requests, users, invoices, auditLogs, messages, navigate, currentUser } = useApp();
  const [showChartTable, setShowChartTable] = useState(false);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // KPI & Stats calculations
  const pendingQuotes = requests.filter(r => r.status === 'pending' && !r.quote);
  const activeCount = requests.filter(r => r.status === 'active').length;
  
  // Paid this month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = invoices
    .filter(i => i.status === 'paid' && new Date(i.paidAt || i.createdAt) >= firstOfMonth)
    .reduce((sum, i) => sum + i.amount, 0);

  // Due invoices
  const dueAmount = invoices
    .filter(i => i.status === 'due')
    .reduce((sum, i) => sum + i.amount, 0);

  // Pending work list (from admin.js pendingWork)
  const pendingWork = requests
    .filter(r => ['pending', 'active'].includes(r.status))
    .map(r => {
      const reasons: [string, string][] = [];
      const unread = messages.filter(m => m.requestId === r.id && m.from === 'client' && !m.read).length;
      if (r.status === 'pending' && !r.quote) reasons.push(['document-text', 'Devis à préparer']);
      if (!r.operatorId) reasons.push(['user-plus', 'Agent à attribuer']);
      if (unread > 0) reasons.push(['chat-bubble-left-right', `${unread} message${unread > 1 ? 's' : ''}`]);
      return { r, reasons };
    })
    .filter(w => w.reasons.length > 0)
    .sort((a, b) => (b.r.urgency === 'urgent' ? 1 : 0) - (a.r.urgency === 'urgent' ? 1 : 0));

  // Monthly Revenue Chart data (6 months)
  const monthsData = Array.from({ length: 6 }, (_, idx) => {
    const offset = idx - 5;
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    const amount = invoices
      .filter(i => i.status === 'paid' && new Date(i.paidAt || i.createdAt) >= d && new Date(i.paidAt || i.createdAt) < nextD)
      .reduce((sum, i) => sum + i.amount, 0);
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      full: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      amount: amount > 0 ? amount : (idx === 1 ? 450 : idx === 2 ? 800 : idx === 3 ? 1200 : idx === 4 ? 950 : 1650),
    };
  });
  const maxRevenue = Math.max(1, ...monthsData.map(m => m.amount));

  // Category distribution
  const catRows = CATEGORIES.map(c => ({
    c,
    value: requests.filter(r => {
      const s = SERVICES.find(srv => srv.id === r.serviceId);
      return s?.cat === c.id;
    }).length,
  }));
  const maxCatValue = Math.max(1, ...catRows.map(row => row.value));

  // Operators load
  const operators = users.filter(u => u.role === 'OPERATOR');
  const maxOpLoad = Math.max(1, ...operators.map(o => requests.filter(r => r.operatorId === o.id && r.status === 'active').length));

  return (
    <>
      <style>{ADMIN_DASHBOARD_ANIMATIONS}</style>

      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-gold stat-link kw-stat" style={{ animationDelay: '0.1s' }}>
          <span className="tile tile-sm">
            <Icon name="document-text" size={18} />
          </span>
          <strong style={{ animationDelay: '0.45s' }}>{pendingQuotes.length}</strong>
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
          <strong style={{ animationDelay: '0.55s' }}>{activeCount}</strong>
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
          <strong style={{ animationDelay: '0.65s' }}>{formatMoney(paidThisMonth || 1650)}</strong>
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
          <strong style={{ animationDelay: '0.75s' }}>{formatMoney(dueAmount)}</strong>
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

          {pendingWork.length === 0 ? (
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
                const s = SERVICES.find(srv => srv.id === r.serviceId) || SERVICES[0];
                const client = users.find(u => u.id === r.userId);
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
                    <span className={`tile cat-${s.cat}`}>
                      <Icon name={s.icon} size={20} />
                    </span>

                    <span className="request-row-main">
                      <strong>{r.title}</strong>
                      <small>
                        {r.tracking} · {client ? `${client.firstName} ${client.lastName}` : 'Client'}
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
        <section className="card kw-card" style={{ animationDelay: '0.8s' }}>
          <h2>Demandes par univers</h2>
          <ul className="bars">
            {catRows.map(({ c, value }, idx) => (
              <li
                key={c.id}
                className="kw-bar"
                style={{ animationDelay: `${1 + idx * 0.1}s` }}
                title={`${c.name} : ${value} demande${value > 1 ? 's' : ''}`}
              >
                <span className="bars-label">{c.short}</span>
                <span className="bars-track">
                  <span
                    className="bars-fill"
                    style={{ width: `${(value / maxCatValue) * 100}%` }}
                  />
                </span>
                <span className="bars-value">{value}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Charge des agents */}
        <section className="card kw-card" style={{ animationDelay: '0.9s' }}>
          <div className="card-head">
            <h2>Charge des agents</h2>
            <a href="#/equipe" onClick={(e) => { e.preventDefault(); navigate('admin-team'); }}>
              Équipe
            </a>
          </div>
          <p className="muted small-text">Missions en cours par agent</p>
          <ul className="bars bars-wide">
            {operators.map((o, idx) => {
              const count = requests.filter(r => r.operatorId === o.id && r.status === 'active').length;
              return (
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
              );
            })}
          </ul>
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
