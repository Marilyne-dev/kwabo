import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';

export const AdminReferrals: React.FC = () => {
  const { referrals, users, navigate } = useApp();

  const rows = Object.entries(referrals).map(([id, refs]) => {
    const user = users.find(u => u.id === id);
    return { user, referrals: refs };
  }).filter(row => row.user !== undefined) as Array<{ user: typeof users[0]; referrals: typeof referrals[string] }>;

  const active = rows.reduce((total, row) => total + row.referrals.filter(r => r.status === 'Actif').length, 0);
  const total = rows.reduce((count, row) => count + row.referrals.length, 0);
  const example = 10;

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
          <strong>{rows.length}</strong>
          <span>Parrains</span>
        </li>
        <li className="stat stat-neutral">
          <span className="tile tile-sm">
            <Icon name="user-plus" size={18} />
          </span>
          <strong>{total}</strong>
          <span>Filleuls</span>
        </li>
        <li className="stat stat-green">
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong>{active}</strong>
          <span>Filleuls convertis</span>
        </li>
        <li className="stat stat-gold">
          <span className="tile tile-sm">
            <Icon name="gift" size={18} />
          </span>
          <strong>{formatMoney(active * example)}</strong>
          <span>Récompenses</span>
        </li>
      </ul>

     

      <section className="card">
        {rows.length === 0 ? (
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
                {rows.map(({ user, referrals }) => {
                  const converted = referrals.filter(r => r.status === 'Actif').length;
                  return (
                    <tr key={user.id}>
                      <td data-label="Parrain">
                        <button
                          type="button"
                          className="table-link font-bold text-left border-0 bg-transparent cursor-pointer p-0 hover:underline"
                          onClick={() => navigate('admin-clients')}
                        >
                          {user.firstName} {user.lastName}
                        </button>
                      </td>
                      <td data-label="Code">
                        <span className="badge badge-neutral">{user.referralCode}</span>
                      </td>
                      <td data-label="Filleuls">
                        {referrals.map(r => `${r.name} (${r.status})`).join(', ')}
                      </td>
                      <td data-label="Convertis">
                        <strong>{converted}</strong>
                      </td>
                      <td data-label="Récompense">
                        <strong>{formatMoney(converted * example)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};

