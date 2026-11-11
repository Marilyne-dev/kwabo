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
  'Frais maritime',
  'Sodabi',
  'Wax',
  'Mariage à distance',
  'Funérailles',
  'Factures SBEE',
];

// 17 thèmes répartis en 3 rangées
const rows = [requests.slice(0, 6), requests.slice(6, 12), requests.slice(12)];

// durée (s) et sens de chaque rangée
const rowConfig = [
  { duration: 35, reverse: false },
  { duration: 42, reverse: true },
  { duration: 30, reverse: false },
];

interface Props {
  onSelectRequest: (request: string) => void;
}

const Chip: React.FC<{
  label: string;
  onClick: () => void;
  hidden?: boolean;
}> = ({ label, onClick, hidden }) => (
  <button
    type="button"
    onClick={onClick}
    tabIndex={hidden ? -1 : 0}
    aria-hidden={hidden || undefined}
    className="whitespace-nowrap rounded-full border border-[#dce4df] bg-[#f9f8f6] px-4 py-2 text-sm text-[#404844] transition hover:border-[#1a5c3a] hover:bg-[#e8f5ee] hover:text-[#1a5c3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
  >
    {label}
  </button>
);

export const DiasporaRequestsSection: React.FC<Props> = ({ onSelectRequest }) => (
  <section className="bg-white px-5 py-14 sm:px-8 sm:py-16">
    <style>{`
      @keyframes diaspora-marquee {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }
      .diaspora-track {
        animation: diaspora-marquee var(--duration) linear infinite;
        animation-direction: var(--direction);
      }
      .diaspora-marquee:hover .diaspora-track,
      .diaspora-marquee:focus-within .diaspora-track {
        animation-play-state: paused;
      }
      @media (prefers-reduced-motion: reduce) {
        .diaspora-track { animation: none; flex-wrap: wrap; width: auto; justify-content: center; }
        .diaspora-dup { display: none; }
      }
    `}</style>

    <div className="mx-auto max-w-[1200px]">
      <h2 className="mb-7 text-center font-display text-3xl font-semibold tracking-tight text-[#1a1f1b] sm:mb-8 sm:text-[40px]">
        Ce que la diaspora nous demande
      </h2>

      <div
        className="flex flex-col gap-2.5 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        {rows.map((row, i) => (
          <div key={i} className="diaspora-marquee overflow-hidden">
            <div
              className="diaspora-track flex w-max"
              style={
                {
                  '--duration': `${rowConfig[i].duration}s`,
                  '--direction': rowConfig[i].reverse ? 'reverse' : 'normal',
                } as React.CSSProperties
              }
            >
              {/* Copie 1 (visible) + copie 2 (dupliquée pour la boucle sans coupure) */}
              {[false, true].map(isDup => (
                <ul
                  key={String(isDup)}
                  className={`flex gap-2.5 pr-2.5 ${isDup ? 'diaspora-dup' : ''}`}
                  aria-hidden={isDup || undefined}
                >
                  {row.map(request => (
                    <li key={request}>
                      <Chip
                        label={request}
                        hidden={isDup}
                        onClick={() => onSelectRequest(request)}
                      />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);