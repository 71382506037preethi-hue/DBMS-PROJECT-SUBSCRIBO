import React, { useEffect, useState } from 'react';
import { Subscription, Payment, SubscriptionHistory, Plan } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Receipt,
  Layers,
  History,
  Shield,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface UserDashboardProps {
  onNavigate: (view: string) => void;
  onRenewSubscription: (sub: Subscription) => void;
  onUpgradeSubscription: (sub: Subscription) => void;
  onViewSubscriptionDetails: (id: number) => void;
  onViewReceipt: (paymentId: number) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigate,
  onRenewSubscription,
  onUpgradeSubscription,
  onViewSubscriptionDetails,
  onViewReceipt,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, payRes] = await Promise.all([
        api.subscriptions.getAll(),
        api.payments.getAll(),
      ]);
      setSubscriptions(subsRes.subscriptions);
      setPayments(payRes.payments);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load user dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Derive metrics
  const activeSub = subscriptions.find((s) => s.status === 'active' || s.status === 'expiring_soon');
  const totalSpent = payments
    .filter((p) => p.payment_status === 'successful')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalActiveSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'expiring_soon'
  ).length;

  // Toggle auto-renew directly from dashboard
  const handleToggleAutoRenew = async (sub: Subscription) => {
    const newVal = sub.auto_renew === 0;
    try {
      await api.subscriptions.toggleAutoRenew(sub.subscription_id, newVal);
      toast.info(`Auto-renewal has been ${newVal ? 'turned ON' : 'turned OFF'}.`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update auto-renewal setting.');
    }
  };

  const handleCancelSub = async (sub: Subscription) => {
    if (!window.confirm(`Are you sure you want to cancel your ${sub.plan_name} subscription?`)) {
      return;
    }
    try {
      await api.subscriptions.cancel(sub.subscription_id, 'User cancelled from dashboard');
      toast.success('Subscription cancelled successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. WELCOME BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Customer Portal • ID #{user?.user_id}</span>
            </div>
            <h1 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Monitor your active membership, check remaining validity days, download invoice receipts, or switch tiers anytime.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="dashboard-explore-plans-btn"
              onClick={() => onNavigate('plans')}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Browse Plans</span>
            </button>
            <button
              id="dashboard-payments-nav-btn"
              onClick={() => onNavigate('payment-history')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices</span>
            </button>
          </div>
        </div>

        {/* Soft decorative glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* 2. STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Tier
            </span>
            <p className="text-lg font-extrabold text-slate-900 mt-1 truncate max-w-[150px]">
              {activeSub ? activeSub.plan_name : 'None'}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              {activeSub ? `₹${activeSub.price} / ${activeSub.billing_cycle}` : 'No active membership'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Spent (INR)
            </span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              ₹{totalSpent.toFixed(2)}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Across {payments.length} transactions
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Memberships
            </span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {totalActiveSubs}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Total in DB: {subscriptions.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Next Renewal Date
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1.5 font-mono">
              {activeSub ? activeSub.end_date : 'N/A'}
            </p>
            <span className={`text-[11px] font-semibold mt-0.5 block ${
              activeSub && activeSub.days_remaining <= 5 ? 'text-rose-600 font-bold' : 'text-indigo-600'
            }`}>
              {activeSub ? `${activeSub.days_remaining} days remaining` : 'No upcoming renewals'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. CURRENT ACTIVE SUBSCRIPTION CARD (HIGHLIGHTED) */}
      {activeSub ? (
        <div className="bg-white rounded-2xl border-2 border-indigo-500/80 p-6 shadow-md relative overflow-hidden">
          {/* Top banner / badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  SUB #{activeSub.subscription_id}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    activeSub.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeSub.status === 'expiring_soon' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  {activeSub.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900 mt-1">
                {activeSub.plan_name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Auto-Renewal:</span>
              <button
                id="toggle-autorenew-btn"
                onClick={() => handleToggleAutoRenew(activeSub)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeSub.auto_renew === 1
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {activeSub.auto_renew === 1 ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Details & Progress Bar */}
          <div className="py-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Cycle Duration</span>
                <p className="font-bold text-slate-800 capitalize">{activeSub.billing_cycle} ({activeSub.duration_days} days)</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Start Date</span>
                <p className="font-bold text-slate-800">{activeSub.start_date}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Expiry / Renewal Date</span>
                <p className="font-bold text-slate-800">{activeSub.end_date}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Days Remaining</span>
                <p className={`font-bold text-sm ${
                  activeSub.days_remaining <= 5 ? 'text-rose-600 font-extrabold animate-pulse' : 'text-indigo-600'
                }`}>
                  {activeSub.days_remaining} Days
                </p>
              </div>
            </div>

            {/* Cycle progress bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Cycle Progress</span>
                <span>
                  {Math.min(100, Math.max(0, Math.round(((activeSub.duration_days - activeSub.days_remaining) / activeSub.duration_days) * 100)))}% Elapsed
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeSub.days_remaining <= 5 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, Math.round(((activeSub.duration_days - activeSub.days_remaining) / activeSub.duration_days) * 100)))}%`,
                  }}
                />
              </div>
            </div>

            {/* Expiring soon warning notice */}
            {activeSub.status === 'expiring_soon' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your subscription expires in <strong>{activeSub.days_remaining} days</strong>. Renew now to prevent service interruption.
                  </span>
                </div>
                <button
                  id="warning-renew-now-btn"
                  onClick={() => onRenewSubscription(activeSub)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 transition-colors"
                >
                  Renew Now
                </button>
              </div>
            )}
          </div>

          {/* Action buttons row */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <button
              id="sub-card-renew-btn"
              onClick={() => onRenewSubscription(activeSub)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Subscription</span>
            </button>

            <button
              id="sub-card-upgrade-btn"
              onClick={() => onUpgradeSubscription(activeSub)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
            </button>

            <button
              id="sub-card-view-details-btn"
              onClick={() => onViewSubscriptionDetails(activeSub.subscription_id)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Audit & History</span>
            </button>

            <button
              id="sub-card-cancel-btn"
              onClick={() => handleCancelSub(activeSub)}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 ml-auto"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cancel Plan</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
              No Active Subscription
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You currently do not have an active membership. Browse our available plans to subscribe in seconds.
            </p>
          </div>
          <button
            onClick={() => onNavigate('plans')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <span>Explore Subscription Plans</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. RECENT INVOICES & PAYMENTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900">
              Recent Invoices & Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Directly queried from the <code className="text-indigo-600 font-mono">payments</code> table
            </p>
          </div>
          <button
            id="view-all-payments-link"
            onClick={() => onNavigate('payment-history')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center italic">No invoices recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.slice(0, 4).map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-700">
                      {p.transaction_id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {p.plan_name || 'Membership'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{p.amount}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {p.payment_date}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        id={`btn-receipt-${p.payment_id}`}
                        onClick={() => onViewReceipt(p.payment_id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3 text-slate-500" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
