import React, { useEffect, useState } from 'react';
import { Subscription } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface AdminSubscriptionsPageProps {
  onViewSubscriptionDetails: (id: number) => void;
}

export const AdminSubscriptionsPage: React.FC<AdminSubscriptionsPageProps> = ({
  onViewSubscriptionDetails,
}) => {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.subscriptions.getAll({
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
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
  }, [status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubscriptions();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
          System-Wide Subscriptions Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete relational view joining <code className="text-indigo-600 font-mono">subscriptions</code>, <code className="text-indigo-600 font-mono">users</code>, and <code className="text-indigo-600 font-mono">plans</code>.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, plan..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50"
          />
        </form>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium overflow-x-auto">
          {['all', 'active', 'expiring_soon', 'expired', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all ${
                status === st ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No subscription records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Sub ID</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Auto Renew</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((s) => {
                  const isActive = s.status === 'active';
                  const isExpiring = s.status === 'expiring_soon';
                  const isCancelled = s.status === 'cancelled';

                  return (
                    <tr key={s.subscription_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        #{s.subscription_id}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{s.user_name}</p>
                        <p className="text-[11px] text-slate-500">{s.user_email}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {s.plan_name} (₹{s.price})
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {s.start_date}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {s.end_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${s.days_remaining <= 5 ? 'text-rose-600 font-bold' : 'text-indigo-600'}`}>
                          {s.days_remaining} Days
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.auto_renew === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.auto_renew === 1 ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExpiring
                              ? 'bg-amber-100 text-amber-800'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewSubscriptionDetails(s.subscription_id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit Log</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
