import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { api } from '../../services/api';

interface AdminReferralRow {
  sponsorId: string;
  sponsorName: string;
  code: string;
  referrals: Array<{ name: string; status: string }>;
  convertedCount: number;
  rewardAmount: number;
}

export const AdminReferrals: React.FC = () => {
  const { setActiveClientId, navigate } = useApp();
  const [rows, setRows] = useState<AdminReferralRow[]>([]);
  const [totals, setTotals] = useState({ sponsors: 0, referrals: 0, converted: 0, rewards: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<any>('/admin/referrals')
      .then((res) => {
        if (cancelled) return;
        const d = res?.data ?? res ?? {};
        const list = Array.isArray(d)
          ? d
          : Array.isArray(d.sponsors)
          ? d.sponsors
          : Array.isArray(d.referrals)
          ? d.referrals
          : Array.isArray(d.rows)
          ? d.rows
          : [];

        const mapped: AdminReferralRow[] = list.map((item: any) => {
          const sp = item.sponsor ?? item.user ?? item;
          const refs = Array.isArray(item.referrals ?? item.filleuls) ? (item.referrals ?? item.filleuls) : [];
          const normalizedRefs = refs.map((r: any) => ({
            name: String(r.name ?? r.full_name ?? 'Filleul'),
            status: String(r.status ?? 'Inscrit'),
          }));
          const converted = Number(
            item.converted ??
              item.converted_count ??
              item.active ??
              normalizedRefs.filter((r: { status: string }) => r.status === 'Actif').length
          );
          return {
            sponsorId: String(sp.id ?? item.sponsor_id ?? item.id ?? ''),
            sponsorName: String(
              sp.full_name ??
                sp.name ??
                `${sp.first_name ?? ''} ${sp.last_name ?? ''}`.trim() ??
                'Parrain'
            ),
            code: String(sp.referral_code ?? item.code ?? item.referral_code ?? ''),
            referrals: normalizedRefs,
            convertedCount: converted,
            rewardAmount: Number(item.reward ?? item.rewards ?? converted * 10),
          };
        });

        setRows(mapped);
        const st = d.stats ?? res?.meta ?? {};
        const refSum = mapped.reduce((s, r) => s + r.referrals.length, 0);
        const convSum = mapped.reduce((s, r) => s + r.convertedCount, 0);
        const rewSum = mapped.reduce((s, r) => s + r.rewardAmount, 0);
        setTotals({
          sponsors: Number(st.sponsors ?? mapped.length),
          referrals: Number(st.referrals ?? refSum),
          converted: Number(st.converted ?? st.active ?? convSum),
          rewards: Number(st.rewards ?? rewSum),
        });
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  return (
    <>
      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="user-group" size={18} />
          </span>
          <strong>{totals.sponsors}</strong>
          <span>Parrains</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="user-plus" size={18} />
          </span>
          <strong>{totals.referrals}</strong>
          <span>Filleuls</span>
        </li>
        <li className="stat stat-green">
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong>{totals.converted}</strong>
          <span>Filleuls convertis</span>
        </li>
        <li className="stat stat-gold">
          <span className="tile tile-sm">
            <Icon name="gift" size={18} />
          </span>
          <strong>{formatMoney(totals.rewards)}</strong>
          <span>Récompenses</span>
        </li>
      </ul>

      <section className="card">
        {loading ? (
          <div className="empty-state">
            <p className="muted">Chargement des parrainages…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg tile-muted">
              <Icon name="gift" size={32} />
            </span>
            <h3>Aucun parrainage</h3>
            <p className="muted">Les parrainages apparaîtront ici.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table table-cards">
              <thead>
                <tr>
                  <th>Parrain</th>
                  <th>Code</th>
                  <th>Filleuls</th>
                  <th>Convertis</th>
                  <th>Récompense</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.sponsorId || row.code}>
                    <td data-label="Parrain">
                      <button
                        type="button"
                        className="table-link font-bold text-left border-0 bg-transparent cursor-pointer p-0 hover:underline"
                        onClick={() => {
                          if (row.sponsorId) setActiveClientId(row.sponsorId);
                          navigate('admin-clients');
                        }}
                      >
                        {row.sponsorName}
                      </button>
                    </td>
                    <td data-label="Code">
                      <span className="badge badge-neutral">{row.code}</span>
                    </td>
                    <td data-label="Filleuls">
                      {row.referrals.length > 0
                        ? row.referrals.map(r => `${r.name} (${r.status})`).join(', ')
                        : '—'}
                    </td>
                    <td data-label="Convertis">
                      <strong>{row.convertedCount}</strong>
                    </td>
                    <td data-label="Récompense">
                      <strong>{formatMoney(row.rewardAmount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};
