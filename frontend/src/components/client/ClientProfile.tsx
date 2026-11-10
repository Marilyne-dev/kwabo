import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COUNTRIES } from '../../data/kwaboData';
import { Icon } from '../common/Icon';

export const ClientProfile: React.FC = () => {
  const { currentUser, updateUserProfile, logout, addToast, navigate } = useApp();

  const [firstName, setFirstName] = useState(currentUser?.firstName || 'Aïcha');
  const [lastName, setLastName] = useState(currentUser?.lastName || 'Tidjani');
  const [email] = useState(currentUser?.email || 'aicha.tidjani@example.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+33 6 12 34 56 78');
  const [country, setCountry] = useState(currentUser?.country || 'France');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [twoFactor, setTwoFactor] = useState(currentUser?.twoFactor ?? false);

  // ── 2FA modal state ──
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');

  // ── Logout all devices confirmation modal ──
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Delete account confirmation modal ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Disable 2FA confirmation modal ──
  const [showDisable2FAConfirm, setShowDisable2FAConfirm] = useState(false);

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    received: true,
    quote: true,
    started: true,
    report: true,
    done: true,
    payment: true,
  });

  const notificationPrefs = [
    { key: 'received', label: 'Confirmation de réception d\'une demande' },
    { key: 'quote', label: 'Devis prêt à régler' },
    { key: 'started', label: 'Démarrage de l\'intervention sur le terrain' },
    { key: 'report', label: 'Nouveau compte-rendu ou vidéo déposé' },
    { key: 'done', label: 'Mission terminée' },
    { key: 'payment', label: 'Reçu de paiement' },
  ];

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ firstName, lastName, phone, country });
    addToast('Informations enregistrées avec succès.');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast('Saisissez votre mot de passe actuel.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Le mot de passe doit comporter au moins 8 caractères.', 'error');
      return;
    }
    addToast('Mot de passe changé avec succès.');
    setCurrentPassword('');
    setNewPassword('');
  };

  /* ── 2FA toggle ── */
  const handleToggle2FA = () => {
    if (twoFactor) {
      // Show disable confirmation
      setShowDisable2FAConfirm(true);
    } else {
      // Show enable modal with QR code + code input
      setTwoFactorCode('');
      setTwoFactorError('');
      setShow2FAModal(true);
    }
  };

  const handleEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.trim() !== '123456') {
      setTwoFactorError('Code incorrect.');
      return;
    }
    setTwoFactor(true);
    updateUserProfile({ twoFactor: true });
    setShow2FAModal(false);
    addToast('Double authentification activée.');
  };

  const handleDisable2FA = () => {
    setTwoFactor(false);
    updateUserProfile({ twoFactor: false });
    setShowDisable2FAConfirm(false);
    addToast('Double authentification désactivée.');
  };

  /* ── Logout all devices ── */
  const handleLogoutEverywhere = () => {
    setShowLogoutConfirm(false);
    addToast('Toutes les sessions ont été déconnectées.');
    logout();
  };

  /* ── Delete account ── */
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    addToast('Compte supprimé.');
    logout();
  };

  const handleResetDemo = () => {
    if (window.confirm('Remettre la démonstration à zéro ?')) {
      window.location.reload();
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

            <button className="btn btn-primary" type="submit">
              Enregistrer
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
            <button className="btn btn-primary" type="submit">
              Changer le mot de passe
            </button>
          </form>
        </div>

        {/* ──────── Stack Right: Sécurité, Notifications, Mes données, Démo ──────── */}
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
                    checked={prefs[p.key] ?? true}
                    onChange={(e) => setPrefs(prev => ({ ...prev, [p.key]: e.target.checked }))}
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
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Icon name="x-circle" size={18} />
                Supprimer mon compte
              </button>
            </div>
          </section>

          {/* ── Démonstration ── */}
          <section className="card card-soft">
            <h2>Démonstration</h2>
            <p className="muted">
              Remet les comptes et les données d'exemple à leur état de départ.
            </p>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleResetDemo}
            >
              Réinitialiser la démo
            </button>
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
              Scannez le QR code avec une application d'authentification, puis saisissez le code affiché.
            </p>

            {/* QR code placeholder */}
            <div className="doc-preview" style={{ textAlign: 'center', padding: 24 }}>
              <Icon name="shield-check" size={48} />
              <p className="muted" style={{ marginTop: 12 }}>
                Le QR code s'affichera ici. Pour la démonstration, le code est 123456.
              </p>
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
                <button className="btn btn-primary" type="submit">
                  Activer
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
            <p className="muted" style={{ marginBottom: 20 }}>
              Votre compte sera moins bien protégé.
            </p>
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
                type="button"
                onClick={handleDisable2FA}
              >
                Désactiver
              </button>
            </div>
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
            <p className="muted" style={{ marginBottom: 20 }}>
              Vos demandes, documents, messages et factures seront effacés. Cette action est irréversible.
            </p>
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
                type="button"
                onClick={handleDeleteAccount}
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
