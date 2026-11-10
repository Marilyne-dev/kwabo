import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Video, Calendar, MapPin } from 'lucide-react';
import { CITIES } from '../../data/kwaboData';

export const ServiceDetailModal: React.FC = () => {
  const { activeServiceModal, closeServiceModal, currentUser, role, createRequest, navigate, switchPersona } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'devis'>('details');
  
  // Form fields
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [city, setCity] = useState(CITIES[0]);
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [clientName, setClientName] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '');

  if (!activeServiceModal) return null;

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If not logged in, auto associate with client demo u01 or create request
    const userId = currentUser ? currentUser.id : 'u01';
    const reqTitle = title.trim() || `${activeServiceModal.name} - ${city}`;

    const newReq = createRequest({
      userId,
      serviceId: activeServiceModal.id,
      title: reqTitle,
      city,
      urgency,
      budget: activeServiceModal.price,
      description: description || `Demande de devis pour ${activeServiceModal.name}.`,
      details: formData,
    });

    closeServiceModal();

    // If visitor, switch to client space to see their brand new request
    if (role === 'VISITOR') {
      switchPersona('USER', 'u01');
      navigate('client-request-detail', newReq.id);
    } else {
      navigate('client-request-detail', newReq.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Photo */}
        <div className="relative h-56 sm:h-64 overflow-hidden">
          <img
            src={activeServiceModal.photo}
            alt={activeServiceModal.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <button
            type="button"
            onClick={closeServiceModal}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-xs font-bold text-[#f5c842] uppercase tracking-wider block">
              {activeServiceModal.price}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              {activeServiceModal.name}
            </h2>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-neutral-200 px-6 pt-3 bg-neutral-50">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === 'details'
                ? 'border-[#1a5c3a] text-[#1a5c3a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Détails & Garanties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devis')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === 'devis'
                ? 'border-[#1a5c3a] text-[#1a5c3a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Demander un devis gratuit
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-base text-[#1a1f1b]">
                  Description de la prestation
                </h3>
                <p className="text-sm text-[#56635b] mt-2 leading-relaxed">
                  {activeServiceModal.short}
                </p>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-[#1a1f1b] mb-3">
                  Ce qui est systématiquement inclus
                </h3>
                <div className="space-y-2.5">
                  {activeServiceModal.included.map((inc, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[#404844]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="p-4 rounded-2xl bg-[#e8f5ee] border border-[#1a5c3a]/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#1a5c3a]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Nos engagements de transparence</span>
                </div>
                <p className="text-xs text-[#56635b]">
                  Rapport écrit remis sous 24h ouvrées. Vidéos et photos horodatées géolocalisées. Reçus scannés à l'euro près pour chaque dépense de matériel ou de formalité.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('devis')}
                  className="w-full py-3.5 rounded-full bg-[#1a5c3a] hover:bg-[#123f28] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Passer à la demande de devis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#404844] mb-1">
                  Intitulé personnalisé de votre projet
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ex: ${activeServiceModal.name} - Calavi`}
                  className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#404844] mb-1">
                    Ville ou commune au Bénin
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none bg-white"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#404844] mb-1">
                    Degré d'urgence
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as 'normal' | 'urgent')}
                    className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none bg-white"
                  >
                    <option value="normal">Normale (devis sous 12h)</option>
                    <option value="urgent">Prioritaire / Urgent (intervention rapide)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Service Specific Fields */}
              {activeServiceModal.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-[#404844] mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      value={formData[f.name] || ''}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      required={f.required}
                      className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none bg-white"
                    >
                      <option value="">Sélectionner une option...</option>
                      {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={formData[f.name] || ''}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-[#404844] mb-1">
                  Précisions complémentaires sur votre situation
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez vos consignes particulières, dates limites ou remarques pour l'équipe sur place..."
                  className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] focus:ring-2 focus:ring-[#1a5c3a] focus:outline-none"
                />
              </div>

              {!currentUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#404844] mb-1">
                      Votre nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Aïcha Sossa"
                      className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#404844] mb-1">
                      Votre adresse email
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@kwabo.demo"
                      className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#1a5c3a] hover:bg-[#123f28] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Envoyer ma demande de devis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="block text-center text-[10px] text-neutral-400 mt-2">
                  Sans engagement · Devis détaillé émis sous 12h
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
