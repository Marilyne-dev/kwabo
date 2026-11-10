import React from 'react';

const requests = [
  'Suivi de chantier',
  'Titre foncier',
  'Gestion locative',
  "Payer l'hôpital",
  'Dossier visa',
  "Lettre d'invitation",
  'Création de société',
  'Comptabilité',
  'Acte de naissance',
  'Casier judiciaire',
  "Transfert d'argent",
  'Fret maritime',
  'Sodabi',
  'Wax',
  'Mariage à distance',
  'Funérailles',
  'Factures SBEE',
];

interface Props {
  onSelectRequest: (request: string) => void;
}

export const DiasporaRequestsSection: React.FC<Props> = ({ onSelectRequest }) => (
  <section className="bg-white px-5 py-14 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-[1200px]">
      <h2 className="mb-7 text-center font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:mb-8 sm:text-[40px]">
        Ce que la diaspora nous demande
      </h2>
      <ul className="flex flex-wrap justify-center gap-2.5">
        {requests.map(request => (
          <li key={request}>
            <button
              type="button"
              onClick={() => onSelectRequest(request)}
              className="whitespace-nowrap rounded-full border border-[#dce4df] bg-[#f9f8f6] px-4 py-2 text-sm text-[#404844] transition hover:border-[#1a5c3a] hover:bg-[#e8f5ee] hover:text-[#1a5c3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
            >
              {request}
            </button>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
