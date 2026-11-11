import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { CategoryBreakdownCard, CategoryBreakdownRow } from '../common/CategoryBreakdownCard';
import { DOC_TYPE_META } from '../../data/kwaboData';
import { api } from '../../services/api';
import { mapDocument, mapRequest } from '../../services/mappers';
import { DocumentItem, RequestItem } from '../../types';

/* Animations ajoutées (CSS uniquement, aucune logique modifiée) */
const OPERATOR_DASHBOARD_ANIMATIONS = `
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
@keyframes kwValueIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwUrgentPulse {
  0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
  70%  { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
@keyframes kwEmptyFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
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

/* Cartes */
.kw-card {
  opacity: 0;
  animation: kwFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.kw-card:hover {
  transform: translateY(-2px);
}

/* Lignes « À faire » */
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

/* État vide */
.kw-card .empty-state .tile-lg {
  animation: kwEmptyFloat 3s ease-in-out infinite;
}

/* Documents */
.kw-item {
  opacity: 0;
  animation: kwSlideRight 0.45s ease forwards;
}
.kw-item .icon-btn {
  transition: transform 0.2s ease;
}
.kw-item .icon-btn:hover {
  transform: scale(1.18);
}

/* Liens */
.kw-card .card-head a {
  transition: opacity 0.2s ease;
}
.kw-card .card-head a:hover {
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .kw-stat,
  .kw-stat strong,
  .kw-card,
  .kw-row,
  .kw-item {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
  .kw-row .badge-red,
  .kw-card .empty-state .tile-lg {
    animation: none !important;
  }
}
`;

interface OperatorWorkItem {
  r: RequestItem;
  reasons: Array<[string, string]>;
}

function reasonIconFromCode(code: string): string {
  switch (code) {
    case 'messages':
    case 'unread_messages':
      return 'chat-bubble-left-right';
    case 'report':
    case 'needs_report':
    default:
      return 'document-text';
  }
}

export const OperatorDashboard: React.FC = () => {
  const { categories, services, navigate, openPhotoModal, downloadDocument } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ assigned: 0, pending: 0, active: 0, done: 0 });
  const [pendingWork, setPendingWork] = useState<OperatorWorkItem[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [catRows, setCatRows] = useState<CategoryBreakdownRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<any>('/admin/dashboard')
      .then(async (res) => {
        if (cancelled) return;
        const d = res?.data ?? res ?? {};
        const st = d.stats ?? {};
        setStats({
          assigned: Number(st.assigned ?? 0),
          pending: Number(st.pending ?? 0),
          active: Number(st.active ?? 0),
          done: Number(st.done ?? 0),
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

        const rawDocs = Array.isArray(d.recent_documents) ? d.recent_documents : [];
        setDocs(rawDocs.map((doc: any) => mapDocument(doc)));

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
          // Fallback: compute category breakdown from assigned requests if API omitted by_category
          const reqRes = await api<any>('/admin/requests', { params: { per_page: 200 } }).catch(() => null);
          if (cancelled) return;
          const reqList = Array.isArray(reqRes?.data)
            ? reqRes.data.map(mapRequest)
            : rawWork.map((w: any) => mapRequest(w.request ?? w));
          setCatRows(
            categories.map((c) => {
              const value = reqList.filter((req: RequestItem) => {
                const srv = req.service || services.find(s => s.slug === req.serviceSlug || s.id === req.serviceId);
                return (srv?.cat || '') === c.id;
              }).length;
              return { c: { id: c.id, name: c.name, short: c.short }, value };
            })
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categories, services]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <style>{OPERATOR_DASHBOARD_ANIMATIONS}</style>

      {/* 4 Stats Cards */}
      <ul className="stats stats-4">
        <li className="stat stat-neutral kw-stat" style={{ animationDelay: '0.1s' }}>
          <span className="tile tile-sm">
            <Icon name="clipboard-document-list" size={18} />
          </span>
          <strong style={{ animationDelay: '0.45s' }}>{stats.assigned}</strong>
          <span>Missions attribuées</span>
        </li>
        <li className="stat stat-gold kw-stat" style={{ animationDelay: '0.2s' }}>
          <span className="tile tile-sm">
            <Icon name="clock" size={18} />
          </span>
          <strong style={{ animationDelay: '0.55s' }}>{stats.pending}</strong>
          <span>En attente</span>
        </li>
        <li className="stat stat-green kw-stat" style={{ animationDelay: '0.3s' }}>
          <span className="tile tile-sm">
            <Icon name="bolt" size={18} />
          </span>
          <strong style={{ animationDelay: '0.65s' }}>{stats.active}</strong>
          <span>En cours</span>
        </li>
        <li className="stat stat-neutral kw-stat" style={{ animationDelay: '0.4s' }}>
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong style={{ animationDelay: '0.75s' }}>{stats.done}</strong>
          <span>Terminées</span>
        </li>
      </ul>

      {/* Dash Grid */}
      <div className="dash-grid">
        {/* À faire */}
        <section className="card kw-card" style={{ animationDelay: '0.5s' }}>
          <div className="card-head">
            <h2>À faire</h2>
            <a href="#/demandes" onClick={(e) => { e.preventDefault(); navigate('operator-missions'); }}>
              Toutes mes missions
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
              <p className="muted">Aucune demande n'attend d'action.</p>
            </div>
          ) : (
            <div className="request-list">
              {pendingWork.map(({ r, reasons }, rowIdx) => {
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
                      <small>{r.tracking} · {clientName}</small>
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

        {/* Derniers documents déposés */}
        <section className="card kw-card" style={{ animationDelay: '0.6s' }}>
          <h2>Derniers documents déposés</h2>
          {docs.length === 0 ? (
            <p className="muted">Aucun document pour le moment.</p>
          ) : (
            <ul className="doc-list">
              {docs.map((d, idx) => {
                const meta = DOC_TYPE_META[d.type] || DOC_TYPE_META.report;
                const downloadPath = `/documents/${d.id}/download`;
                return (
                  <li
                    key={d.id}
                    className="doc-item kw-item"
                    style={{ animationDelay: `${0.8 + idx * 0.12}s` }}
                  >
                    <span className="tile tile-sm">
                      <Icon name={meta.icon} size={18} />
                    </span>
                    <span className="doc-item-main">
                      <strong>{d.name}</strong>
                      <small>{meta.label} · {formatDate(d.createdAt)}</small>
                    </span>
                    <button
                      className="icon-btn"
                      type="button"
                      title="Voir"
                      onClick={() => openPhotoModal(downloadPath, d.name, downloadPath, true)}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      title="Télécharger"
                      onClick={() => downloadDocument(downloadPath, d.name)}
                    >
                      <Icon name="arrow-down-tray" size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <CategoryBreakdownCard
        title="Demandes par univers"
        rows={catRows}
        defaultView="chart"
        unitSingular="mission"
        unitPlural="missions"
        className="kw-card"
        style={{ animationDelay: '0.7s' }}
      />
    </>
  );
};
