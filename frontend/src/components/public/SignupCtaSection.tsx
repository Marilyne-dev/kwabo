import React from 'react';
import { UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SignupCtaSection: React.FC = () => {
  const { navigate } = useApp();

  return (
    <section className="bg-[#f9f8f6] px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[250px] max-w-[1200px] flex-col items-center justify-center rounded-[20px] border border-[#f1df9e] bg-[#fff8e2] px-5 py-10 text-center sm:px-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:text-[40px]">
          Votre espace personnel vous attend
        </h2>
        <p className="mt-2 text-base text-[#56635b]">
          Inscription gratuite, aucune carte bancaire. Un devis clair avant chaque mission.
        </p>
        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('register')}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#1a5c3a] px-7 font-semibold text-white transition hover:bg-[#123f28] sm:w-auto"
          >
            <UserPlus aria-hidden="true" className="h-4 w-4" />
            Créer mon compte gratuit
          </button>
          <button
            type="button"
            onClick={() => navigate('login')}
            className="min-h-[52px] w-full rounded-full border border-[#dce4df] bg-white px-7 font-semibold text-[#1a5c3a] transition hover:bg-[#f9f7f4] sm:w-auto"
          >
            J'ai déjà un compte
          </button>
        </div>
      </div>
    </section>
  );
};
