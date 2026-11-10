import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COUNTRIES, DIAL_CODES } from '../../data/kwaboData';
import { AuthPageLayout } from './AuthPageLayout';

export const RegisterPage: React.FC = () => {
  const { navigate, addToast, switchPersona } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [dialCode, setDialCode] = useState('+33');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addToast(`Compte client créé avec succès pour ${firstName} ${lastName} !`);
    switchPersona('USER', 'u01');
    navigate('client-dashboard');
  };

  const inputClassName = 'min-h-[48px] w-full rounded-xl border border-[#c9d4ce] px-3.5 py-2.5 text-sm text-[#1a1f1b] outline-none transition focus:border-[#1a5c3a] focus:ring-2 focus:ring-[#1a5c3a]/15';
  const labelClassName = 'mb-1.5 block text-sm font-semibold text-[#1a1f1b]';

  return (
    <AuthPageLayout>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
        Créer mon compte
      </h2>
      <p className="mt-1 text-base text-[#56635b]">
        Gratuit, sans engagement, en moins d'une minute.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="register-first-name" className={labelClassName}>Prénom</label>
            <input
              id="register-first-name"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={event => setFirstName(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="register-last-name" className={labelClassName}>Nom</label>
            <input
              id="register-last-name"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={event => setLastName(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className={labelClassName}>E-mail</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="vous@exemple.com"
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
          <div>
            <label htmlFor="register-dial-code" className={labelClassName}>Indicatif</label>
            <select
              id="register-dial-code"
              value={dialCode}
              onChange={event => setDialCode(event.target.value)}
              className={inputClassName}
            >
              {DIAL_CODES.map(code => <option key={code} value={code}>{code}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="register-phone" className={labelClassName}>Téléphone</label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel-national"
              required
              value={phone}
              onChange={event => setPhone(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-country" className={labelClassName}>Pays de résidence</label>
          <select
            id="register-country"
            autoComplete="country-name"
            required
            value={country}
            onChange={event => setCountry(event.target.value)}
            className={inputClassName}
          >
            <option value="" disabled>Sélectionnez...</option>
            {COUNTRIES.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="register-password" className={labelClassName}>Mot de passe</label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}"
              title="Au moins 8 caractères, avec 1 majuscule et 1 chiffre."
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
          <p className="mt-1.5 text-xs text-[#56635b]">Au moins 8 caractères, avec 1 majuscule et 1 chiffre.</p>
        </div>

        <div>
          <label htmlFor="register-referral" className={labelClassName}>
            Code de parrainage <span className="font-normal text-[#56635b]">(facultatif)</span>
          </label>
          <input
            id="register-referral"
            type="text"
            value={referralCode}
            onChange={event => setReferralCode(event.target.value)}
            placeholder="KW-..."
            className={inputClassName}
          />
        </div>

        <label className="flex items-start gap-2 text-sm leading-5 text-[#1a1f1b]">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5c3a]"
          />
          <span>
            J'accepte les{' '}
            <button
              type="button"
              onClick={() => navigate('cgu')}
              className="text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28]"
            >
              CGU
            </button>{' '}
            et la{' '}
            <button
              type="button"
              onClick={() => navigate('privacy')}
              className="text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28]"
            >
              politique de confidentialité
            </button>.
          </span>
        </label>

        <button
          type="submit"
          className="min-h-[52px] w-full rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
        >
          Créer mon compte
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#1a1f1b]">
        Déjà un compte ?{' '}
        <button type="button" onClick={() => navigate('login')} className="font-medium text-[#1a5c3a] underline underline-offset-2">
          Se connecter
        </button>
      </p>
    </AuthPageLayout>
  );
};
