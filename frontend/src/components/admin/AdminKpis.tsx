import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES } from '../../data/kwaboData';

export const AdminKpis: React.FC = () => {
  const { requests, users, invoices, reviews } = useApp();
  const [tableOpen, setTableOpen] = useState(false);

  const clients = users.filter(u => u.role === 'USER');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const sumPaid = paidInvoices.reduce((acc, i) => acc + i.amount, 0);
  const average = paidInvoices.length ? Math.round(sumPaid / paidInvoices.length) : 0;

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const ratings = reviews.map(r => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.8;

  const KPI_TARGETS = [
    { key: 'accounts', label: 'Comptes créés', actual: clients.length, m6: 150, m12: 500, format: (v: number) => String(v), formatM: (v: number) => String(v) },
    { key: 'payers', label: 'Clients actifs payants', actual: new Set(paidInvoices.map(i => i.userId)).size, m6: 12, m12: 40, format: (v: number) => String(v), formatM: (v: number) => String(v) },
    { key: 'requests', label: 'Demandes de service', actual: requests.length, m6: 50, m12: 200, format: (v: number) => String(v), formatM: (v: number) => String(v) },
    { key: 'revenue', label: 'CA mensuel net', actual: 1650, m6: 500, m12: 1500, format: (v: number) => formatMoney(v), formatM: (v: number) => formatMoney(v) },
    { key: 'rating', label: 'Note de satisfaction (sur 5)', actual: avgRating, m6: 4.2, m12: 4.5, format: (v: number) => v.toFixed(1).replace('.', ','), formatM: (v: number) => v.toFixed(1).replace('.', ',') },
  ];

  // 6 months chart
  const now = new Date();
  const monthsData = Array.from({ length: 6 }, (_, idx) => {
    const offset = idx - 5;
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const amounts = [450, 750, 1100, 950, 1400, 1650];
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      full: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      amount: amounts[idx],
    };
  });
  const maxRevenue = Math.max(1, ...monthsData.map(m => m.amount));

  // Categories distribution
  const catRows = CATEGORIES.map(c => ({
    c,
    value: requests.filter(r => {
      const s = SERVICES.find(srv => srv.id === r.serviceId);
      return s?.cat === c.id;
    }).length,
  }));
  const maxCatValue = Math.max(1, ...catRows.map(row => row.value));

  return (
    <>
     

      {/* Objectifs M6 & M12 */}
      <section className="card">
        <h2>Objectifs à 6 et 12 mois</h2>
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th>Actuel</th>
                <th>Objectif M6</th>
                <th>Objectif M12</th>
                <th>Progression vers M6</th>
              </tr>
            </thead>
            <tbody>
              {KPI_TARGETS.map(k => {
                const share = Math.min(100, Math.round((Number(k.actual) / k.m6) * 100));
                return (
                  <tr key={k.key}>
                    <td data-label="Indicateur">
                      <strong>{k.label}</strong>
                    </td>
                    <td data-label="Actuel">
                      <strong>{k.format(Number(k.actual))}</strong>
                    </td>
                    <td data-label="Objectif M6">{k.formatM(k.m6)}</td>
                    <td data-label="Objectif M12">{k.formatM(k.m12)}</td>
                    <td data-label="Progression">
                      <span className="meter" role="img" aria-label={`${share} % de l'objectif à 6 mois`}>
                        <span className="bars-track">
                          <span className="bars-fill" style={{ width: `${share}%` }} />
                        </span>
                        <span>{share} %</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dash Grid Even: Revenue chart & Category bars */}
      <div className="dash-grid dash-grid-even">
        <section className="card">
          <h2>Encaissements sur 6 mois</h2>
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
                  <span className="vbar-value">{formatMoney(m.amount)}</span>
                  <span className="vbar-track">
                    <span className="vbar-fill" style={{ height: `${(m.amount / maxRevenue) * 100}%` }} />
                  </span>
                  <span className="vbar-label">{m.label}</span>
                </li>
              ))}
            </ul>
          </figure>

          {/* Tableau détail "Voir en tableau" */}
          <details
            className="chart-table"
            open={tableOpen}
            onToggle={(e) => setTableOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary>
              {tableOpen ? '▲' : '▼'} Voir en tableau
            </summary>
            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Encaissé</th>
                </tr>
              </thead>
              <tbody>
                {monthsData.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--green)', fontWeight: 500 }}>{m.full}</td>
                    <td>{formatMoney(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <div className="stack">
          <ul className="stats stats-2">
            <li className="stat stat-neutral">
              <span className="tile tile-sm">
                <Icon name="receipt-percent" size={18} />
              </span>
              <strong>{formatMoney(average)}</strong>
              <span>Facture moyenne</span>
            </li>
            <li className="stat stat-green">
              <span className="tile tile-sm">
                <Icon name="banknotes" size={18} />
              </span>
              <strong>{formatMoney(sumPaid)}</strong>
              <span>Total encaissé</span>
            </li>
          </ul>

          <section className="card">
            <h2>Demandes par univers</h2>
            <ul className="bars">
              {catRows.map(({ c, value }) => (
                <li key={c.id} title={`${c.name} : ${value} demande${value > 1 ? 's' : ''}`}>
                  <span className="bars-label">{c.short}</span>
                  <span className="bars-track">
                    <span className="bars-fill" style={{ width: `${(value / maxCatValue) * 100}%` }} />
                  </span>
                  <span className="bars-value">{value}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
};
