import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, message, type, title, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message: string, title?: string) => showToast(message, 'success', title || 'Success'),
    error: (message: string, title?: string) => showToast(message, 'error', title || 'Action Failed'),
    warning: (message: string, title?: string) => showToast(message, 'warning', title || 'Warning'),
    info: (message: string, title?: string) => showToast(message, 'info', title || 'Notice'),
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-start gap-3 transition-all duration-200 transform translate-y-0 backdrop-blur-md ${
                isSuccess
                  ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20'
                  : isError
                  ? 'bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/20'
                  : isWarning
                  ? 'bg-slate-900/95 text-white border-amber-500/40 shadow-amber-950/20'
                  : 'bg-slate-900/95 text-white border-cyan-500/40 shadow-cyan-950/20'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-cyan-400" />}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <h4 className="text-xs font-bold text-slate-100 tracking-tight leading-tight">
                    {t.title}
                  </h4>
                )}
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5 break-words">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
