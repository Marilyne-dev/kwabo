import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SERVICES, CATEGORIES } from '../../data/kwaboData';

export const AdminCatalog: React.FC = () => {
  const { requests, addToast } = useApp();
  const [catalogServices, setCatalogServices] = useState(SERVICES);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const handleToggleAvailable = (serviceId: string, current: boolean) => {
    const updated = catalogServices.map(s => s.id === serviceId ? { ...s, available: !current } : s);
    setCatalogServices(updated);
    addToast(!current ? 'Service disponible sur le site et l\'application.' : 'Service retiré de la vitrine.');
  };

  const handleOpenEditPrice = (s: typeof SERVICES[0]) => {
    setEditingServiceId(s.id);
    setNewPrice(s.price);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice.trim()) return;
    setCatalogServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, price: newPrice.trim() } : s));
    setEditingServiceId(null);
    addToast('Tarif mis à jour.');
  };

  const editingService = catalogServices.find(s => s.id === editingServiceId);

  return (
    <>
      {CATEGORIES.map(c => {
        const catServices = catalogServices.filter(s => s.cat === c.id);

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
                  {catServices.map(s => {
                    const reqCount = requests.filter(r => r.serviceId === s.id).length;

                    return (
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
                        <td data-label="Demandes">{reqCount}</td>
                        <td data-label="Disponible">
                          <label className="switch switch-inline">
                            <span className="sr-only">{s.name} disponible</span>
                            <input
                              type="checkbox"
                              checked={Boolean(s.available)}
                              onChange={() => handleToggleAvailable(s.id, Boolean(s.available))}
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
                    );
                  })}
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
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
