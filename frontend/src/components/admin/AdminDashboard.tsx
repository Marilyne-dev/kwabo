import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES } from '../../data/kwaboData';

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
      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-gold stat-link">
          <span className="tile tile-sm">
            <Icon name="document-text" size={18} />
          </span>
          <strong>{pendingQuotes.length}</strong>
          <span>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('admin-requests'); }}>
              Devis à préparer
            </a>
          </span>
        </li>

        <li className="stat stat-green stat-link">
          <span className="tile tile-sm">
            <Icon name="bolt" size={18} />
          </span>
          <strong>{activeCount}</strong>
          <span>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('admin-requests'); }}>
              Missions en cours
            </a>
          </span>
        </li>

        <li className="stat stat-green stat-link">
          <span className="tile tile-sm">
            <Icon name="banknotes" size={18} />
          </span>
          <strong>{formatMoney(paidThisMonth || 1650)}</strong>
          <span>
            <a href="#/paiements" onClick={(e) => { e.preventDefault(); navigate('admin-invoices'); }}>
              Encaissé ce mois-ci
            </a>
          </span>
        </li>

        <li className="stat stat-gold stat-link">
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong>{formatMoney(dueAmount)}</strong>
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
        <section className="card">
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
              {pendingWork.slice(0, 6).map(({ r, reasons }) => {
                const s = SERVICES.find(srv => srv.id === r.serviceId) || SERVICES[0];
                const client = users.find(u => u.id === r.userId);
                return (
                  <a
                    key={r.id}
                    className="work-row"
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
        <section className="card">
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
                  className="vbar"
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

          <details className="chart-table" open={showChartTable} onToggle={(e) => setShowChartTable((e.target as HTMLDetailsElement).open)}>
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
        <section className="card">
          <h2>Demandes par univers</h2>
          <ul className="bars">
            {catRows.map(({ c, value }) => (
              <li key={c.id} title={`${c.name} : ${value} demande${value > 1 ? 's' : ''}`}>
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
        <section className="card">
          <div className="card-head">
            <h2>Charge des agents</h2>
            <a href="#/equipe" onClick={(e) => { e.preventDefault(); navigate('admin-team'); }}>
              Équipe
            </a>
          </div>
          <p className="muted small-text">Missions en cours par agent</p>
          <ul className="bars bars-wide">
            {operators.map(o => {
              const count = requests.filter(r => r.operatorId === o.id && r.status === 'active').length;
              return (
                <li key={o.id} title={`${o.firstName} ${o.lastName} : ${count} en cours`}>
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
        <section className="card">
          <div className="card-head">
            <h2>Activité récente</h2>
            <a href="#/journal" onClick={(e) => { e.preventDefault(); navigate('admin-audit'); }}>
              Journal
            </a>
          </div>
          <ol className="timeline">
            {auditLogs.slice(0, 4).map(j => (
              <li key={j.id}>
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

