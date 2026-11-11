import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { CategoryBreakdownCard } from '../common/CategoryBreakdownCard';
import { api } from '../../services/api';
import { Category } from '../../types';

interface KpiIndicator {
  key: string;
  label: string;
  current: number;
  targetM6: number;
  targetM12: number;
  progressM6: number;
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

export const AdminKpis: React.FC = () => {
  const { categories } = useApp();
  const [tableOpen, setTableOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [indicators, setIndicators] = useState<KpiIndicator[]>([]);
  const [monthsData, setMonthsData] = useState<MonthDatum[]>([]);
  const [averageInvoice, setAverageInvoice] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [catRows, setCatRows] = useState<CatRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<any>('/admin/kpis')
      .then((res) => {
        if (cancelled) return;
        const d = res?.data ?? res ?? {};
        const rawInd = Array.isArray(d.indicators) ? d.indicators : [];
        setIndicators(
          rawInd.map((ind: any) => ({
            key: String(ind.key ?? ind.label),
            label: String(ind.label ?? ''),
            current: Number(ind.current ?? 0),
            targetM6: Number(ind.target_m6 ?? 1),
            targetM12: Number(ind.target_m12 ?? 1),
            progressM6: Number(ind.progress_m6 ?? 0),
          }))
        );

        const rawRev = Array.isArray(d.revenue) ? d.revenue : [];
        setMonthsData(
          rawRev.map((m: any) => ({
            label: m.label || m.short || m.month || '',
            full: m.full || m.label || m.month || '',
            amount: Number(m.amount ?? m.total ?? m.value ?? 0),
          }))
        );

        setAverageInvoice(Number(d.average_invoice ?? 0));
        setTotalCollected(Number(d.total_collected ?? 0));

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

  const formatIndicatorVal = (key: string, val: number) => {
    if (key.includes('revenue') || key.includes('ca')) return formatMoney(val);
    if (key.includes('rating') || key.includes('note')) return val.toFixed(1).replace('.', ',');
    return String(val);
  };

  const maxRevenue = Math.max(1, ...monthsData.map(m => m.amount));

  return (
    <>
      {/* Objectifs M6 & M12 */}
      <section className="card">
        <h2>Objectifs à 6 et 12 mois</h2>
        {loading ? (
          <p className="muted">Chargement des indicateurs…</p>
        ) : (
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
                {indicators.map(k => {
                  const share = Math.min(
                    100,
                    k.progressM6 || (k.targetM6 > 0 ? Math.round((k.current / k.targetM6) * 100) : 0)
                  );
                  return (
                    <tr key={k.key}>
                      <td data-label="Indicateur">
                        <strong>{k.label}</strong>
                      </td>
                      <td data-label="Actuel">
                        <strong>{formatIndicatorVal(k.key, k.current)}</strong>
                      </td>
                      <td data-label="Objectif M6">{formatIndicatorVal(k.key, k.targetM6)}</td>
                      <td data-label="Objectif M12">{formatIndicatorVal(k.key, k.targetM12)}</td>
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
        )}
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
              <strong>{formatMoney(averageInvoice)}</strong>
              <span>Facture moyenne</span>
            </li>
            <li className="stat stat-green">
              <span className="tile tile-sm">
                <Icon name="banknotes" size={18} />
              </span>
              <strong>{formatMoney(totalCollected)}</strong>
              <span>Total encaissé</span>
            </li>
          </ul>

          <CategoryBreakdownCard
            title="Demandes par univers"
            rows={catRows}
            defaultView="chart"
          />
        </div>
      </div>
    </>
  );
};
