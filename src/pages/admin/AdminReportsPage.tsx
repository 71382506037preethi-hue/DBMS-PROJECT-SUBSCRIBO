import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Layers,
  Users,
  DollarSign,
  PieChart,
  ShieldCheck,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.reports.getDashboard({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        Aggregating financial and subscriber reports...
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const revenueByPlan = data?.revenueByPlan || [];
  const statusDistribution = data?.statusDistribution || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const planPopularity = data?.planPopularity || [];
  const customerSegments = Array.isArray(data?.customerSegments) ? data.customerSegments : [];
  const paymentMethods = data?.paymentMethods || [];

  const totalRecordedSubs =
    Number(metrics.activeSubscriptions || 0) +
    Number(metrics.expiredSubscriptions || 0) +
    Number(metrics.cancelledSubscriptions || 0) +
    Number(metrics.expiringSoonSubscriptions || 0);

  const arpu = (
    Number(metrics.totalRevenue || 0) / Math.max(1, Number(metrics.activeSubscriptions || 0))
  ).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Management Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audited financial, subscriber, and plan analytics generated dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-white p-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-none text-xs text-slate-700 bg-transparent"
              title="From date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-none text-xs text-slate-700 bg-transparent"
              title="To date"
            />
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div id="printable-admin-report" className="space-y-6">
        {/* REPORT 1: SUBSCRIPTION METRICS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>1. Subscription Status & Renewal Report</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">DBMS: subscriptions table</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Recorded</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {totalRecordedSubs}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Active Status</span>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{metrics.activeSubscriptions || 0}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Expiring Soon</span>
              <p className="text-xl font-bold text-amber-900 mt-0.5">{metrics.expiringSoonSubscriptions || 0}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Expired</span>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{metrics.expiredSubscriptions || 0}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Cancelled</span>
              <p className="text-xl font-bold text-rose-900 mt-0.5">{metrics.cancelledSubscriptions || 0}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Auto-Renewal Adoption Rate: <strong className="text-indigo-600">{metrics.autoRenewRate || 0}%</strong> of subscribers have opted into automated recurring payments.
          </p>
        </div>

        {/* REPORT 2: REVENUE BREAKDOWN */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>2. Financial & Revenue Report (INR)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">DBMS: payments table (SUM aggregate)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-800 uppercase block">Total System Revenue</span>
              <p className="text-2xl font-extrabold text-emerald-950 mt-1">₹{Number(metrics.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <span className="text-xs font-bold text-indigo-800 uppercase block">Current Month (30 Days)</span>
              <p className="text-2xl font-extrabold text-indigo-950 mt-1">₹{Number(metrics.monthlyRevenue || 0).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl">
              <span className="text-xs font-bold text-sky-800 uppercase block">Average Revenue Per Subscriber (ARPU)</span>
              <p className="text-2xl font-extrabold text-sky-950 mt-1">
                ₹{arpu}
              </p>
            </div>
          </div>

          {/* Revenue by Plan table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Plan Name</th>
                  <th className="p-3">Billing Cycle</th>
                  <th className="p-3">Payment Transactions</th>
                  <th className="p-3 text-right">Total Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {revenueByPlan.map((rp: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 font-bold text-slate-900">{rp.plan_name}</td>
                    <td className="p-3 capitalize">{rp.billing_cycle}</td>
                    <td className="p-3 font-mono">{rp.payment_count || 0}</td>
                    <td className="p-3 text-right font-bold text-indigo-700">₹{Number(rp.total_revenue || rp.plan_revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REPORT 3: PLAN POPULARITY REPORT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <span>3. Plan Performance & Popularity Ranking</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Ranked by Volume</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Plan Name</th>
                  <th className="p-3">Price Point</th>
                  <th className="p-3">Total Subscriptions</th>
                  <th className="p-3">Active Now</th>
                  <th className="p-3 text-right">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {planPopularity.map((pp: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 font-mono font-bold">#{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{pp.plan_name}</td>
                    <td className="p-3">₹{pp.price}</td>
                    <td className="p-3 font-bold text-indigo-600">{pp.subscriber_count ?? pp.subscribers ?? 0}</td>
                    <td className="p-3 font-semibold text-emerald-700">{pp.active_count ?? 0}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx === 0 ? 'Top Seller' : 'Standard'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REPORT 4: CUSTOMER STATUS SEGMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>4. Customer Engagement & Account Segmentation</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">DBMS: users JOIN subscriptions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {customerSegments.map((cs: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase block">{cs.segment}</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{cs.user_count} Users</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Avg Spent: ₹{Number(cs.avg_spent || 0).toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* REPORT 5: PAYMENT METHODS BREAKDOWN */}
        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>5. Payment Gateways & Methods Distribution</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">DBMS: payments GROUP BY payment_method</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paymentMethods.map((pm: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase block">{pm.payment_method}</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{Number(pm.total_amount || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pm.transaction_count} successful transactions
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORT 6: MONTHLY TRENDS */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span>6. Monthly Revenue Trends</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">DBMS: strftime('%Y-%m', payment_date)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {monthlyTrends.map((mt: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Month: {mt.month}</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{Number(mt.revenue || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {mt.payment_count} transactions recorded
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
