import React from 'react';
import { ArrowLeft, ArrowRight, Building2, FileCheck2, HeartHandshake, Receipt, Send, ShieldCheck, Truck, Video } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/kwaboData';
import { Service } from '../../types';

const requestServiceIds: Record<string, string[]> = {
  'Suivi de chantier': ['suivi-chantier'],
  'Titre foncier': ['foncier'],
  'Gestion locative': ['investissement'],
  "Payer l'hôpital": ['sante'],
  'Dossier visa': ['faire-venir'],
  "Lettre d'invitation": ['faire-venir'],
  'Création de société': ['comptabilite'],
  Comptabilité: ['comptabilite'],
  'Acte de naissance': ['administratif'],
  'Casier judiciaire': ['administratif'],
  "Transfert d'argent": ['transfert'],
  'Fret maritime': ['fret'],
  Sodabi: ['cadeaux'],
  Wax: ['cadeaux'],
  'Mariage à distance': ['evenements'],
  Funérailles: ['evenements'],
  'Factures SBEE': ['soutien-famille'],
};

const categoryIcons: Record<string, React.ElementType> = {
  immobilier: Building2,
  famille: HeartHandshake,
  demarches: Send,
  logistique: Truck,
};

const guarantees = [
  { icon: Video, title: 'Vidéos et photos', description: 'Datées, pour voir le travail réalisé.' },
  { icon: Receipt, title: 'Reçus scannés', description: 'Pour chaque dépense engagée.' },
  { icon: FileCheck2, title: 'Contrat signé', description: 'Avant le début de chaque mission.' },
  { icon: ShieldCheck, title: 'Devis avant mission', description: 'Clair, sans frais cachés.' },
];

interface Props {
  request: string;
  onBack: () => void;
}

export const ServiceResultsPage: React.FC<Props> = ({ request, onBack }) => {
  const { services, openServiceModal } = useApp();
  const matchingIds = requestServiceIds[request] ?? [];
  const matchingServices = services.filter(service => service.available && matchingIds.includes(service.id));

  return (
    <main id="services" className="min-h-[70vh] bg-[#f9f8f6] px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1200px]">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#1a5c3a] hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour à l'accueil
        </button>

        <p className="mb-5 text-sm text-[#56635b]" aria-live="polite">
          {matchingServices.length} service{matchingServices.length === 1 ? '' : 's'}
        </p>

        {matchingServices.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {matchingServices.map(service => {
              const category = CATEGORIES.find(item => item.id === service.cat);
              const CategoryIcon = categoryIcons[service.cat] ?? FileCheck2;
              return (
                <li key={service.id}>
                  <button
                    type="button"
                    onClick={() => openServiceModal(service)}
                    className="group flex min-h-[204px] w-full flex-col overflow-hidden rounded-[20px] border border-[#dce4df] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5c3a]"
                  >
                    <span className="flex h-[58px] items-center justify-between bg-[#fff7df] px-5 text-[#8a6200]">
                      <CategoryIcon aria-hidden="true" className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase tracking-wide">{category?.short}</span>
                    </span>
                    <span className="flex flex-1 flex-col px-[18px] py-4">
                      <span className="font-display text-[19px] font-semibold leading-tight text-[#1a1f1b]">
                        {service.name}
                      </span>
                      <span className="mt-2 text-sm leading-relaxed text-[#56635b]">{service.short}</span>
                      <span className="mt-auto flex items-center justify-between pt-4 text-sm font-semibold text-[#8a6200]">
                        <span>{service.price}</span>
                        <ArrowRight aria-hidden="true" className="h-5 w-5 text-[#1a5c3a] transition-transform group-hover:translate-x-1" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-[#dce4df] bg-white p-6 text-[#56635b]">
            Aucun service disponible pour le moment. Contactez notre équipe pour en parler.
          </p>
        )}

        <ul id="garanties" aria-label="Nos garanties" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {guarantees.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex min-h-[84px] items-center gap-3 rounded-[20px] border border-[#dce4df] bg-white px-4 py-3"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f5ee] text-[#1a5c3a]">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-[#1a1f1b]">{title}</span>
                <span className="block text-xs leading-relaxed text-[#56635b]">{description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};
