import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck, MailCheck, LockKeyhole } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthPageLayout } from './AuthPageLayout';

interface LoginPageProps {
  mode?: 'client' | 'admin' | 'operator';
}

export const LoginPage: React.FC<LoginPageProps> = ({ mode = 'client' }) => {
  const { currentUser, role, login, enterDevPreview, verifyEmail, resendVerificationEmail, navigate, addToast } = useApp();
  const isClient = mode === 'client';
  const isAdmin = mode === 'admin';
  const isOperator = mode === 'operator';
  const isTeam = isAdmin || isOperator;
  const expectedRole = isAdmin ? 'ADMIN' : isOperator ? 'OPERATOR' : 'USER';
  const hasOtherActiveSession = Boolean(currentUser && role !== 'VISITOR' && role !== expectedRole);
  const currentDashboardView =
    role === 'ADMIN' ? 'admin-dashboard' : role === 'OPERATOR' ? 'operator-dashboard' : 'client-dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    setNeedsTwoFactor(false);
    setNeedsVerification(false);
    setTwoFactorCode('');
    setVerificationCode('');
    setError(null);
    setFieldErrors({});
  }, [mode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const result = await login(email, password, {
      isTeam,
      expectedRole,
      code: needsTwoFactor ? twoFactorCode : undefined,
    });

    setIsLoading(false);

    if (result.success) return;

    if (result.needsCode) {
      setNeedsTwoFactor(true);
      setError(null);
      return;
    }

    if (result.needsVerification) {
      setNeedsVerification(true);
      setError(result.message || null);
      return;
    }

    if (result.errors) {
      setFieldErrors(result.errors);
    }
    setError(result.message || 'Identifiants invalides. Vérifiez votre adresse e-mail.');
  };

  const handleVerifyEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const result = await verifyEmail(email, verificationCode);
    setIsLoading(false);

    if (!result.success) {
      if (result.errors) setFieldErrors(result.errors);
      setError(result.message || 'Code de vérification invalide.');
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    const res = await resendVerificationEmail(email);
    setIsResending(false);
    if (res.success) {
      addToast(res.message || 'Code renvoyé par e-mail.', 'info');
    } else {
      setError(res.message || 'Impossible de renvoyer le code.');
    }
  };

  const inputClassName =
    'min-h-[48px] w-full rounded-xl border border-[#c9d4ce] px-3.5 py-2.5 text-sm text-[#1a1f1b] outline-none transition focus:border-[#1a5c3a] focus:ring-2 focus:ring-[#1a5c3a]/15';
  const labelClassName = 'mb-1.5 block text-sm font-semibold text-[#1a1f1b]';

  if (needsVerification) {
    return (
      <AuthPageLayout>
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f5ee] text-[#1a5c3a]">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
          Vérifiez votre e-mail
        </h2>
        <p className="mt-1 text-sm text-[#56635b]">
          Saisissez le code à 6 chiffres envoyé à <strong>{email}</strong> pour activer votre compte.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleVerifyEmail} className="mt-6 space-y-4">
          <div>
            <label htmlFor="verify-login-code" className={labelClassName}>
              Code de confirmation (6 chiffres)
            </label>
            <input
              id="verify-login-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="123456"
              className={`${inputClassName} text-center text-lg tracking-[0.35em] font-semibold`}
            />
            {fieldErrors.code?.[0] && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.code[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[52px] w-full rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28] disabled:opacity-60"
          >
            {isLoading ? 'Vérification...' : 'Confirmer mon e-mail'}
          </button>

          <div className="flex items-center justify-between text-sm pt-1">
            <button
              type="button"
              disabled={isResending}
              onClick={handleResendCode}
              className="font-medium text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28] disabled:opacity-50"
            >
              {isResending ? 'Envoi...' : 'Renvoyer le code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setNeedsVerification(false);
                setError(null);
              }}
              className="text-[#56635b] hover:text-[#1a1f1b]"
            >
              Retour
            </button>
          </div>
        </form>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      {isTeam && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#e8f5ee] px-3 py-1 text-xs font-semibold text-[#1a5c3a]">
          <LockKeyhole className="h-3.5 w-3.5" />
          <span>{isAdmin ? 'Accès Administration' : 'Accès Agent terrain'}</span>
        </div>
      )}
      <h2
        className={
          isTeam
            ? 'font-display text-xl font-semibold tracking-tight text-[#1a1f1b] sm:text-2xl'
            : 'font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]'
        }
      >
        {isAdmin ? 'Console KWABO' : isOperator ? 'Espace Agent KWABO' : 'Bon retour'}
      </h2>
      <p className="mt-1 text-sm text-[#56635b] sm:text-base">
        {isAdmin
          ? 'Connexion réservée aux administrateurs.'
          : isOperator
            ? 'Connectez-vous avec les identifiants transmis par votre administrateur.'
            : 'Connectez-vous à votre espace KWABO.'}
      </p>

      {hasOtherActiveSession && currentUser && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
          <p className="font-medium">
            Session active : {currentUser.fullName || currentUser.email}
          </p>
          <p className="mt-0.5 text-amber-800">
            Vous connecter ici remplacera la session en cours.
          </p>
          <button
            type="button"
            onClick={() => navigate(currentDashboardView)}
            className="mt-2 font-semibold text-amber-950 underline underline-offset-2 hover:text-amber-700"
          >
            Retourner à mon espace actuel
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className={labelClassName}>E-mail</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="vous@exemple.com"
            className={inputClassName}
          />
          {fieldErrors.email?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className={labelClassName}>Mot de passe</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              style={{ paddingRight: '3rem' }}
              className={`${inputClassName} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(visible => !visible)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute inset-y-0 right-3 flex items-center text-[#56635b] hover:text-[#1a5c3a]"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
          {fieldErrors.password?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        {needsTwoFactor && (
          <div className="rounded-2xl border border-[#dce4df] bg-[#f4faf6] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1a5c3a]">
              <ShieldCheck className="h-4 w-4" />
              <span>Double authentification activée</span>
            </div>
            <label htmlFor="login-2fa-code" className={labelClassName}>
              Code à 6 chiffres (application d'authentification)
            </label>
            <input
              id="login-2fa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              required
              autoFocus
              value={twoFactorCode}
              onChange={e => setTwoFactorCode(e.target.value)}
              placeholder="123456"
              className={`${inputClassName} bg-white text-center text-base tracking-[0.3em] font-semibold`}
            />
            {fieldErrors.code?.[0] && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.code[0]}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1 text-sm">
          <label className="flex items-center gap-2 text-[#1a1f1b]">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#1a5c3a]" />
            Rester connecté
          </label>
          <button
            type="button"
            onClick={() => navigate('forgot-password')}
            className="font-medium text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28]"
          >
            Mot de passe oublié ?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="min-h-[52px] w-full rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
        >
          {isLoading ? 'Connexion en cours...' : needsTwoFactor ? 'Valider le code' : 'Se connecter'}
        </button>
      </form>

      {isClient && (
        <p className="mt-5 text-center text-sm text-[#1a1f1b]">
          Pas encore de compte ?{' '}
          <button type="button" onClick={() => navigate('register')} className="font-medium text-[#1a5c3a] underline underline-offset-2">
            Créer un compte
          </button>
        </p>
      )}

      {import.meta.env.DEV && isTeam && enterDevPreview && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#1a5c3a]/30 bg-[#f4faf6] p-4 text-center">
          <p className="text-xs font-semibold text-[#1a5c3a]">
            Mode aperçu local (développement uniquement)
          </p>
          <p className="mt-1 text-xs text-[#56635b]">
            Visualisez l'interface {isAdmin ? 'Administrateur' : 'Agent terrain'} avec des données de démonstration locales, sans serveur.
          </p>
          <button
            type="button"
            onClick={() => enterDevPreview(isAdmin ? 'ADMIN' : 'OPERATOR')}
            className="mt-3 w-full rounded-full border border-[#1a5c3a] bg-white px-4 py-2.5 text-xs font-bold text-[#1a5c3a] transition hover:bg-[#e8f5ee]"
          >
            Aperçu local {isAdmin ? 'Console Admin' : 'Espace Agent'} (données démo)
          </button>
        </div>
      )}
    </AuthPageLayout>
  );
};
