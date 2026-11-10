import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthPageLayout } from './AuthPageLayout';

export const LoginPage: React.FC = () => {
  const { login, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.message || 'Identifiants invalides. Vérifiez votre adresse e-mail.');
      }
    }, 300);
  };

  const inputClassName = 'min-h-[48px] w-full rounded-xl border border-[#c9d4ce] px-3.5 py-2.5 text-sm text-[#1a1f1b] outline-none transition focus:border-[#1a5c3a] focus:ring-2 focus:ring-[#1a5c3a]/15';
  const labelClassName = 'mb-1.5 block text-sm font-semibold text-[#1a1f1b]';

  return (
    <AuthPageLayout>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
        Bon retour
      </h2>
      <p className="mt-1 text-base text-[#56635b]">Connectez-vous à votre espace KWABO.</p>

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
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 text-sm">
          <label className="flex items-center gap-2 text-[#1a1f1b]">
            <input type="checkbox" className="h-4 w-4 accent-[#1a5c3a]" />
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
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#1a1f1b]">
        Pas encore de compte ?{' '}
        <button type="button" onClick={() => navigate('register')} className="font-medium text-[#1a5c3a] underline underline-offset-2">
          Créer un compte
        </button>
      </p>
    </AuthPageLayout>
  );
};
