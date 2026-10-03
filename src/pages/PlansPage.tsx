import React, { useEffect, useState } from 'react';
import { Plan, Subscription } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Search,
  Filter,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Tag,
  Check,
} from 'lucide-react';

interface PlansPageProps {
  onSelectPlan: (plan: Plan, mode?: 'subscribe' | 'upgrade') => void;
  userActiveSubscription?: Subscription | null;
}

export const PlansPage: React.FC<PlansPageProps> = ({
  onSelectPlan,
  userActiveSubscription,
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cycle, setCycle] = useState('all');
  const [sort, setSort] = useState('popular');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.plans.getAll({
        search: search.trim() || undefined,
        cycle: cycle !== 'all' ? cycle : undefined,
        sort,
      });
      setPlans(res.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [cycle, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlans();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          Subscription Tiers
        </span>
        <h1 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Flexible Subscription Plans
        </h1>
        <p className="text-sm text-slate-600">
          Select the membership that fits your needs. Upgrades and renewals are automatically computed with instant activation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="plans-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans (e.g. Standard, VIP, Gym)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Cycle Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            {['all', 'monthly', 'quarterly', 'yearly'].map((c) => (
              <button
                key={c}
                id={`filter-cycle-${c}`}
                onClick={() => setCycle(c)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  cycle === c ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Sort:</span>
            <select
              id="plans-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration">Duration (Days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading subscription plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <p className="text-base font-bold text-slate-700">No subscription plans found</p>
          <p className="text-xs text-slate-500">Try adjusting your search keywords or billing cycle filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setCycle('all');
              setSort('popular');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrentPlan = userActiveSubscription && userActiveSubscription.plan_id === p.plan_id;
            const isPopular = p.plan_id === 2;
            const isAnnual = p.duration_days >= 365;

            return (
              <div
                key={p.plan_id}
                className={`rounded-2xl p-6 transition-all flex flex-col justify-between relative bg-white ${
                  isCurrentPlan
                    ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-100'
                    : isPopular
                    ? 'border-2 border-indigo-500 shadow-md ring-2 ring-indigo-50'
                    : isAnnual
                    ? 'border-2 border-amber-400 shadow-md ring-2 ring-amber-50'
                    : 'border border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Badge tags */}
                {isCurrentPlan ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Your Current Plan
                  </span>
                ) : isPopular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </span>
                ) : isAnnual ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Best Value
                  </span>
                ) : null}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                      {p.plan_name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {p.duration_days} Days
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[36px] mb-4 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-slate-900">₹{p.price}</span>
                    <span className="text-xs text-slate-500 capitalize">/{p.billing_cycle}</span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mb-6 space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Up to {p.max_users} users / devices</span>
                    </div>

                    {p.features?.map((feat, fidx) => (
                      <div key={fidx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button Action */}
                <div>
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Currently Subscribed</span>
                    </button>
                  ) : userActiveSubscription ? (
                    <button
                      id={`plans-upgrade-btn-${p.plan_id}`}
                      onClick={() => onSelectPlan(p, 'upgrade')}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Switch to This Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id={`plans-subscribe-btn-${p.plan_id}`}
                      onClick={() => onSelectPlan(p, 'subscribe')}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : isAnnual
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>Subscribe Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 mb-2">
          Tier Comparison Matrix
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Detailed attribute breakdown maintained within the relational schema's JSON features array & constraints.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Feature / Attribute</th>
                <th className="py-3 px-4">Basic Tier</th>
                <th className="py-3 px-4">Standard Tier</th>
                <th className="py-3 px-4">Premium Ultra</th>
                <th className="py-3 px-4">Annual Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Monthly Price</td>
                <td className="py-3 px-4 font-mono font-bold">₹199</td>
                <td className="py-3 px-4 font-mono font-bold">₹399</td>
                <td className="py-3 px-4 font-mono font-bold">₹699</td>
                <td className="py-3 px-4 font-mono font-bold">₹2,999 (Year)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Max Concurrent Screens</td>
                <td className="py-3 px-4">1 Screen</td>
                <td className="py-3 px-4">2 Screens</td>
                <td className="py-3 px-4">4 Screens</td>
                <td className="py-3 px-4">4 Screens</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Streaming Resolution</td>
                <td className="py-3 px-4">720p HD</td>
                <td className="py-3 px-4">1080p FHD</td>
                <td className="py-3 px-4 text-indigo-700 font-bold">4K HDR + Atmos</td>
                <td className="py-3 px-4 text-indigo-700 font-bold">4K HDR + Atmos</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Offline Downloads</td>
                <td className="py-3 px-4 text-slate-400">No</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes (2 devices)</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes (6 devices)</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes (Unlimited)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Auto-Renewal Supported</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
