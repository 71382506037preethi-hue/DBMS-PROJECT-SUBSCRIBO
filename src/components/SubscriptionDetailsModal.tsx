import React, { useEffect, useState } from 'react';
import { Subscription, Payment, SubscriptionHistory } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Receipt,
  Shield,
  Layers,
  History,
  Check,
} from 'lucide-react';

interface SubscriptionDetailsModalProps {
  subscriptionId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRenewClick: (sub: Subscription) => void;
  onUpgradeClick: (sub: Subscription) => void;
  onViewReceipt: (paymentId: number) => void;
  onSubscriptionUpdated: () => void;
}

export const SubscriptionDetailsModal: React.FC<SubscriptionDetailsModalProps> = ({
  subscriptionId,
  isOpen,
  onClose,
  onRenewClick,
  onUpgradeClick,
  onViewReceipt,
  onSubscriptionUpdated,
}) => {
  const toast = useToast();
  const [subData, setSubData] = useState<{
    subscription: Subscription;
    payments: Payment[];
    history: SubscriptionHistory[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isOpen && subscriptionId) {
      setLoading(true);
      api.subscriptions
        .getById(subscriptionId)
        .then((res) => setSubData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, subscriptionId]);

  if (!isOpen || !subscriptionId) return null;

  const handleCancelSubscription = async () => {
    if (!subData) return;
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    setCancelling(true);
    try {
      await api.subscriptions.cancel(subData.subscription.subscription_id, 'User requested cancellation');
      toast.success('Subscription status changed to Cancelled.', 'Cancelled');
      onSubscriptionUpdated();
      // Reload details
      const refreshed = await api.subscriptions.getById(subscriptionId);
      setSubData(refreshed);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subData) return;
    const currentVal = subData.subscription.auto_renew === 1;
    try {
      await api.subscriptions.toggleAutoRenew(subData.subscription.subscription_id, !currentVal);
      toast.info(`Auto-renew has been ${!currentVal ? 'activated' : 'deactivated'}.`);
      onSubscriptionUpdated();
      const refreshed = await api.subscriptions.getById(subscriptionId);
      setSubData(refreshed);
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle auto-renewal.');
    }
  };

  const sub = subData?.subscription;
  const payments = subData?.payments || [];
  const history = subData?.history || [];

  return (
    <div
      id="sub-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="sub-details-modal-dialog"
        className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-sub-details-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !sub ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading subscription details and history...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                  SUB #{sub.subscription_id}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    sub.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sub.status === 'expiring_soon'
                      ? 'bg-amber-100 text-amber-800'
                      : sub.status === 'expired'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {sub.status.replace('_', ' ')}
                </span>
              </div>

              <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
                {sub.plan_name}
              </h2>
              <p className="text-xs text-slate-500">
                Customer: <strong className="text-slate-700">{sub.user_name}</strong> ({sub.user_email})
              </p>
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Plan Price
                </span>
                <p className="text-base font-bold text-slate-900">₹{sub.price}</p>
                <span className="text-[10px] text-slate-500 capitalize">{sub.billing_cycle}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Start Date
                </span>
                <p className="text-xs font-bold text-slate-800">{sub.start_date}</p>
                <span className="text-[10px] text-slate-500">Subscribed</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  End Date
                </span>
                <p className="text-xs font-bold text-slate-800">{sub.end_date}</p>
                <span className="text-[10px] text-indigo-600 font-semibold">{sub.days_remaining} days left</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Auto Renew
                </span>
                <button
                  onClick={handleToggleAutoRenew}
                  className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${
                    sub.auto_renew === 1
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {sub.auto_renew === 1 ? 'ENABLED' : 'OFF'}
                </button>
                <span className="text-[9px] text-slate-400 block mt-0.5">Click to toggle</span>
              </div>
            </div>

            {/* Plan Features Included */}
            {sub.features && sub.features.length > 0 && (
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-950 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Included Plan Entitlements:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-indigo-900">
                  {sub.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              {sub.status !== 'cancelled' && (
                <>
                  <button
                    id="modal-renew-btn"
                    onClick={() => {
                      onClose();
                      onRenewClick(sub);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renew Subscription</span>
                  </button>

                  <button
                    id="modal-upgrade-btn"
                    onClick={() => {
                      onClose();
                      onUpgradeClick(sub);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Upgrade Plan</span>
                  </button>

                  <button
                    id="modal-cancel-btn"
                    disabled={cancelling}
                    onClick={handleCancelSubscription}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Cancel Subscription</span>
                  </button>
                </>
              )}

              {payments.length > 0 && (
                <button
                  id="modal-receipt-btn"
                  onClick={() => onViewReceipt(payments[0].payment_id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors ml-auto"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download Latest Receipt</span>
                </button>
              )}
            </div>

            {/* Audit History Timeline */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Subscription History & Audit Log (DBMS Table: subscription_history)
              </h3>

              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No historical changes logged.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div
                      key={h.history_id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{h.action}</span>
                          {h.old_plan_name && h.new_plan_name && (
                            <span className="text-[10px] text-slate-500">
                              ({h.old_plan_name} → {h.new_plan_name})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{h.notes}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                        {h.action_date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
