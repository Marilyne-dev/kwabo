import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, ShieldCheck, Video, Eye } from 'lucide-react';

export const PhotoModal: React.FC = () => {
  const { activePhotoModal, closePhotoModal, addToast } = useApp();

  if (!activePhotoModal) return null;

  const isVideo = activePhotoModal.url.includes('.mp4') || activePhotoModal.title.toLowerCase().includes('vidéo');

  const handleDownload = () => {
    addToast(`Téléchargement de « ${activePhotoModal.title} » démarré.`);
  };

  return (
    <div 
      onClick={closePhotoModal}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header bar */}
        <div className="p-4 bg-black/40 backdrop-blur-md flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#1a5c3a] text-white">
              {isVideo ? <Video className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm truncate max-w-md">
                {activePhotoModal.title}
              </h3>
              <span className="text-[10px] text-neutral-400">
                Livrable certifié et géolocalisé KWABO Bénin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center gap-1.5"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
            <button
              type="button"
              onClick={closePhotoModal}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div className="relative bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
          <img
            src={activePhotoModal.url}
            alt={activePhotoModal.title}
            className="w-full h-full object-contain max-h-[70vh]"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-950 text-white/60 text-[11px] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Horodatage certifié · Visite terrain effectuée
          </span>
          <span>Résolution originale HD</span>
        </div>
      </div>
    </div>
  );
};
