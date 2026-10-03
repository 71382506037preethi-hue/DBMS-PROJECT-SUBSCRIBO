import React, { useEffect, useState } from 'react';
import { Plan } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const AdminPlansPage: React.FC = () => {
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form states
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [featuresText, setFeaturesText] = useState('');
  const [maxUsers, setMaxUsers] = useState('1');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await api.plans.getAll({ includeInactive: true });
      setPlans(res.plans);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setDescription('');
    setPrice('');
    setDurationDays('30');
    setBillingCycle('monthly');
    setFeaturesText('Access to all standard content\nCancel anytime');
    setMaxUsers('1');
    setStatus('active');
    setModalOpen(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setPlanName(p.plan_name);
    setDescription(p.description);
    setPrice(String(p.price));
    setDurationDays(String(p.duration_days));
    setBillingCycle(p.billing_cycle);
    setFeaturesText(p.features ? p.features.join('\n') : '');
    setMaxUsers(String(p.max_users));
    setStatus(p.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !price) {
      toast.error('Plan name and price are required.');
      return;
    }

    setSaving(true);
    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const planPayload = {
      plan_name: planName,
      description,
      price: Number(price),
      duration_days: Number(durationDays),
      billing_cycle: billingCycle,
      features,
      max_users: Number(maxUsers),
      status,
    };

    try {
      if (editingPlan) {
        await api.plans.update(editingPlan.plan_id, planPayload);
        toast.success(`Plan "${planName}" updated successfully.`);
      } else {
        await api.plans.create(planPayload);
        toast.success(`New plan "${planName}" created successfully.`);
      }
      setModalOpen(false);
      loadPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p: Plan) => {
    const nextStatus = p.status === 'active' ? 'inactive' : 'active';
    try {
      await api.plans.toggleStatus(p.plan_id, nextStatus);
      toast.success(`Plan marked as ${nextStatus}.`);
      loadPlans();
    } catch (err: any) {
      toast.error('Failed to change status.');
    }
  };

  const handleDelete = async (p: Plan) => {
    if (p.subscriber_count && p.subscriber_count > 0) {
      alert(
        `Cannot delete plan "${p.plan_name}" because ${p.subscriber_count} active subscription(s) reference this plan. Please deactivate the plan instead.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete plan "${p.plan_name}"?`)) return;

    try {
      await api.plans.delete(p.plan_id);
      toast.success('Plan deleted successfully.');
      loadPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete plan.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscription Plans CRUD Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, update, activate/deactivate, or delete subscription tiers backed by the <code className="text-indigo-600 font-mono">plans</code> table.
          </p>
        </div>

        <button
          id="btn-create-new-plan"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Plan</span>
        </button>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isActive = p.status === 'active';

            return (
              <div
                key={p.plan_id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                  isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      PLAN #{p.plan_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 mb-1">
                    {p.plan_name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 min-h-[32px]">{p.description}</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-extrabold text-slate-900">₹{p.price}</span>
                    <span className="text-xs text-slate-400 capitalize">
                      /{p.billing_cycle} ({p.duration_days} days)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Max Devices / Users:</span>
                      <span className="font-semibold text-slate-800">{p.max_users}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Active Subscribers:</span>
                      <span className="font-bold text-indigo-700">{p.subscriber_count || 0}</span>
                    </div>
                  </div>

                  {/* Feature preview */}
                  <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                    {p.features?.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(p)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 mb-1">
              {editingPlan ? `Edit Plan #${editingPlan.plan_id}` : 'Create New Subscription Plan'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Configure pricing, billing frequency, and feature entitlements.
            </p>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Standard 1080p Pass"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of benefits..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="399.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e: any) => setBillingCycle(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Users / Devices</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Features (One feature per line, serialized as JSON)
                </label>
                <textarea
                  rows={3}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Full HD 1080p Resolution&#10;Download on 2 devices&#10;Ad-free listening"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="active">Active (Visible to customers)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {saving ? 'Saving to DB...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
