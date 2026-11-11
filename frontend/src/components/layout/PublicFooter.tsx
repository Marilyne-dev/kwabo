import React from 'react';
import { MessageSquare, ShieldCheck, MapPin, Mail, Phone, Heart } from 'lucide-react';
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from '../../data/kwaboData';
import { useApp } from '../../context/AppContext';

export const PublicFooter: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="public-footer bg-[#123f28] text-white pt-16 pb-12 border-t border-[#1a4d30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#d4a017] text-[#123f28] flex items-center justify-center font-display font-bold text-2xl shadow-sm">
                K
              </span>
              <span className="font-display font-bold text-2xl tracking-tight text-white">
                KWABO<span className="text-[#f5c842]">.</span>
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Votre présence de confiance au Bénin. Suivi de chantier avec vidéos 360°, soutien médical et familial, démarches administratives et frais sécurisés pour la diaspora béninoise.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-white/70">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#f5c842]" />
                <span>Siège opérationnel : Haie Vive, Cotonou, République du Bénin</span>
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#f5c842]" />
                <span>Standard WhatsApp : {WHATSAPP_DISPLAY}</span>
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#f5c842]" />
                <span>contact@kwabo.bj</span>
              </span>
            </div>
          </div>

          {/* Univers / Services */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-semibold text-[#f5c842] tracking-wide">
              Nos Pôles d'intervention
            </h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><a href="#services" className="hover:text-white transition">Suivi de chantier & Villa</a></li>
              <li><a href="#services" className="hover:text-white transition">Vérification foncière ANDF</a></li>
              <li><a href="#services" className="hover:text-white transition">Santé & hôpital pour proches</a></li>
              <li><a href="#services" className="hover:text-white transition">Paiement factures SBEE/SONEB</a></li>
              <li><a href="#services" className="hover:text-white transition">Visas & inscriptions fac</a></li>
              <li><a href="#services" className="hover:text-white transition">Création de société APIEx</a></li>
              <li><a href="#services" className="hover:text-white transition">Frais Europe → Bénin</a></li>
            </ul>
          </div>

          {/* Garanties & Sécurité */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-semibold text-[#f5c842] tracking-wide">
              Garanties & Transparence
            </h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Vidéos & photos horodatées</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Reçus scannés à l'euro près</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Contrat de mission signé</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Devis ferme sans surcoût</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Paiements Stripe / Wise / MoMo</li>
            </ul>
          </div>

          {/* Accès rapide */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-semibold text-[#f5c842] tracking-wide">
              Espace & Contact
            </h4>
            <div className="flex flex-col gap-2.5">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#2d7a52] text-sm font-semibold text-white transition hover:bg-[#1a5c3a]"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span className="text-white">WhatsApp Direct (+229)</span>
              </a>
            </div>
            <p className="text-xs text-white/60 pt-2 leading-relaxed">
              Interventions sur Cotonou, Calavi, Porto-Novo, Ouidah, Parakou et Bohicon.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <div className="flex items-center gap-1">
            <span>© 2026 KWABO. Fait avec</span>
            <Heart className="w-3.5 h-3.5 text-red-400 inline" />
            <span>pour la diaspora béninoise dans le monde.</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('cgu')}
              className="hover:text-white transition cursor-pointer"
            >
              Mentions légales & CGU
            </button>
            <button
              type="button"
              onClick={() => navigate('privacy')}
              className="hover:text-white transition cursor-pointer"
            >
              Politique de confidentialité
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
