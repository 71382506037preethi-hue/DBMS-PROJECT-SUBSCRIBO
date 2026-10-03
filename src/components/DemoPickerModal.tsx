import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { X, Sparkles, UserCheck, Shield, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface DemoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectedRedirect: (user?: any) => void;
}

export const DemoPickerModal: React.FC<DemoPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectedRedirect,
}) => {
  const { quickLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.auth.getDemoUsers().then((res) => {
        setAccounts(res.demoAccounts);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (acc: any) => {
    setLoading(true);
    const loggedUser = await quickLogin(acc.email, acc.password);
    setLoading(false);
    if (loggedUser) {
      onClose();
      onSelectedRedirect(loggedUser);
    }
  };

  return (
    <div
      id="demo-picker-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="demo-picker-dialog"
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-demo-picker-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
              Demo Account Switcher
            </h3>
            <p className="text-xs text-slate-500">
              Select any pre-seeded account to test role-specific workflows
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {accounts.map((acc, idx) => {
            const isAdmin = acc.role === 'admin';
            const isExpiring = acc.name.includes('Expiring');
            const isVip = acc.name.includes('Annual');

            return (
              <div
                key={idx}
                id={`demo-account-item-${idx}`}
                onClick={() => handleSelect(acc)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isAdmin
                    ? 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/70 hover:border-indigo-300'
                    : isExpiring
                    ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300'
                    : isVip
                    ? 'bg-sky-50/70 border-sky-200 hover:bg-sky-100/70 hover:border-sky-300'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isAdmin
                      ? 'bg-indigo-600 text-white'
                      : isExpiring
                      ? 'bg-amber-500 text-white'
                      : isVip
                      ? 'bg-sky-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {isAdmin ? (
                      <Shield className="w-4 h-4" />
                    ) : isExpiring ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{acc.name}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        isAdmin ? 'bg-indigo-200/80 text-indigo-900' : 'bg-slate-200/80 text-slate-800'
                      }`}>
                        {acc.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{acc.email}</p>
                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                      {acc.description}
                    </p>
                  </div>
                </div>

                <div className="pl-3 shrink-0">
                  <span className="p-2 rounded-lg bg-white/90 shadow-2xs group-hover:bg-white text-slate-700 flex items-center group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>All accounts are pre-configured for instant testing</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
