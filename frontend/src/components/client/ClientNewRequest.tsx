import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICES, CATEGORIES, CITIES } from '../../data/kwaboData';
import { Icon } from '../common/Icon';
import { Request } from '../../types';

/* Animations ajoutées (CSS uniquement, aucune logique modifiée) */
const NEW_REQUEST_ANIMATIONS = `
@keyframes kwFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwFadeDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes kwPanelIn {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes kwSlideRight {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes kwPopIn {
  0%   { opacity: 0; transform: scale(0.85); }
  70%  { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes kwStepPop {
  0%   { transform: scale(0.6); }
  60%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}
@keyframes kwCurrentPulse {
  0%   { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.5); }
  70%  { box-shadow: 0 0 0 10px rgba(212, 160, 23, 0); }
  100% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0); }
}
@keyframes kwSuccessPop {
  0%   { opacity: 0; transform: scale(0.3) rotate(-20deg); }
  60%  { opacity: 1; transform: scale(1.2) rotate(6deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}
@keyframes kwRing {
  0%   { box-shadow: 0 0 0 0 rgba(34, 139, 80, 0.45); }
  100% { box-shadow: 0 0 0 22px rgba(34, 139, 80, 0); }
}
@keyframes kwTrackingGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0); }
  50%      { box-shadow: 0 0 0 6px rgba(212, 160, 23, 0.22); }
}

/* Indicateur d'étapes */
.kw-wizard {
  animation: kwFadeDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.kw-wizard li {
  transition: color 0.3s ease, opacity 0.3s ease;
}
.kw-wizard li > span {
  transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;
}
.kw-wizard li.is-done > span {
  animation: kwStepPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.kw-wizard li.is-current > span {
  animation: kwCurrentPulse 1.8s ease-out infinite;
}

/* Changement d'étape */
.kw-panel {
  animation: kwPanelIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Étape 1 : recherche, filtres et services */
.kw-toolbar {
  animation: kwFadeUp 0.5s ease 0.1s both;
}
.kw-toolbar .search-field {
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.kw-toolbar .search-field:focus-within {
  transform: translateY(-1px);
}
.kw-chips .chip {
  opacity: 0;
  animation: kwPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: transform 0.2s ease, background-color 0.25s ease, color 0.25s ease;
}
.kw-chips .chip:hover {
  transform: translateY(-2px);
}
.kw-chips .chip:active {
  transform: scale(0.95);
}
.kw-count {
  animation: kwFadeUp 0.4s ease 0.2s both;
}
.kw-service {
  opacity: 0;
  animation: kwFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.kw-service:hover {
  transform: translateY(-6px);
}
.kw-service:active {
  transform: translateY(-2px) scale(0.99);
}
.kw-service .service-card-photo {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.kw-service:hover .service-card-photo {
  transform: scale(1.08);
}
.kw-service .service-card-tile {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.kw-service:hover .service-card-tile {
  transform: scale(1.15) rotate(-6deg);
}

/* Étape 2 : formulaire */
.kw-form {
  opacity: 0;
  animation: kwFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
}
.kw-field {
  opacity: 0;
  animation: kwSlideRight 0.45s ease forwards;
}
.kw-form .field input,
.kw-form .field select,
.kw-form .field textarea {
  transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}
.kw-form .field input:focus,
.kw-form .field select:focus,
.kw-form .field textarea:focus {
  transform: translateY(-1px);
}
.kw-form .form-actions {
  animation: kwFadeUp 0.5s ease 0.6s both;
}
.kw-aside {
  opacity: 0;
  animation: kwFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.kw-aside > .card .tile {
  animation: kwSuccessPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
.kw-check li {
  opacity: 0;
  animation: kwSlideRight 0.4s ease forwards;
}

/* Boutons */
.kw-wizard-root .btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.25s ease;
}
.kw-wizard-root .btn:hover {
  transform: translateY(-2px);
}
.kw-wizard-root .btn:active {
  transform: scale(0.97);
}

/* Étape 3 : confirmation */
.kw-confirm {
  animation: kwFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.kw-confirm .tile-success {
  animation: kwSuccessPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both, kwRing 1.4s ease-out 0.7s 2;
}
.kw-confirm h2 {
  animation: kwFadeUp 0.5s ease 0.45s both;
}
.kw-confirm > p.muted {
  animation: kwFadeUp 0.5s ease 0.55s both;
}
.kw-confirm .tracking {
  animation: kwPopIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both, kwTrackingGlow 2.4s ease-in-out 1.5s infinite;
}
.kw-confirm .tracking .icon-btn {
  transition: transform 0.2s ease;
}
.kw-confirm .tracking .icon-btn:hover {
  transform: scale(1.2) rotate(-6deg);
}
.kw-confirm .mini-steps li {
  opacity: 0;
  animation: kwSlideRight 0.5s ease forwards;
}
.kw-confirm .btn-row {
  animation: kwFadeUp 0.5s ease 1.5s both;
}

@media (prefers-reduced-motion: reduce) {
  .kw-wizard,
  .kw-wizard li > span,
  .kw-panel,
  .kw-toolbar,
  .kw-chips .chip,
  .kw-count,
  .kw-service,
  .kw-form,
  .kw-field,
  .kw-form .form-actions,
  .kw-aside,
  .kw-aside > .card .tile,
  .kw-check li,
  .kw-confirm,
  .kw-confirm .tile-success,
  .kw-confirm h2,
  .kw-confirm > p.muted,
  .kw-confirm .tracking,
  .kw-confirm .mini-steps li,
  .kw-confirm .btn-row {
    opacity: 1 !important;
    animation: none !important;
    transition: none !important;
  }
}
`;

export const ClientNewRequest: React.FC = () => {
  const { currentUser, createRequest, navigate, openPhotoModal } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(SERVICES[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  
  // Step 2 Form fields
  const [title, setTitle] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [specificDetails, setSpecificDetails] = useState<Record<string, string>>({});
  
  // Step 3 Created request
  const [createdRequest, setCreatedRequest] = useState<Request | null>(null);

  const selectedService = SERVICES.find(s => s.id === selectedServiceId) || SERVICES[0];

  const filteredServices = SERVICES.filter(s => {
    const matchesCat = selectedCategory === 'all' || s.cat === selectedCategory;
    const matchesQ = !catalogSearch.trim() || 
      s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (s.desc || s.short).toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCat && matchesQ;
  });

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    const s = SERVICES.find(x => x.id === id);
    if (s) {
      setTitle(s.name);
      setBudget(s.price);
    }
    setStep(2);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const req = createRequest({
      userId: currentUser.id,
      serviceId: selectedService.id,
      title: title.trim() || selectedService.name,
      city,
      urgency,
      budget: budget.trim() || selectedService.price,
      description: description.trim() || `Demande pour ${selectedService.name}.`,
      details: specificDetails,
    });

    setCreatedRequest(req);
    setStep(3);
  };

  const copyTracking = () => {
    if (createdRequest) {
      navigator.clipboard.writeText(createdRequest.tracking);
      alert('Numéro de suivi copié !');
    }
  };

  return (
    <div className="kw-wizard-root">
      <style>{NEW_REQUEST_ANIMATIONS}</style>

      {/* Wizard Steps Header */}
      <ol className="wizard kw-wizard">
        <li 
          className={`${step > 1 ? 'is-done' : ''} ${step === 1 ? 'is-current' : ''}`}
          aria-current={step === 1 ? 'step' : undefined}
        >
          <span>{step > 1 ? <Icon name="check" size={16} /> : 1}</span>
          Choix du service
        </li>
        <li 
          className={`${step > 2 ? 'is-done' : ''} ${step === 2 ? 'is-current' : ''}`}
          aria-current={step === 2 ? 'step' : undefined}
        >
          <span>{step > 2 ? <Icon name="check" size={16} /> : 2}</span>
          Votre besoin
        </li>
        <li 
          className={step === 3 ? 'is-current is-done' : ''}
          aria-current={step === 3 ? 'step' : undefined}
        >
          <span>{step === 3 ? <Icon name="check" size={16} /> : 3}</span>
          Confirmation
        </li>
      </ol>

      {/* STEP 1: CATALOG OF SERVICES */}
      {step === 1 && (
        <div className="kw-panel">
          <div className="toolbar kw-toolbar">
            <div className="search-field">
              <Icon name="magnifying-glass" size={18} />
              <input
                id="catalog-q"
                type="search"
                placeholder="Rechercher un service…"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="chips kw-chips" role="group" aria-label="Filtrer par univers">
            <button
              className="chip"
              style={{ animationDelay: '0.15s' }}
              type="button"
              aria-pressed={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            >
              Tous
            </button>
            {CATEGORIES.map((c, idx) => (
              <button
                key={c.id}
                className="chip"
                style={{ animationDelay: `${0.25 + idx * 0.08}s` }}
                type="button"
                aria-pressed={selectedCategory === c.id}
                onClick={() => setSelectedCategory(c.id)}
              >
                <Icon name={c.icon} size={18} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          <p className="muted result-count kw-count">
            {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''}
          </p>

          <div className="service-grid">
            {filteredServices.map((service, idx) => (
              <article 
                key={service.id} 
                className="service-card cursor-pointer kw-service"
                style={{ animationDelay: `${0.3 + Math.min(idx, 12) * 0.07}s` }}
                onClick={() => handleSelectService(service.id)}
              >
                <div className="service-card-media relative">
                  <img
                    src={service.photo}
                    alt={service.name}
                    className="service-card-photo"
                  />
                  <span className={`tile service-card-tile cat-${service.cat}`}>
                    <Icon name={service.icon} size={22} />
                  </span>
                </div>
                <div className="service-card-body">
                  <h3 className="service-card-title">{service.name}</h3>
                  <p className="service-card-desc">{service.desc || service.short}</p>
                  <p className="service-card-price">{service.price}</p>
                  <button 
                    type="button" 
                    className="btn btn-outline-gold btn-sm w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectService(service.id);
                    }}
                  >
                    Choisir ce service
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: FORM */}
      {step === 2 && (
        <div className="detail-grid kw-panel">
          <form className="card form-card kw-form" onSubmit={handleCreateSubmit}>
            <h2>Votre besoin en quelques mots</h2>

            <div className="field kw-field" style={{ animationDelay: '0.15s' }}>
              <label className="field-label" htmlFor="req-title">
                Titre de la demande <span className="field-req" aria-hidden="true">*</span>
              </label>
              <input
                id="req-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. : Suivi de ma maison à Calavi"
              />
              <p className="hint">Il vous servira à retrouver votre demande.</p>
            </div>

            <div className="form-grid">
              <div className="field kw-field" style={{ animationDelay: '0.25s' }}>
                <label className="field-label" htmlFor="req-city">
                  Ville au Bénin <span className="field-req" aria-hidden="true">*</span>
                </label>
                <select
                  id="req-city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="field kw-field" style={{ animationDelay: '0.35s' }}>
                <label className="field-label" htmlFor="req-urgency">
                  Urgence <span className="field-req" aria-hidden="true">*</span>
                </label>
                <select
                  id="req-urgency"
                  required
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                >
                  <option value="normal">Normale</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="field kw-field" style={{ animationDelay: '0.45s' }}>
              <label className="field-label" htmlFor="req-desc">
                Description <span className="field-req" aria-hidden="true">*</span>
              </label>
              <textarea
                id="req-desc"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expliquez ce que vous attendez de nous avec précision."
              />
            </div>

            <div className="field kw-field" style={{ animationDelay: '0.55s' }}>
              <label className="field-label" htmlFor="req-budget">
                Budget estimé
              </label>
              <input
                id="req-budget"
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex. : 200 €"
              />
            </div>

            {selectedService.fields && selectedService.fields.length > 0 && (
              <>
                <h2 className="form-section">Détails pour « {selectedService.name} »</h2>
                <div className="form-grid form-grid-auto">
                  {selectedService.fields.map((f, fIdx) => (
                    <div key={f.name} className="field kw-field" style={{ animationDelay: `${0.65 + fIdx * 0.08}s` }}>
                      <label className="field-label" htmlFor={`field-${f.name}`}>
                        {f.label} {f.required && <span className="field-req">*</span>}
                      </label>
                      {f.type === 'select' && f.options ? (
                        <select
                          id={`field-${f.name}`}
                          required={f.required}
                          value={specificDetails[f.name] || ''}
                          onChange={(e) => setSpecificDetails(prev => ({ ...prev, [f.name]: e.target.value }))}
                        >
                          <option value="">Sélectionnez...</option>
                          {f.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          id={`field-${f.name}`}
                          required={f.required}
                          rows={2}
                          value={specificDetails[f.name] || ''}
                          onChange={(e) => setSpecificDetails(prev => ({ ...prev, [f.name]: e.target.value }))}
                        />
                      ) : (
                        <input
                          id={`field-${f.name}`}
                          type="text"
                          required={f.required}
                          value={specificDetails[f.name] || ''}
                          onChange={(e) => setSpecificDetails(prev => ({ ...prev, [f.name]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="form-actions">
              <button 
                className="btn btn-ghost" 
                type="button" 
                onClick={() => setStep(1)}
              >
                <Icon name="arrow-left" size={18} />
                <span>Changer de service</span>
              </button>
              <button className="btn btn-primary btn-lg" type="submit">
                Envoyer ma demande
              </button>
            </div>
          </form>

          <aside className="stack">
            <section className="card kw-aside" style={{ animationDelay: '0.2s' }}>
              <span className={`tile cat-${selectedService.cat}`}>
                <Icon name={selectedService.icon} size={24} />
              </span>
              <h2>{selectedService.name}</h2>
              <p className="price">{selectedService.price}</p>
              <ul className="check-list kw-check">
                {selectedService.included.map((item, idx) => (
                  <li key={idx} style={{ animationDelay: `${0.5 + idx * 0.1}s` }}>
                    <Icon name="check-circle" size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card card-soft kw-aside" style={{ animationDelay: '0.4s' }}>
              <h2>Rien à payer maintenant</h2>
              <p className="muted">
                Vous recevez d'abord un devis. La mission démarre seulement après votre accord et votre paiement.
              </p>
            </section>
          </aside>
        </div>
      )}

      {/* STEP 3: CONFIRMATION */}
      {step === 3 && createdRequest && (
        <section className="card confirm-card text-center max-w-2xl mx-auto py-10 kw-confirm">
          <span className="tile tile-lg tile-success mx-auto mb-4">
            <Icon name="check-circle" size={32} />
          </span>
          <h2>Votre demande est bien reçue</h2>
          <p className="muted">
            Gardez ce numéro de suivi. Vous le retrouvez aussi dans « Mes demandes ».
          </p>

          <p className="tracking my-4 inline-flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-xl">
            <strong>{createdRequest.tracking}</strong>
            <button 
              className="icon-btn" 
              type="button" 
              onClick={copyTracking}
              title="Copier"
              aria-label="Copier le numéro"
            >
              <Icon name="clipboard-document" size={18} />
            </button>
          </p>

          <ol className="mini-steps text-left max-w-md mx-auto my-6">
            <li style={{ animationDelay: '0.9s' }}>Notre équipe étudie votre besoin.</li>
            <li style={{ animationDelay: '1.1s' }}>Vous recevez un devis sous 12 h, par notification et par e-mail.</li>
            <li style={{ animationDelay: '1.3s' }}>La mission démarre après votre paiement.</li>
          </ol>

          <div className="btn-row btn-row-center mt-6">
            <button 
              className="btn btn-primary" 
              type="button"
              onClick={() => navigate('client-request-detail', createdRequest.id)}
            >
              Suivre ma demande
            </button>
            <button 
              className="btn btn-ghost" 
              type="button"
              onClick={() => navigate('client-dashboard')}
            >
              Retour au tableau de bord
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
