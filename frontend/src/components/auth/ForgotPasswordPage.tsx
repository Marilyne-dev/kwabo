import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api, ApiError } from '../../services/api';
import { AuthPageLayout } from './AuthPageLayout';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate, addToast, resetPasswordParams, currentView } = useApp();
  const isResetRoute = currentView === 'reset-password' || Boolean(resetPasswordParams);

  const [step, setStep] = useState<'request' | 'sent' | 'reset'>(isResetRoute ? 'reset' : 'request');
  const [email, setEmail] = useState(resetPasswordParams?.email || '');
  const [token, setToken] = useState(resetPasswordParams?.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (resetPasswordParams) {
      setEmail(resetPasswordParams.email || '');
      setToken(resetPasswordParams.token || '');
      setStep('reset');
    } else if (currentView === 'forgot-password' && step === 'reset') {
      setStep('request');
    }
  }, [resetPasswordParams, currentView]);

  const inputClassName =
    'min-h-[48px] w-full rounded-xl border border-[#c9d4ce] px-3.5 py-2.5 text-sm text-[#1a1f1b] outline-none transition focus:border-[#1a5c3a] focus:ring-2 focus:ring-[#1a5c3a]/15';
  const labelClassName = 'mb-1.5 block text-sm font-semibold text-[#1a1f1b]';

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    setIsLoading(true);
    try {
      await api('/password/forgot', {
        method: 'POST',
        body: { email: cleanEmail },
        skipAuthRedirect: true,
      });
      setStep('sent');
      addToast('Demande envoyée. Vérifiez votre boîte e-mail.', 'info');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Impossible d\'envoyer le lien pour le moment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !token.trim()) {
      setError('Le lien de réinitialisation est incomplet ou expiré. Veuillez redemander un lien.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins 1 lettre majuscule.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins 1 chiffre.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      await api('/password/reset', {
        method: 'POST',
        body: {
          email: email.trim(),
          token: token.trim(),
          password,
        },
        skipAuthRedirect: true,
      });
      addToast('Mot de passe enregistré. Vous pouvez vous connecter.', 'success');
      if (window.location.pathname.includes('reinitialiser-mot-de-passe')) {
        const basePath = window.location.pathname.replace(/\/reinitialiser-mot-de-passe.*$/, '') || '/';
        window.history.replaceState(null, '', `${basePath}#/connexion`);
      }
      navigate('login');
    } catch (err) {
      if (err instanceof ApiError) {
        const firstErr = err.errors ? Object.values(err.errors)[0]?.[0] : null;
        setError(firstErr || err.message || 'Erreur lors de la réinitialisation.');
      } else {
        setError('Erreur réseau lors de la réinitialisation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      {step === 'request' ? (
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
            Mot de passe oublié
          </h2>
          <p className="mt-1 text-base text-[#56635b]">
            Indiquez votre e-mail : nous vous enverrons un lien valable 1 heure.
          </p>

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSendLink} className="mt-6 space-y-4">
            <div>
              <label htmlFor="forgot-email" className={labelClassName}>
                E-mail
              </label>
              <div className="relative">
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  style={{ paddingLeft: '2.75rem' }}
                  className={`${inputClassName} pl-11`}
                />
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#56635b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[52px] w-full rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#1a1f1b]">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="font-medium text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28]"
            >
              Retour à la connexion
            </button>
          </p>
        </div>
      ) : step === 'sent' ? (
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f5ee] text-[#1a5c3a]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-[#1a1f1b] sm:text-2xl">
            E-mail envoyé
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#56635b]">
            Si ce compte existe, un lien valable 1 h a été envoyé à{' '}
            <strong className="font-semibold text-[#1a1f1b] break-all">{email}</strong>.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="min-h-[48px] w-full rounded-full bg-[#1a5c3a] px-5 text-sm font-semibold text-white transition hover:bg-[#123f28]"
            >
              Retour à la connexion
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full py-2 text-sm font-medium text-[#1a5c3a] hover:underline"
            >
              Utiliser une autre adresse e-mail
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
            Nouveau mot de passe
          </h2>
          <p className="mt-1 text-sm text-[#56635b]">
            Compte concerné : <strong>{email || 'non précisé'}</strong>
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            {!resetPasswordParams?.email && (
              <div>
                <label htmlFor="reset-email" className={labelClassName}>E-mail</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClassName}
                />
              </div>
            )}

            <div>
              <label htmlFor="reset-password" className={labelClassName}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: '3rem' }}
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute inset-y-0 right-3 flex items-center text-[#56635b] hover:text-[#1a5c3a]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#56635b]">
                Au moins 8 caractères, avec 1 majuscule et 1 chiffre.
              </p>
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className={labelClassName}>
                Confirmer le mot de passe
              </label>
              <input
                id="reset-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClassName}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[52px] w-full rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#1a1f1b]">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="font-medium text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28]"
            >
              Retour à la connexion
            </button>
          </p>
        </div>
      )}
    </AuthPageLayout>
  );
};
