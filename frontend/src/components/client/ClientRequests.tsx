import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus } from '../../types';
import { Icon } from '../common/Icon';
import { SERVICES } from '../../data/kwaboData';

export const ClientRequests: React.FC = () => {
  const { currentUser, requests, navigate } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const userRequests = requests.filter(r => r.userId === currentUser?.id);

  const filtered = userRequests.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = !search.trim() || 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tracking.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-green">En cours</span>;
      case 'pending':
        return <span className="badge badge-gold">En attente</span>;
      case 'done':
        return <span className="badge badge-neutral">Terminée</span>;
      case 'cancelled':
        return <span className="badge badge-red">Annulée</span>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="toolbar no-print">
        <div className="search-field">
          <Icon name="magnifying-glass" size={18} />
          <input
            id="requests-q"
            type="search"
            placeholder="Rechercher par titre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-ghost" 
          type="button" 
          onClick={handlePrint}
        >
          <Icon name="printer" size={18} />
          <span>Exporter en PDF</span>
        </button>
      </div>

      <div className="chips no-print" role="group" aria-label="Filtrer par statut">
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        >
          Toutes <span className="chip-count">{userRequests.length}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'pending'}
          onClick={() => setFilterStatus('pending')}
        >
          En attente <span className="chip-count">{userRequests.filter(r => r.status === 'pending').length}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'active'}
          onClick={() => setFilterStatus('active')}
        >
          En cours <span className="chip-count">{userRequests.filter(r => r.status === 'active').length}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'done'}
          onClick={() => setFilterStatus('done')}
        >
          Terminées <span className="chip-count">{userRequests.filter(r => r.status === 'done').length}</span>
        </button>
        <button
          className="chip"
          type="button"
          aria-pressed={filterStatus === 'cancelled'}
          onClick={() => setFilterStatus('cancelled')}
        >
          Annulées <span className="chip-count">{userRequests.filter(r => r.status === 'cancelled').length}</span>
        </button>
      </div>

      <section className="card" id="requests-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg tile-muted">
              <Icon name="magnifying-glass" size={32} />
            </span>
            <h3>Aucune demande trouvée</h3>
            <p className="muted">Changez votre recherche ou le filtre de statut.</p>
            <button 
              className="btn btn-primary" 
              type="button"
              onClick={() => navigate('client-new-request')}
            >
              Faire une demande
            </button>
          </div>
        ) : (
          <div className="request-list">
            {filtered.map(r => {
              const s = SERVICES.find(serv => serv.id === r.serviceId) || SERVICES[0];
              return (
                <div
                  key={r.id}
                  className="request-row cursor-pointer"
                  onClick={() => navigate('client-request-detail', r.id)}
                >
                  <span className={`tile cat-${s.cat}`}>
                    <Icon name={s.icon} size={20} />
                  </span>
                  <span className="request-row-main">
                    <strong>{r.title}</strong>
                    <small>{r.tracking} · {r.city} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</small>
                  </span>
                  <span className="request-row-side">
                    {r.urgency === 'urgent' && (
                      <span className="badge badge-red">
                        <Icon name="bolt" size={14} /> Urgent
                      </span>
                    )}
                    {getStatusBadge(r.status)}
                    <Icon name="chevron-right" size={18} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
