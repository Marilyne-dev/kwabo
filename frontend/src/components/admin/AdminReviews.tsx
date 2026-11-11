import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { api, ApiError } from '../../services/api';
import { mapReview } from '../../services/mappers';
import { ReviewItem } from '../../types';

export const AdminReviews: React.FC = () => {
  const { addToast, navigate, refreshCounters } = useApp();
  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'hidden'>('pending');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [tabCounts, setTabCounts] = useState({ pending: 0, published: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>('/admin/reviews', {
        params: { status: activeTab },
      });
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReviews(raw.map(mapReview));
      if (res?.meta?.counts) {
        setTabCounts({
          pending: Number(res.meta.counts.pending ?? 0),
          published: Number(res.meta.counts.published ?? 0),
          hidden: Number(res.meta.counts.hidden ?? 0),
        });
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleModerate = async (id: string, status: 'published' | 'hidden') => {
    try {
      await api(`/admin/reviews/${id}`, {
        method: 'PATCH',
        body: { status },
      });
      addToast(
        status === 'published' ? 'Avis publié sur la vitrine publique.' : 'Avis masqué.',
        'success'
      );
      await Promise.all([loadReviews(), refreshCounters()]);
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Erreur lors de la modération.', 'error');
    }
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
        {loading ? (
          <div className="empty-state">
            <p className="muted">Chargement des avis…</p>
          </div>
        ) : reviews.length === 0 ? (
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
            {reviews.map(a => {
              const clientName = a.client
                ? a.client.fullName || `${a.client.firstName} ${a.client.lastName}`.trim()
                : 'Client';
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
                    {clientName}
                    {a.request && (
                      <>
                        {' · '}
                        <a
                          href={`#/demandes/${a.request.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('admin-request-detail', a.request!.id);
                          }}
                        >
                          {a.request.title}
                        </a>
                      </>
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
