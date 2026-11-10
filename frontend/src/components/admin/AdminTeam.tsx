import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { UserRole } from '../../types';

export const AdminTeam: React.FC = () => {
  const { users, requests, toggleSuspendUser, addToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const teamMembers = users.filter(u => u.role !== 'USER');

  const ROLE_LABEL: Record<UserRole, string> = {
    ADMIN: 'Administrateur',
    OPERATOR: 'Agent terrain',
    USER: 'Client',
  };

  const PERMISSIONS: [string, boolean, boolean, boolean][] = [
    ['Voir ses propres demandes et documents', true, true, true],
    ['Écrire au client sur une demande', true, true, true],
    ['Déposer rapports, photos, reçus', false, true, true],
    ['Changer le statut d\'une demande attribuée', false, true, true],
    ['Voir toutes les demandes', false, false, true],
    ['Attribuer un agent, envoyer un devis', false, false, true],
    ['Gérer clients, paiements et avis', false, false, true],
    ['Gérer le catalogue et l\'équipe', false, false, true],
  ];

  const handleToggleSuspend = (id: string, name: string, isSuspended: boolean) => {
    if (window.confirm(isSuspended ? `Réactiver ${name} ?` : `Suspendre ${name} ?`)) {
      toggleSuspendUser(id);
      addToast(isSuspended ? 'Compte réactivé.' : 'Compte suspendu.');
    }
  };

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;
    addToast(`Agent ${newFirstName} ${newLastName} ajouté avec succès.`);
    setShowAddModal(false);
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => setShowAddModal(true)}
        >
          <Icon name="user-plus" size={18} />
          <span>Ajouter un agent</span>
        </button>
      </div>

      <ul className="team-grid">
        {teamMembers.map(u => {
          const assigned = requests.filter(r => r.operatorId === u.id);
          const activeCount = assigned.filter(r => r.status === 'active').length;

          return (
            <li key={u.id} className="card">
              <div className="client-mini">
                <span className="avatar">{u.firstName[0]}{u.lastName[0]}</span>
                <span>
                  <strong>{u.firstName} {u.lastName}</strong>
                  <small>{ROLE_LABEL[u.role]}</small>
                </span>
                {u.suspended && <span className="badge badge-red ml-auto">Suspendu</span>}
              </div>

              <ul className="contact-list">
                <li>
                  <Icon name="envelope" size={18} />
                  <span>{u.email}</span>
                </li>
                <li>
                  <Icon name="phone" size={18} />
                  <span>{u.phone}</span>
                </li>
              </ul>

              {u.role === 'OPERATOR' ? (
                <p className="team-load">
                  <strong>{activeCount}</strong> en cours · <strong>{assigned.length}</strong> au total
                </p>
              ) : (
                <p className="team-load muted">Accès à toutes les demandes</p>
              )}

              {u.role !== 'ADMIN' && (
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => handleToggleSuspend(u.id, `${u.firstName} ${u.lastName}`, !!u.suspended)}
                >
                  {u.suspended ? 'Réactiver' : 'Suspendre'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Permissions Matrix Table */}
      <section className="card mt-6">
        <h2>Qui peut faire quoi</h2>
        <div className="table-wrap">
          <table className="table table-perms">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Client</th>
                <th>Agent terrain</th>
                <th>Administrateur</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(([label, ...roles], idx) => (
                <tr key={idx}>
                  <td>{label}</td>
                  {roles.map((allowed, rIdx) => (
                    <td key={rIdx}>
                      {allowed ? (
                        <span className="perm-yes">
                          <Icon name="check" size={18} />
                          <span className="sr-only">Oui</span>
                        </span>
                      ) : (
                        <span className="perm-no" aria-label="Non">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Operator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e0e8e4]">
            <h2 className="text-xl font-bold font-display mb-2">Ajouter un agent terrain</h2>
            <form onSubmit={handleAddOperator}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="agentFirstName">Prénom</label>
                  <input
                    id="agentFirstName"
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="agentLastName">Nom</label>
                  <input
                    id="agentLastName"
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="agentEmail">Adresse email</label>
                <input
                  id="agentEmail"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="agentPhone">Numéro WhatsApp</label>
                <input
                  id="agentPhone"
                  type="tel"
                  placeholder="+229 97 00 00 00"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className="dialog-actions mt-6 flex justify-end gap-3">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
