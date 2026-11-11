import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Video, Calendar, MapPin } from 'lucide-react';
import { CITIES } from '../../data/kwaboData';
import { createServiceRequest } from '../../services/requests';
import { fetchServiceBySlug } from '../../services/catalog';
import { ApiError, getFirstValidationError } from '../../services/api';
import { Service } from '../../types';

export const ServiceDetailModal: React.FC = () => {
  const {
    activeServiceModal,
    closeServiceModal,
    currentUser,
    role,
    navigate,
    setPendingServiceSlug,
    addToast,
    refreshCounters,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'devis'>('details');
  const [serviceDetail, setServiceDetail] = useState<Service | null>(activeServiceModal);

  // Form fields
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [filesData, setFilesData] = useState<Record<string, File | null>>({});
  const [city, setCity] = useState(CITIES[0]);
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setServiceDetail(activeServiceModal);
    setFormData({});
    setFilesData({});
    setCity(CITIES[0]);
    setUrgency('normal');
    setDescription('');
    setTitle('');
    setErrorMsg(null);
    setActiveTab('details');

    if (!activeServiceModal) return;
    let cancelled = false;
    const slug = activeServiceModal.slug || activeServiceModal.id;
    fetchServiceBySlug(slug)
      .then((fresh) => {
        if (!cancelled && fresh) {
          setServiceDetail(fresh);
        }
      })
      .catch(() => {
        // Keep catalog service details on transient network failures
      });
    return () => {
      cancelled = true;
    };
  }, [activeServiceModal]);

  const service = serviceDetail || activeServiceModal;
  if (!service) return null;

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRedirectAuth = (target: 'login' | 'register') => {
    setPendingServiceSlug(service.slug || service.id);
    closeServiceModal();
    navigate(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser || role === 'VISITOR') {
      handleRedirectAuth('login');
      return;
    }

    if (role !== 'USER') {
      addToast('Connectez-vous avec un compte client pour créer une demande.', 'error');
      return;
    }

    const reqTitle = title.trim() || `${service.name} - ${city}`;
    setSubmitting(true);
    try {
      const newReq = await createServiceRequest({
        service: service.slug || service.id,
        title: reqTitle,
        city,
        urgency,
        budget: service.price,
        description: description || `Demande de devis pour ${service.name}.`,
        details: formData,
        files: filesData,
      });

      await refreshCounters();
      addToast('Demande envoyée avec succès.', 'success');
      closeServiceModal();
      navigate('client-request-detail', newReq.id);
    } catch (err) {
      const msg =
        getFirstValidationError(err) ||
        (err instanceof ApiError ? err.message : "Impossible d'envoyer votre demande.");
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
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
            src={service.photo}
            alt={service.name}
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
              {service.price}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              {service.name}
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
                  {service.short}
                </p>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-[#1a1f1b] mb-3">
                  Ce qui est systématiquement inclus
                </h3>
                <div className="space-y-2.5">
                  {service.included.map((inc, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[#404844]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#e8f5ee] border border-[#1a5c3a]/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-[15px] text-[#1a5c3a]">
                  <ShieldCheck className="w-[18px] h-[18px] shrink-0" />
                  <span>Nos engagements de transparence</span>
                </div>
                <p className="text-sm leading-relaxed text-[#404844]">
                  Rapport écrit remis sous 24h ouvrées. Vidéos et photos horodatées géolocalisées. Reçus scannés à l'euro près pour chaque dépense de matériel ou de formalité.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('devis')}
                  className="w-full py-3.5 rounded-full bg-[#1a5c3a] hover:bg-[#123f28] text-white text-sm font-bold transition flex items-center justify-center shadow-md"
                >
                  <span>Passer à la demande de devis</span>
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
                  placeholder={`Ex: ${service.name} - Calavi`}
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
              {service.fields.map((f) => (
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
                  ) : f.type === 'file' ? (
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required={f.required}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFilesData(prev => ({ ...prev, [f.name]: file }));
                      }}
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-[#1a1f1b] bg-white"
                    />
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

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              {!currentUser ? (
                <div className="pt-3 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#f9f7f4] border border-[#e0e8e4] text-xs text-[#404844]">
                    Connectez-vous ou créez un compte gratuit pour envoyer votre demande et recevoir votre devis personnalisé sous 12h.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRedirectAuth('login')}
                      className="w-full py-3.5 rounded-full bg-[#1a5c3a] hover:bg-[#123f28] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Se connecter pour envoyer</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRedirectAuth('register')}
                      className="w-full py-3.5 rounded-full border border-[#1a5c3a] text-[#1a5c3a] hover:bg-[#e8f5ee] text-xs font-bold transition"
                    >
                      Créer un compte client
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-full bg-[#1a5c3a] hover:bg-[#123f28] disabled:opacity-60 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>{submitting ? 'Envoi en cours…' : 'Envoyer ma demande de devis'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="block text-center text-[10px] text-neutral-400 mt-2">
                    Sans engagement · Devis détaillé émis sous 12h
                  </span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
