import React, { useState } from 'react';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COUNTRIES, DIAL_CODES } from '../../data/kwaboData';
import { AuthPageLayout } from './AuthPageLayout';

export const RegisterPage: React.FC = () => {
  const { navigate, addToast, registerAccount, verifyEmail, resendVerificationEmail } = useApp();
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [dialCode, setDialCode] = useState('+33');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const res = await registerAccount({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dial: dialCode,
      country,
      password,
      sponsor_code: referralCode.trim() || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      addToast(`Un code de confirmation à 6 chiffres vient d'être envoyé à ${email.trim()}.`, 'info');
      setStep('verify');
      return;
    }

    if (res.errors) {
      setFieldErrors(res.errors);
    }
    setError(res.message || 'Veuillez vérifier les informations saisies.');
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const res = await verifyEmail(email, verificationCode);
    setIsLoading(false);

    if (!res.success) {
      if (res.errors) setFieldErrors(res.errors);
      setError(res.message || 'Code de vérification invalide.');
    }
  };

  const handleResend = async () => {
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

  if (step === 'verify') {
    return (
      <AuthPageLayout>
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f5ee] text-[#1a5c3a]">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
          Confirmez votre e-mail
        </h2>
        <p className="mt-1 text-sm text-[#56635b]">
          Nous avons envoyé un code à 6 chiffres à <strong>{email}</strong>. Saisissez-le ci-dessous pour activer votre espace client.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="verify-code" className={labelClassName}>
              Code à 6 chiffres
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
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
            {isLoading ? 'Validation...' : 'Valider mon compte'}
          </button>

          <div className="flex items-center justify-between text-sm pt-2">
            <button
              type="button"
              disabled={isResending}
              onClick={handleResend}
              className="font-medium text-[#1a5c3a] underline underline-offset-2 hover:text-[#123f28] disabled:opacity-50"
            >
              {isResending ? 'Envoi en cours...' : 'Renvoyer le code'}
            </button>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-[#56635b] hover:text-[#1a1f1b]"
            >
              Aller à la connexion
            </button>
          </div>
        </form>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[34px]">
        Créer mon compte
      </h2>
      <p className="mt-1 text-base text-[#56635b]">
        Gratuit, sans engagement, en moins d'une minute.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

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
            {fieldErrors.first_name?.[0] && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.first_name[0]}</p>
            )}
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
            {fieldErrors.last_name?.[0] && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.last_name[0]}</p>
            )}
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
          {fieldErrors.email?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
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
            {fieldErrors.phone?.[0] && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>
            )}
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
          {fieldErrors.country?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.country[0]}</p>
          )}
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
          <p className="mt-1.5 text-xs text-[#56635b]">Au moins 8 caractères, avec 1 majuscule et 1 chiffre.</p>
          {fieldErrors.password?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
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
          {fieldErrors.sponsor_code?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.sponsor_code[0]}</p>
          )}
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
          disabled={isLoading}
          className="min-h-[52px] w-full rounded-full bg-[#1a5c3a] px-5 font-semibold text-white transition hover:bg-[#123f28] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
        >
          {isLoading ? 'Création en cours...' : 'Créer mon compte'}
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
