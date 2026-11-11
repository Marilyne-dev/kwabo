import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, ApiError, getFirstValidationError } from '../../services/api';
import { mapCatalog, mapServiceItem } from '../../services/mappers';
import { Service } from '../../types';
import { Icon } from '../common/Icon';

export const AdminCatalog: React.FC = () => {
  const { categories, addToast, refreshCatalog } = useApp();
  const [catalogServices, setCatalogServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>('/admin/services');
      const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      if (rawList.length > 0 && Array.isArray(rawList[0]?.services)) {
        setCatalogServices(mapCatalog(rawList).services);
      } else {
        setCatalogServices(rawList.map((s: any) => mapServiceItem(s)));
      }
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Impossible de charger le catalogue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleToggleAvailable = async (service: Service) => {
    const nextAvailable = !Boolean(service.available);
    const targetId = service.numericId ?? service.id;
    setSavingId(service.id);
    try {
      await api(`/admin/services/${targetId}`, {
        method: 'PATCH',
        body: { available: nextAvailable },
      });
      setCatalogServices(prev =>
        prev.map(s => (s.id === service.id ? { ...s, available: nextAvailable } : s))
      );
      addToast(
        nextAvailable
          ? "Service disponible sur le site et l'application."
          : 'Service retiré de la vitrine.'
      );
      await refreshCatalog();
    } catch (err) {
      addToast(err instanceof ApiError ? getFirstValidationError(err) : 'Mise à jour impossible.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenEditPrice = (s: Service) => {
    setEditingServiceId(s.id);
    setNewPrice(s.price);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice.trim() || !editingService) return;
    const targetId = editingService.numericId ?? editingService.id;
    setSavingId(editingService.id);
    try {
      await api(`/admin/services/${targetId}`, {
        method: 'PATCH',
        body: { price_label: newPrice.trim() },
      });
      setCatalogServices(prev =>
        prev.map(s => (s.id === editingService.id ? { ...s, price: newPrice.trim() } : s))
      );
      setEditingServiceId(null);
      addToast('Tarif mis à jour.');
      await refreshCatalog();
    } catch (err) {
      addToast(err instanceof ApiError ? getFirstValidationError(err) : 'Mise à jour impossible.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const editingService = catalogServices.find(s => s.id === editingServiceId);

  if (loading && catalogServices.length === 0) {
    return <div className="empty">Chargement du catalogue…</div>;
  }

  return (
    <>
      {categories.map(c => {
        const catServices = catalogServices.filter(s => s.cat === c.id);
        if (catServices.length === 0) return null;

        return (
          <section key={c.id} className="card">
            <h2>{c.name}</h2>
            <div className="table-wrap">
              <table className="table table-cards">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Tarif affiché</th>
                    <th>Demandes</th>
                    <th>Disponible</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {catServices.map(s => (
                    <tr key={s.id}>
                      <td data-label="Service">
                        <span className="client-mini">
                          <span className={`tile tile-sm cat-${s.cat}`}>
                            <Icon name={s.icon} size={18} />
                          </span>
                          <strong>{s.name}</strong>
                        </span>
                      </td>
                      <td data-label="Tarif">{s.price}</td>
                      <td data-label="Demandes">{s.requestsCount ?? 0}</td>
                      <td data-label="Disponible">
                        <label className="switch switch-inline">
                          <span className="sr-only">{s.name} disponible</span>
                          <input
                            type="checkbox"
                            checked={Boolean(s.available)}
                            disabled={savingId === s.id}
                            onChange={() => handleToggleAvailable(s)}
                          />
                          <span className="switch-track" aria-hidden="true" />
                        </label>
                      </td>
                      <td className="td-action">
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => handleOpenEditPrice(s)}
                        >
                          Modifier le tarif
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {/* Edit Price Modal Dialog */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e0e8e4]">
            <h2 className="text-xl font-bold font-display mb-2">{editingService.name}</h2>
            <form onSubmit={handleSavePrice}>
              <div className="field">
                <label htmlFor="servicePrice">Tarif affiché</label>
                <input
                  id="servicePrice"
                  type="text"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Dès 80 € / passage"
                />
                <p className="muted small-text mt-1">Exemple : Dès 50 €/démarche. Le prix exact figure dans le devis.</p>
              </div>

              <div className="dialog-actions mt-6 flex justify-end gap-3">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setEditingServiceId(null)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingId === editingService.id}
                >
                  {savingId === editingService.id ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
