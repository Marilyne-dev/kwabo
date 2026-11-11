import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const TOAST_META = {
  success: {
    icon: CheckCircle2,
    iconBox: 'bg-[#e8f5ee] text-[#1a5c3a]',
    accentBar: 'bg-[#1a5c3a]',
    border: 'border-[#cfe5d7]',
    durationMs: 4500,
  },
  error: {
    icon: XCircle,
    iconBox: 'bg-[#fdf0ea] text-[#a8420f]',
    accentBar: 'bg-[#c9561e]',
    border: 'border-[#f2d0be]',
    durationMs: 6000,
  },
  warning: {
    icon: AlertTriangle,
    iconBox: 'bg-[#fdf6e0] text-[#8a6200]',
    accentBar: 'bg-[#d4a017]',
    border: 'border-[#f1e3ae]',
    durationMs: 5500,
  },
  info: {
    icon: Info,
    iconBox: 'bg-[#eef4f8] text-[#1d4e6b]',
    accentBar: 'bg-[#2a6f97]',
    border: 'border-[#d3e2ec]',
    durationMs: 4500,
  },
} as const;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      style={{ top: 20, right: 20, zIndex: 2147483647 }}
      className="pointer-events-none fixed left-4 right-4 flex flex-col gap-2.5 sm:left-auto sm:w-[390px]"
    >
      <style>{`
        @keyframes kwToastSlideIn {
          from { opacity: 0; transform: translate3d(24px, -10px, 0) scale(0.97); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes kwToastShrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        .kw-toast-item {
          animation: kwToastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .kw-toast-progress {
          transform-origin: left;
          animation: kwToastShrink linear forwards;
        }
        .kw-toast-item:hover .kw-toast-progress {
          animation-play-state: paused;
        }
      `}</style>

      {toasts.map((t) => {
        const meta = TOAST_META[t.type] || TOAST_META.info;
        const StatusIcon = meta.icon;

        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`kw-toast-item pointer-events-auto relative overflow-hidden rounded-2xl border bg-white/95 backdrop-blur-md shadow-[0_14px_36px_rgba(18,63,40,0.16)] ${meta.border}`}
          >
            <div className="flex items-center gap-3 p-3.5 pr-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconBox}`}>
                <StatusIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </div>

              <p className="min-w-0 flex-1 text-[13.5px] font-medium leading-snug text-[#1a1f1b]">
                {t.message}
              </p>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Fermer la notification"
                className="shrink-0 rounded-lg p-1.5 text-[#56635b] transition hover:bg-[#eef1ef] hover:text-[#1a1f1b]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[3px] w-full bg-[#eef1ef]">
              <div
                className={`kw-toast-progress h-full w-full ${meta.accentBar}`}
                style={{ animationDuration: `${meta.durationMs}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
