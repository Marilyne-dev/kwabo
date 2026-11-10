import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';

export const AdminReviews: React.FC = () => {
  const { reviews, users, requests, moderateReview, addToast, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'hidden'>('pending');

  const ratings = reviews.map(r => r.rating);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1).replace('.', ',') : '–';

  const tabCounts = {
    pending: reviews.filter(r => r.status === 'pending').length,
    published: reviews.filter(r => r.status === 'published').length,
    hidden: reviews.filter(r => r.status === 'hidden').length,
  };

  const currentList = reviews.filter(r => r.status === activeTab);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleModerate = (id: string, status: 'published' | 'hidden') => {
    moderateReview(id, status);
    addToast(status === 'published' ? 'Avis publié sur la vitrine publique.' : 'Avis masqué.');
  };

  return (
    <>
      <div className="chips" role="group" aria-label="Filtrer les avis">
        {(['pending', 'published', 'hidden'] as const).map(tabKey => (
          <button
            key={tabKey}
            className="chip"
            type="button"
            aria-pressed={activeTab === tabKey}
            onClick={() => setActiveTab(tabKey)}
          >
            <span>{tabKey === 'pending' ? 'À modérer' : tabKey === 'published' ? 'Publiés' : 'Masqués'}</span>
            <span className="chip-count">{tabCounts[tabKey]}</span>
          </button>
        ))}
      </div>

      <div id="reviews-list">
        {currentList.length === 0 ? (
          <div className="empty-state">
            <span className="tile tile-lg">
              <Icon name="star" size={32} />
            </span>
            <h3>Aucun avis ici</h3>
            <p className="muted">
              {activeTab === 'pending' ? 'Tous les avis ont été modérés.' : 'Les avis apparaîtront ici après modération.'}
            </p>
          </div>
        ) : (
          <ul className="review-list">
            {currentList.map(a => {
              const client = users.find(u => u.id === a.userId);
              const r = requests.find(req => req.id === a.requestId);

              return (
                <li key={a.id} className="card">
                  <div className="review-head">
                    <span className="stars-read" role="img" aria-label={`${a.rating} sur 5`}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={n <= a.rating ? 'is-on' : ''}>
                          <Icon name="star" size={18} />
                        </span>
                      ))}
                    </span>
                    <small className="muted">{formatDate(a.at)}</small>
                  </div>

                  <p className="review-text">
                    {a.comment ? a.comment : <span className="muted">Pas de commentaire.</span>}
                  </p>

                  <p className="muted small-text">
                    {client ? `${client.firstName} ${client.lastName}` : 'Client'} · {r && (
                      <a
                        href={`#/demandes/${r.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('admin-request-detail', r.id);
                        }}
                      >
                        {r.title}
                      </a>
                    )}
                  </p>

                  <div className="btn-row">
                    {a.status !== 'published' && (
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => handleModerate(a.id, 'published')}
                      >
                        <Icon name="check" size={16} />
                        <span>Publier</span>
                      </button>
                    )}
                    {a.status !== 'hidden' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => handleModerate(a.id, 'hidden')}
                      >
                        <Icon name="eye-slash" size={16} />
                        <span>Masquer</span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};
