import React, { useEffect, useState } from 'react';
import { Plan } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  BarChart3,
  CreditCard,
  RefreshCw,
  History,
  Users,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onExplorePlans: () => void;
  onGetStarted: () => void;
  onSelectPlan: (plan: Plan) => void;
  onOpenAdminLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExplorePlans,
  onGetStarted,
  onSelectPlan,
  onOpenAdminLogin,
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'all' | 'monthly' | 'yearly'>('all');

  useEffect(() => {
    api.plans
      .getAll()
      .then((res) => setPlans(res.plans))
      .catch((err) => console.error(err))
      .finally(() => setLoadingPlans(false));
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (billingCycle === 'all') return true;
    return p.billing_cycle === billingCycle;
  });

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 sm:pt-14 pb-6 overflow-hidden">
        {/* Soft atmospheric background shapes matching prompt's lavender, coral, sky blue palette */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 overflow-hidden opacity-70">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-rose-200/50 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-indigo-200/50 rounded-full blur-3xl" />
          <div className="absolute top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-200/80 shadow-xs text-xs font-semibold text-slate-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Subscription Management Platform</span>
              <span className="text-slate-300">|</span>
              <span className="text-indigo-600">Smart Recurring Billing</span>
            </div>

            <h1 className="font-['Outfit',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              All Your Subscriptions, <br />
              <span className="bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Manage memberships, recurring billing, seamless renewals, and complete subscription history from one place.
              Powered by automated billing, instant renewals, and zero billing surprises.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="hero-explore-plans-btn"
                onClick={onExplorePlans}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-get-started-btn"
                onClick={onGetStarted}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
              </button>
            </div>

            {/* Micro proof points */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Hidden Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Instant Auto-Renewal Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulated UPI & Card Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            Engineered For Reliability
          </span>
          <h2 className="font-['Outfit',sans-serif] text-3xl font-bold text-slate-900 mt-3">
            Everything You Need To Control Your Subscriptions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Built with smart automated renewals, flexible tier upgrades, and instant invoice tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 mb-2">
              Easy Subscription Management
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Subscribe, renew, upgrade, or cancel your plans with seamless real-time processing and status updates.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 mb-2">
              Flexible Plans & Pricing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore dynamic tiers from Basic to Annual VIP passes. Administrators can create, edit, and deactivate plans on demand.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 mb-2">
              Secure Simulated Payments
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pay via simulated UPI, Debit/Credit Card, or Net Banking. Unique transaction IDs are generated and verified atomically.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 mb-2">
              Automatic Renewal Tracking
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Stay ahead with proactive "Expiring Soon" reminders. Configurable threshold days allow tailored renewal triggers.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 mb-2">
              Subscription History Audit Trail
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every upgrade, renewal, or cancellation is logged into the <code className="text-indigo-600 font-mono">subscription_history</code> table.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-slate-900 mb-2">
              Smart Admin Dashboard & Reports
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time revenue metrics, plan popularity charts, customer segmentation, and downloadable financial reports.
            </p>
          </div>
        </div>
      </section>

      {/* 3. PLANS PREVIEW SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            Transparent Pricing
          </span>
          <h2 className="font-['Outfit',sans-serif] text-3xl font-bold text-slate-900 mt-3">
            Choose The Plan That Fits Your Life
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Flexible subscription tiers tailored for individuals, growing teams, and enterprises.
          </p>

          {/* Billing Cycle Filter Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl mt-6 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                billingCycle === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Pass (Save 20%)
            </button>
          </div>
        </div>

        {loadingPlans ? (
          <div className="text-center py-12 text-sm text-slate-500">
            Loading subscription plans...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlans.map((p) => {
              const isPopular = p.plan_id === 2;
              const isAnnual = p.duration_days >= 365;

              return (
                <div
                  key={p.plan_id}
                  className={`rounded-2xl p-6 transition-all flex flex-col justify-between relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-white to-indigo-50/40 border-2 border-indigo-500 shadow-lg shadow-indigo-100'
                      : isAnnual
                      ? 'bg-gradient-to-b from-white to-amber-50/40 border-2 border-amber-400 shadow-lg shadow-amber-100'
                      : 'bg-white border border-slate-200/80 shadow-xs hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Most Popular
                    </span>
                  )}

                  {isAnnual && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Best Value (2 Mo Free)
                    </span>
                  )}

                  <div>
                    <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 mb-1">
                      {p.plan_name}
                    </h3>
                    <p className="text-xs text-slate-500 min-h-[32px] mb-4 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-extrabold text-slate-900">₹{p.price}</span>
                      <span className="text-xs text-slate-500 capitalize">/{p.billing_cycle}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mb-6 space-y-2.5">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Max {p.max_users} concurrent {p.max_users > 1 ? 'devices/users' : 'device'}</span>
                      </div>

                      {p.features?.map((feat, fidx) => (
                        <div key={fidx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    id={`landing-subscribe-plan-${p.plan_id}`}
                    onClick={() => onSelectPlan(p)}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : isAnnual
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Subscribe Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="space-y-2">
            <h4 className="font-['Outfit',sans-serif] text-base font-bold text-slate-900">
              SUBSCRIBO
            </h4>
            <p className="text-slate-500 leading-relaxed">
              Manage your subscriptions. One place. Zero hassle. A modern subscription management SaaS platform.
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold">
              Enterprise Subscription & Billing Engine
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2.5">Platform</h5>
            <ul className="space-y-1.5 text-slate-500">
              <li><button onClick={onExplorePlans} className="hover:text-slate-900 cursor-pointer">Browse Plans</button></li>
              <li><button onClick={onGetStarted} className="hover:text-slate-900 cursor-pointer">Customer Portal</button></li>
              <li><button onClick={onExplorePlans} className="hover:text-slate-900 cursor-pointer">Pricing Comparison</button></li>
              {onOpenAdminLogin && (
                <li>
                  <button
                    onClick={onOpenAdminLogin}
                    className="hover:text-indigo-600 text-slate-500 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Admin Portal Login</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2.5">Compliance & Security</h5>
            <ul className="space-y-1.5 text-slate-500">
              <li><span>Encrypted User Credentials</span></li>
              <li><span>Secure Billing Automation</span></li>
              <li><span>Instant Payment Verification</span></li>
              <li><span>Simulated Test Mode Gateway</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2.5">System Architecture</h5>
            <p className="text-slate-500 leading-relaxed">
              Engineered with full-stack transactional reliability, automated renewal scheduling, and instant receipt generation.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 SUBSCRIBO. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer">System Documentation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
