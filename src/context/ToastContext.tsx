import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast({ type: 'success', message: msg, title }), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast({ type: 'error', message: msg, title: title || 'Error' }), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast({ type: 'info', message: msg, title }), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast({ type: 'warning', message: msg, title: title || 'Notice' }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div id="toast-container" className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto rounded-xl p-4 shadow-lg border flex items-start gap-3 backdrop-blur-md transition-all ${
                  isSuccess
                    ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                    : isError
                    ? 'bg-rose-50/95 border-rose-200 text-rose-950'
                    : isWarning
                    ? 'bg-amber-50/95 border-amber-200 text-amber-950'
                    : 'bg-indigo-50/95 border-indigo-200 text-indigo-950'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  {t.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
                </div>

                <div className="flex-1 text-sm">
                  {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
                  <div className="leading-snug">{t.message}</div>
                </div>

                <button
                  id={`close-toast-${t.id}`}
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
