import React, { useEffect, useState } from 'react';
import { ReportMetrics } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Users,
  CreditCard,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Settings,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const toast = useToast();
  const [data, setData] = useState<{
    metrics: ReportMetrics;
    revenueByPlan: any[];
    statusDistribution: any[];
    monthlyTrends: any[];
    paymentMethods: any[];
    planPopularity: any[];
    recentActivities: any[];
    customerSegments: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [expiringDays, setExpiringDays] = useState<number>(5);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, settingsRes] = await Promise.all([
        api.reports.getDashboard(),
        api.settings.get(),
      ]);
      setData(dashRes);
      if (settingsRes.settings.expiring_soon_days) {
        setExpiringDays(Number(settingsRes.settings.expiring_soon_days));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateExpiringDays = async () => {
    setSavingSettings(true);
    try {
      await api.settings.update({ expiring_soon_days: expiringDays });
      toast.success(
        `Threshold updated to ${expiringDays} days. Statuses recalculated.`,
        'Setting Saved'
      );
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update setting.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        Loading system overview and statistics...
      </div>
    );
  }

  const { metrics, revenueByPlan, statusDistribution, monthlyTrends, paymentMethods, recentActivities } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1 border border-indigo-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
            System Overview & KPI Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time platform metrics, revenue tracking, and active subscription statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin-reports')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Detailed Reports</span>
          </button>
        </div>
      </div>

      {/* 1. KEY METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{Number(metrics.totalRevenue || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            ₹{Number(metrics.monthlyRevenue || 0).toFixed(2)} this month
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Subscriptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {metrics.activeSubscriptions}
          </p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            {metrics.autoRenewRate}% auto-renewal opt-in
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Expiring Soon
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">
            {metrics.expiringSoonSubscriptions}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Expiring in ≤ {expiringDays} days
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {metrics.totalUsers}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.totalCustomers} active customers
          </p>
        </div>
      </div>

      {/* 2. EXPIRING THRESHOLD CONFIGURATION PANEL */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl mt-0.5">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-slate-900">
              Expiring Soon Threshold Configuration
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
              When a subscription’s validity drops below this threshold in days, the system automatically transitions its status to <strong>expiring_soon</strong> and notifies the customer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-amber-200 self-start md:self-auto">
          <label className="text-xs font-semibold text-slate-700">Days:</label>
          <input
            id="admin-expiring-days-input"
            type="number"
            min="1"
            max="60"
            value={expiringDays}
            onChange={(e) => setExpiringDays(Number(e.target.value))}
            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center"
          />
          <button
            id="admin-save-expiring-days-btn"
            disabled={savingSettings}
            onClick={handleUpdateExpiringDays}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Apply & Recalculate'}
          </button>
        </div>
      </div>

      {/* 3. VISUAL DISTRIBUTION GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900">
              Subscription Status Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">Distribution</span>
          </div>

          <div className="space-y-3 pt-2">
            {statusDistribution.map((item, idx) => {
              const total = metrics.activeSubscriptions + metrics.expiredSubscriptions + metrics.cancelledSubscriptions + metrics.expiringSoonSubscriptions || 1;
              const pct = Math.round((item.count / total) * 100);

              const colorClass =
                item.status === 'active'
                  ? 'bg-emerald-500'
                  : item.status === 'expiring_soon'
                  ? 'bg-amber-500'
                  : item.status === 'expired'
                  ? 'bg-slate-400'
                  : 'bg-rose-500';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize text-slate-700">{item.status.replace('_', ' ')}</span>
                    <span className="text-slate-900">
                      {item.count} subscriptions ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900">
              Revenue Generated by Plan
            </h3>
            <span className="text-xs text-slate-400 font-mono">Total Volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {revenueByPlan.map((p, idx) => {
              const maxRev = Math.max(...revenueByPlan.map((x) => x.total_revenue), 1);
              const pct = Math.round((p.total_revenue / maxRev) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{p.plan_name}</span>
                    <span className="text-indigo-600 font-bold">₹{p.total_revenue} ({p.payment_count} payments)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PAYMENT METHODS & RECENT AUDIT LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channels */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900">
            Payment Channels
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((pm, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{pm.payment_method}</p>
                  <p className="text-[11px] text-slate-500">{pm.count} transactions</p>
                </div>
                <p className="font-bold text-slate-900 text-sm">₹{pm.total_volume}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Real-Time Audit Activity Log</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">subscription_history</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {recentActivities.map((act) => (
              <div
                key={act.history_id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700">{act.user_name || 'System User'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 font-semibold text-[10px]">
                      {act.action}
                    </span>
                    <span className="text-slate-600 font-medium">#{act.subscription_id}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{act.notes}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {act.action_date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
