import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COUNTRIES } from '../../data/kwaboData';
import { Icon } from '../common/Icon';
import { api, ApiError, getFirstValidationError } from '../../services/api';
import { mapUser } from '../../services/mappers';

import { NotificationPrefs } from '../../types';

const DEFAULT_PREFS: Record<string, boolean> = {
  received: true,
  quote: true,
  started: true,
  report: true,
  done: true,
  payment: true,
};

function mergePrefs(base: Record<string, boolean>, incoming?: NotificationPrefs): Record<string, boolean> {
  if (!incoming) return base;
  const next = { ...base };
  Object.entries(incoming).forEach(([key, val]) => {
    if (typeof val === 'boolean') next[key] = val;
  });
  return next;
}

export const ClientProfile: React.FC = () => {
  const { currentUser, setCurrentUser, refreshMe, logout, addToast, navigate } = useApp();

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const email = currentUser?.email || '';
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [country, setCountry] = useState(currentUser?.country || COUNTRIES[0]);
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [twoFactor, setTwoFactor] = useState(currentUser?.twoFactor ?? false);

  // ── 2FA enable modal state ──
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrSvg, setTwoFactorQrSvg] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [enabling2FA, setEnabling2FA] = useState(false);

  // ── Disable 2FA confirmation modal ──
  const [showDisable2FAConfirm, setShowDisable2FAConfirm] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [disable2FAError, setDisable2FAError] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  // ── Logout all devices confirmation modal ──
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Delete account confirmation modal ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    mergePrefs(DEFAULT_PREFS, currentUser?.prefs)
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setPhone(currentUser.phone);
    setCountry(currentUser.country || COUNTRIES[0]);
    setTwoFactor(Boolean(currentUser.twoFactor));
    if (currentUser.prefs) {
      setPrefs(prev => mergePrefs(prev, currentUser.prefs));
    }
  }, [currentUser]);

  const notificationPrefs = [
    { key: 'received', label: 'Confirmation de réception d\'une demande' },
    { key: 'quote', label: 'Devis prêt à régler' },
    { key: 'started', label: 'Démarrage de l\'intervention sur le terrain' },
    { key: 'report', label: 'Nouveau compte-rendu ou vidéo déposé' },
    { key: 'done', label: 'Mission terminée' },
    { key: 'payment', label: 'Reçu de paiement' },
  ];

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await api<any>('/profile', {
        method: 'PATCH',
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          country,
        },
      });
      const updated = mapUser(res?.data ?? res);
      setCurrentUser(updated);
      addToast('Informations enregistrées avec succès.', 'success');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour.'),
        'error'
      );
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast('Saisissez votre mot de passe actuel.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Le mot de passe doit comporter au moins 8 caractères.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await api('/profile/password', {
        method: 'PUT',
        body: {
          current_password: currentPassword,
          password: newPassword,
        },
      });
      addToast('Mot de passe changé avec succès. Les autres appareils ont été déconnectés.', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Mot de passe invalide.'),
        'error'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleTogglePref = async (key: string, checked: boolean) => {
    const nextPrefs = { ...prefs, [key]: checked };
    setPrefs(nextPrefs);
    setSavingPrefs(true);
    try {
      const res = await api<any>('/profile/notifications', {
        method: 'PUT',
        body: { prefs: nextPrefs },
      });
      if (res?.data) {
        setCurrentUser(mapUser(res.data));
      }
      addToast('Préférences de notification enregistrées.', 'success');
    } catch (err) {
      setPrefs(prefs);
      addToast(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Impossible de mettre à jour les préférences.'),
        'error'
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  /* ── 2FA toggle ── */
  const handleToggle2FA = async () => {
    if (twoFactor) {
      setDisable2FAPassword('');
      setDisable2FAError('');
      setShowDisable2FAConfirm(true);
      return;
    }

    setTwoFactorCode('');
    setTwoFactorError('');
    setTwoFactorSecret('');
    setTwoFactorQrSvg('');
    setShow2FAModal(true);
    setSetupLoading(true);
    try {
      const res = await api<any>('/two-factor/setup', { method: 'POST' });
      const data = res?.data ?? res ?? {};
      setTwoFactorSecret(data.secret || '');
      setTwoFactorQrSvg(data.qr_svg || '');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Impossible de préparer la double authentification.';
      setTwoFactorError(msg);
      addToast(msg, 'error');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');
    setEnabling2FA(true);
    try {
      await api('/two-factor/enable', {
        method: 'POST',
        body: { code: twoFactorCode.trim() },
      });
      setTwoFactor(true);
      await refreshMe();
      setShow2FAModal(false);
      addToast('Double authentification activée.', 'success');
    } catch (err) {
      setTwoFactorError(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Code incorrect.')
      );
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FAPassword) {
      setDisable2FAError('Saisissez votre mot de passe.');
      return;
    }
    setDisabling2FA(true);
    setDisable2FAError('');
    try {
      await api('/two-factor/disable', {
        method: 'POST',
        body: { password: disable2FAPassword },
      });
      setTwoFactor(false);
      await refreshMe();
      setShowDisable2FAConfirm(false);
      addToast('Double authentification désactivée.', 'info');
    } catch (err) {
      setDisable2FAError(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Mot de passe incorrect.')
      );
    } finally {
      setDisabling2FA(false);
    }
  };

  /* ── Logout all devices ── */
  const handleLogoutEverywhere = async () => {
    setShowLogoutConfirm(false);
    await logout(true);
  };

  /* ── Delete account ── */
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Saisissez votre mot de passe pour confirmer.');
      return;
    }
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await api('/account', {
        method: 'DELETE',
        body: { password: deletePassword },
      });
      setShowDeleteConfirm(false);
      addToast('Compte supprimé définitivement.', 'info');
      await logout(false);
    } catch (err) {
      setDeleteError(
        getFirstValidationError(err) || (err instanceof ApiError ? err.message : 'Impossible de supprimer le compte.')
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <div className="dash-grid dash-grid-even">
        {/* ──────── Stack Left: Informations & Mot de passe ──────── */}
        <div className="stack">
          <form className="card form-card" onSubmit={handleSaveInfo}>
            <h2>Mes informations</h2>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="profile-fn">
                  Prénom <span className="field-req">*</span>
                </label>
                <input
                  id="profile-fn"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="profile-ln">
                  Nom <span className="field-req">*</span>
                </label>
                <input
                  id="profile-ln"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="profile-email">E-mail</label>
              <input
                id="profile-email"
                type="email"
                readOnly
                value={email}
              />
              <p className="hint">Pour le changer, écrivez-nous : il sera vérifié à nouveau.</p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="profile-tel">
                Téléphone <span className="field-req">*</span>
              </label>
              <input
                id="profile-tel"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="profile-country">
                Pays de résidence <span className="field-req">*</span>
              </label>
              <select
                id="profile-country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary" type="submit" disabled={savingInfo}>
              {savingInfo ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>

          <form className="card form-card" onSubmit={handleSavePassword}>
            <h2>Mot de passe</h2>
            <div className="field">
              <label className="field-label" htmlFor="pwd-current">
                Mot de passe actuel <span className="field-req">*</span>
              </label>
              <input
                id="pwd-current"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="pwd-next">
                Nouveau mot de passe <span className="field-req">*</span>
              </label>
              <input
                id="pwd-next"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="hint">Au moins 8 caractères, avec 1 majuscule et 1 chiffre.</p>
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* ──────── Stack Right: Sécurité, Notifications, Mes données ──────── */}
        <div className="stack">
          {/* ── Sécurité ── */}
          <section className="card">
            <h2>Sécurité</h2>
            <div className="setting">
              <span className="tile tile-sm">
                <Icon name="shield-check" size={18} />
              </span>
              <div>
                <strong>Double authentification</strong>
                <small>{twoFactor ? 'Activée. Un code est demandé à chaque connexion.' : 'Désactivée. Ajoutez un code à chaque connexion.'}</small>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={handleToggle2FA}
              >
                {twoFactor ? 'Désactiver' : 'Activer'}
              </button>
            </div>

            <div className="setting">
              <span className="tile tile-sm">
                <Icon name="arrow-right-on-rectangle" size={18} />
              </span>
              <div>
                <strong>Tous mes appareils</strong>
                <small>Vous déconnecte partout, y compris ici.</small>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Déconnecter
              </button>
            </div>
          </section>

          {/* ── Notifications par e-mail ── */}
          <section className="card">
            <h2>Notifications par e-mail</h2>
            <div className="pref-list">
              {notificationPrefs.map(p => (
                <label key={p.key} className="switch">
                  <span>{p.label}</span>
                  <input
                    type="checkbox"
                    disabled={savingPrefs}
                    checked={prefs[p.key] ?? true}
                    onChange={(e) => handleTogglePref(p.key, e.target.checked)}
                  />
                  <span className="switch-track" aria-hidden="true"></span>
                </label>
              ))}
            </div>
          </section>

          {/* ── Mes données ── */}
          <section className="card">
            <h2>Mes données</h2>
            <p className="muted">
              Supprimer votre compte efface définitivement vos demandes, documents, messages et factures.
            </p>
            <div className="btn-row" style={{ marginTop: 16 }}>
              <a
                className="btn btn-ghost"
                href="#/confidentialite"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('privacy');
                }}
              >
                Confidentialité
              </a>
              <button
                className="btn btn-danger-ghost"
                type="button"
                onClick={() => {
                  setDeletePassword('');
                  setDeleteError('');
                  setShowDeleteConfirm(true);
                }}
              >
                <Icon name="x-circle" size={18} />
                Supprimer mon compte
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: Activer la double authentification
          ══════════════════════════════════════════════════════════ */}
      {show2FAModal && (
        <div className="dialog-overlay" onClick={() => setShow2FAModal(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="dialog-title">Activer la double authentification</h2>
              <button
                className="icon-btn"
                type="button"
                aria-label="Fermer"
                onClick={() => setShow2FAModal(false)}
              >
                <Icon name="x-mark" size={20} />
              </button>
            </div>
            <p className="muted" style={{ marginBottom: 20 }}>
              Scannez le QR code avec une application d'authentification, puis saisissez le code à 6 chiffres affiché.
            </p>

            <div className="doc-preview" style={{ textAlign: 'center', padding: 20 }}>
              {setupLoading ? (
                <p className="muted">Génération du QR code…</p>
              ) : twoFactorQrSvg ? (
                <>
                  {twoFactorQrSvg.trim().startsWith('<svg') ? (
                    <div
                      style={{ display: 'inline-block', background: '#fff', padding: 12, borderRadius: 12 }}
                      dangerouslySetInnerHTML={{ __html: twoFactorQrSvg }}
                    />
                  ) : (
                    <img
                      src={twoFactorQrSvg}
                      alt="QR Code 2FA"
                      style={{ width: 180, height: 180, margin: '0 auto', borderRadius: 12 }}
                    />
                  )}
                  {twoFactorSecret && (
                    <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
                      Clé secrète : <code>{twoFactorSecret}</code>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Icon name="shield-check" size={48} />
                  <p className="muted" style={{ marginTop: 12 }}>
                    {twoFactorSecret ? `Clé manuelle : ${twoFactorSecret}` : 'Impossible de générer le QR code.'}
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleEnable2FA} style={{ marginTop: 20 }}>
              <div className="field">
                <label className="field-label" htmlFor="twofa-code">Code à 6 chiffres</label>
                <input
                  id="twofa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value);
                    setTwoFactorError('');
                  }}
                />
                {twoFactorError && (
                  <p className="error">{twoFactorError}</p>
                )}
              </div>

              <div className="dialog-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                >
                  Annuler
                </button>
                <button className="btn btn-primary" type="submit" disabled={enabling2FA || setupLoading}>
                  {enabling2FA ? 'Activation…' : 'Activer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: Désactiver la double authentification
          ══════════════════════════════════════════════════════════ */}
      {showDisable2FAConfirm && (
        <div className="dialog-overlay" onClick={() => setShowDisable2FAConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="dialog-title">Désactiver la double authentification ?</h2>
              <button
                className="icon-btn"
                type="button"
                aria-label="Fermer"
                onClick={() => setShowDisable2FAConfirm(false)}
              >
                <Icon name="x-mark" size={20} />
              </button>
            </div>
            <p className="muted" style={{ marginBottom: 16 }}>
              Votre compte sera moins bien protégé. Confirmez avec votre mot de passe.
            </p>
            <form onSubmit={handleDisable2FA}>
              <div className="field">
                <label className="field-label" htmlFor="disable-2fa-pwd">Mot de passe</label>
                <input
                  id="disable-2fa-pwd"
                  type="password"
                  required
                  value={disable2FAPassword}
                  onChange={(e) => {
                    setDisable2FAPassword(e.target.value);
                    setDisable2FAError('');
                  }}
                />
                {disable2FAError && <p className="error">{disable2FAError}</p>}
              </div>
              <div className="dialog-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowDisable2FAConfirm(false)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-danger"
                  type="submit"
                  disabled={disabling2FA}
                >
                  {disabling2FA ? 'Désactivation…' : 'Désactiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: Déconnecter tous vos appareils ?
          ══════════════════════════════════════════════════════════ */}
      {showLogoutConfirm && (
        <div className="dialog-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="dialog-title">Déconnecter tous vos appareils ?</h2>
              <button
                className="icon-btn"
                type="button"
                aria-label="Fermer"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <Icon name="x-mark" size={20} />
              </button>
            </div>
            <p className="muted" style={{ marginBottom: 20 }}>
              Vous devrez vous reconnecter partout.
            </p>
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleLogoutEverywhere}
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: Supprimer définitivement votre compte ?
          ══════════════════════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="dialog-title">Supprimer définitivement votre compte ?</h2>
              <button
                className="icon-btn"
                type="button"
                aria-label="Fermer"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <Icon name="x-mark" size={20} />
              </button>
            </div>
            <p className="muted" style={{ marginBottom: 16 }}>
              Vos demandes, documents, messages et factures seront effacés. Cette action est irréversible.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <div className="field">
                <label className="field-label" htmlFor="delete-account-pwd">Confirmez votre mot de passe</label>
                <input
                  id="delete-account-pwd"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                />
                {deleteError && <p className="error">{deleteError}</p>}
              </div>
              <div className="dialog-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-danger"
                  type="submit"
                  disabled={deletingAccount}
                >
                  {deletingAccount ? 'Suppression…' : 'Supprimer mon compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
