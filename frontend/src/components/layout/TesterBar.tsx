import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, User as UserIcon, HardHat, Globe, RotateCcw, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

export const TesterBar: React.FC = () => {
  const { role, currentUser, switchPersona, resetDemoData } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside aria-label="Banc d'essai et sélecteur de rôles front-end" className="bg-[#123f28] text-white text-xs border-b border-[#2d7a52] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-[#f5c842] uppercase tracking-wider text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Test Front-End
          </span>
          <span className="hidden sm:inline text-white/50">|</span>
          <span className="hidden md:inline text-white/70">
            Interface active : <strong className="text-white capitalize">{role === 'VISITOR' ? 'Site public (Visiteur)' : role === 'USER' ? 'Espace Client' : role === 'ADMIN' ? 'Administration' : 'Agent terrain'}</strong>
            {currentUser && ` (${currentUser.firstName} ${currentUser.lastName})`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!collapsed && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => switchPersona('VISITOR')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  role === 'VISITOR'
                    ? 'bg-[#d4a017] text-[#123f28] font-bold shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Consulter le site public vitrine"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public</span>
                {role === 'VISITOR' && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => switchPersona('USER', 'u01')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  role === 'USER'
                    ? 'bg-[#d4a017] text-[#123f28] font-bold shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Tester l'espace client (Aïcha Sossa)"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Client (Aïcha)</span>
                {role === 'USER' && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => switchPersona('OPERATOR', 'u11')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  role === 'OPERATOR'
                    ? 'bg-[#d4a017] text-[#123f28] font-bold shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Tester l'interface agent terrain (Maxime Dossou)"
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>Agent (Maxime)</span>
                {role === 'OPERATOR' && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => switchPersona('ADMIN', 'u10')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  role === 'ADMIN'
                    ? 'bg-[#d4a017] text-[#123f28] font-bold shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Tester l'administration back-office"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
                {role === 'ADMIN' && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={resetDemoData}
                className="px-2 py-1 rounded text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/15 transition flex items-center gap-1 ml-1"
                title="Réinitialiser toutes les données de test"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden lg:inline">Réinitialiser</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition ml-1"
            title={collapsed ? 'Afficher la barre de test' : 'Masquer la barre de test'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
