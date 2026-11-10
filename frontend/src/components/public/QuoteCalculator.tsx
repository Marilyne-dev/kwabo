import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calculator, CheckCircle2, ArrowRight } from 'lucide-react';

export const QuoteCalculator: React.FC = () => {
  const { services, openServiceModal } = useApp();
  const [selectedServiceId, setSelectedServiceId] = useState('suivi-chantier');
  const [durationMonths, setDurationMonths] = useState(3);
  const [fretWeight, setFretWeight] = useState(40);
  const [fretMode, setFretMode] = useState<'maritime' | 'aerien'>('maritime');

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];

  // Pricing logic
  let estimatedEuro = 150;
  if (selectedServiceId === 'suivi-chantier') {
    estimatedEuro = durationMonths * 150;
  } else if (selectedServiceId === 'fret') {
    estimatedEuro = fretMode === 'maritime' ? Math.max(90, fretWeight * 3.5) : Math.max(120, fretWeight * 9.5);
  } else if (selectedServiceId === 'sante') {
    estimatedEuro = durationMonths * 40;
  } else if (selectedServiceId === 'administratif') {
    estimatedEuro = 60;
  } else if (selectedServiceId === 'faire-venir') {
    estimatedEuro = 250;
  } else {
    estimatedEuro = 180;
  }

  const estimatedFcfa = Math.round(estimatedEuro * 655.957);

  return (
    <section id="simulateur" className="py-20 bg-[#1a4d30] text-white bg-benin-pattern border-b border-[#2d7a52]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Intro */}
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#f5c842] text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulateur d'estimation instantanée</span>
            </span>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Estimez votre budget sans mauvaise surprise
            </h2>

            <p className="text-sm text-white/80 leading-relaxed">
              Chez KWABO, pas de commissions dissimulées ni de dépassements de coûts imprévus. Les tarifs sont contractuels et garantis par notre équipe au Bénin.
            </p>

            <div className="pt-2 space-y-2 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#f5c842]" />
                <span>Taux de change fixe 1 € = 655,957 FCFA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#f5c842]" />
                <span>Rapports et justificatifs systématiquement inclus</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#f5c842]" />
                <span>Paiement échelonné possible selon avancement</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Box */}
          <div className="lg:col-span-7 bg-white text-[#1a1f1b] rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-white/20">
            
            <h3 className="font-display font-bold text-xl text-[#1a1f1b] mb-6">
              Configurez votre simulation
            </h3>

            <div className="space-y-6">
              {/* Choose Service */}
              <div>
                <label className="block text-xs font-bold text-[#404844] mb-2 uppercase tracking-wider">
                  Type de prestation principale
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-neutral-300 text-sm font-semibold focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none bg-white text-[#1a1f1b]"
                >
                  <option value="suivi-chantier">Suivi de chantier (Visites hebdo + vidéo 360°)</option>
                  <option value="fret">Fret Europe → Bénin (Maritime ou Aérien)</option>
                  <option value="sante">Santé & Médicaments pour proche</option>
                  <option value="faire-venir">Faire venir un proche (Dossier visa complet)</option>
                  <option value="administratif">Assistance administrative (Passeport / Acte)</option>
                </select>
              </div>

              {/* Dynamic options depending on service */}
              {selectedServiceId === 'suivi-chantier' && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#404844] mb-2">
                    <span>Durée du suivi souhaitée</span>
                    <span className="text-[#1a5c3a]">{durationMonths} mois</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full accent-[#1a5c3a] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#56635b] mt-1">
                    <span>1 mois (ponctuel)</span>
                    <span>6 mois (gros œuvre)</span>
                    <span>12 mois (clé en main)</span>
                  </div>
                </div>
              )}

              {selectedServiceId === 'fret' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFretMode('maritime')}
                      className={`p-3 rounded-xl border text-xs font-bold transition text-left ${
                        fretMode === 'maritime'
                          ? 'border-[#1a5c3a] bg-[#e8f5ee] text-[#1a5c3a]'
                          : 'border-neutral-200 text-[#56635b]'
                      }`}
                    >
                      Maritime (3-4 sem.) · Dès 3,50 €/kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFretMode('aerien')}
                      className={`p-3 rounded-xl border text-xs font-bold transition text-left ${
                        fretMode === 'aerien'
                          ? 'border-[#1a5c3a] bg-[#e8f5ee] text-[#1a5c3a]'
                          : 'border-neutral-200 text-[#56635b]'
                      }`}
                    >
                      Aérien (5-7 j.) · Dès 9,50 €/kg
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#404844] mb-2">
                      <span>Poids estimé des colis</span>
                      <span className="text-[#1a5c3a]">{fretWeight} kg</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="250"
                      step="5"
                      value={fretWeight}
                      onChange={(e) => setFretWeight(Number(e.target.value))}
                      className="w-full accent-[#1a5c3a] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {selectedServiceId === 'sante' && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#404844] mb-2">
                    <span>Durée de prise en charge</span>
                    <span className="text-[#1a5c3a]">{durationMonths} mois</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full accent-[#1a5c3a] cursor-pointer"
                  />
                </div>
              )}

              {/* Estimate Calculation Result Box */}
              <div className="p-5 rounded-2xl bg-[#f9f7f4] border border-[#e0e8e4] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#56635b] tracking-wider block">
                    Estimation indicative
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-display text-3xl font-extrabold text-[#1a5c3a]">
                      {Math.round(estimatedEuro)} €
                    </span>
                    <span className="text-xs font-semibold text-[#56635b]">
                      (~ {estimatedFcfa.toLocaleString('fr-FR')} FCFA)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#56635b] block mt-0.5">
                    Devis définitif transmis gratuitement sous 12h
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openServiceModal(selectedService)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#1a5c3a] hover:bg-[#123f28] text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>Demander ce devis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
