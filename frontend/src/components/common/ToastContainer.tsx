import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isInfo = t.type === 'info';

        return (
          <div
            key={t.id}
            className="pointer-events-auto bg-white rounded-2xl p-4 shadow-2xl border border-neutral-200 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-600" />}
              {isInfo && <Info className="w-4 h-4 text-blue-600" />}
            </div>

            <div className="flex-1 text-xs text-[#1a1f1b] font-medium leading-relaxed">
              {t.message}
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-neutral-400 hover:text-neutral-600 p-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
