import React, { useEffect, useState } from 'react';
import { Subscription } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MySubscriptionsPageProps {
  onRenew: (sub: Subscription) => void;
  onUpgrade: (sub: Subscription) => void;
  onViewDetails: (id: number) => void;
  onExplorePlans: () => void;
}

export const MySubscriptionsPage: React.FC<MySubscriptionsPageProps> = ({
  onRenew,
  onUpgrade,
  onViewDetails,
  onExplorePlans,
}) => {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.subscriptions.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setSubscriptions(res.subscriptions);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubscriptions();
  };

  const handleToggleAutoRenew = async (sub: Subscription) => {
    const newVal = sub.auto_renew === 0;
    try {
      await api.subscriptions.toggleAutoRenew(sub.subscription_id, newVal);
      toast.info(`Auto-renew is now ${newVal ? 'Active' : 'Disabled'}.`);
      loadSubscriptions();
    } catch {
      toast.error('Failed to update auto-renewal.');
    }
  };

  const handleCancel = async (sub: Subscription) => {
    if (!window.confirm(`Are you sure you want to cancel ${sub.plan_name}?`)) return;
    try {
      await api.subscriptions.cancel(sub.subscription_id, 'User cancelled');
      toast.success('Subscription cancelled.');
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
            My Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View all current, renewing, and past subscriptions linked to your account.
          </p>
        </div>

        <button
          onClick={onExplorePlans}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs self-start sm:self-auto"
        >
          + Subscribe New Plan
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions by plan..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </form>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium overflow-x-auto max-w-full">
          {['all', 'active', 'expiring_soon', 'expired', 'cancelled'].map((st) => (
            <button
              key={st}
              id={`filter-sub-status-${st}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-800">
              No Subscriptions Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any subscriptions matching the selected filter.
            </p>
          </div>
          <button
            onClick={onExplorePlans}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Explore Available Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const isActive = sub.status === 'active';
            const isExpiring = sub.status === 'expiring_soon';
            const isCancelled = sub.status === 'cancelled';
            const isExpired = sub.status === 'expired';

            return (
              <div
                key={sub.subscription_id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isExpiring
                    ? 'border-amber-300 ring-2 ring-amber-50'
                    : isActive
                    ? 'border-emerald-300'
                    : isCancelled
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      SUB #{sub.subscription_id}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isExpiring
                          ? 'bg-amber-100 text-amber-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isExpiring && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {sub.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 mb-1">
                    {sub.plan_name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-extrabold text-slate-900">₹{sub.price}</span>
                    <span className="text-xs text-slate-400 capitalize">/{sub.billing_cycle}</span>
                  </div>

                  {/* Dates */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Start Date:</span>
                      <span className="font-semibold text-slate-800">{sub.start_date}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Renewal / Expiry:</span>
                      <span className="font-semibold text-slate-800">{sub.end_date}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 font-medium">
                      <span>Validity:</span>
                      <span className={sub.days_remaining <= 5 ? 'text-rose-600 font-bold' : 'text-indigo-600 font-bold'}>
                        {sub.days_remaining} Days Left
                      </span>
                    </div>
                  </div>

                  {/* Auto-renew switch */}
                  <div className="flex items-center justify-between mb-4 px-1 text-xs">
                    <span className="text-slate-500">Auto-Renewal:</span>
                    <button
                      onClick={() => handleToggleAutoRenew(sub)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        sub.auto_renew === 1
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {sub.auto_renew === 1 ? 'ENABLED' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onViewDetails(sub.subscription_id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {!isCancelled ? (
                      <button
                        onClick={() => onRenew(sub)}
                        className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renew</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic text-center py-1.5">Cancelled</span>
                    )}
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => onUpgrade(sub)}
                        className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Upgrade Tier</span>
                      </button>

                      <button
                        onClick={() => handleCancel(sub)}
                        className="text-rose-600 hover:text-rose-700 font-medium text-[11px]"
                      >
                        Cancel Plan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
