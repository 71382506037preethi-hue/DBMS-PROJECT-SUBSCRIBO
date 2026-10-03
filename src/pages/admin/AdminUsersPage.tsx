import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  CreditCard,
  Eye,
  X,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected user detail modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.users.getAll({
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setUsers(res.users);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Change status of ${user.name} to ${nextStatus}?`)) return;

    try {
      await api.users.updateStatus(user.user_id, nextStatus);
      toast.success(`User status updated to ${nextStatus}.`);
      loadUsers();
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, user: { ...selectedUser.user, status: nextStatus } });
      }
    } catch (err: any) {
      toast.error('Failed to update user status.');
    }
  };

  const openUserDetails = async (userId: number) => {
    setLoadingDetails(true);
    try {
      const res = await api.users.getById(userId);
      setSelectedUser(res);
    } catch (err) {
      toast.error('Failed to load user profile details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
          Customer & User Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Direct administration of the <code className="text-indigo-600 font-mono">users</code> table, enforcing referential integrity.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No user records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Subscribed Plan & Status</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isActive = u.status === 'active';
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{u.user_id}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400">Joined {u.created_at?.split(' ')[0]}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <p>{u.email}</p>
                        {u.phone && <p className="text-[11px] text-slate-400">{u.phone}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.current_plan_name ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-indigo-600" />
                                <span>{u.current_plan_name}</span>
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.current_subscription_status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : u.current_subscription_status === 'expiring_soon'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.current_subscription_status || 'active'}
                              </span>
                            </div>
                            {u.latest_subscription_end && (
                              <p className="text-[10px] text-slate-500 font-mono">
                                Valid till: {u.latest_subscription_end}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400">
                              Total plans: {u.total_subscriptions || 0}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                            No Subscription
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{u.total_spent || 0}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openUserDetails(u.user_id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition-colors"
                        >
                          Details
                        </button>
                        {!isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors ${
                              isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  USER #{selectedUser.user.user_id}
                </span>
                <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900 mt-1">
                  {selectedUser.user.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedUser.user.email}
                  </span>
                  {selectedUser.user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedUser.user.phone}
                    </span>
                  )}
                  <span>Role: <strong className="capitalize">{selectedUser.user.role}</strong></span>
                </div>
              </div>

              {/* Subscriptions belonging to this user */}
              <div>
                <h3 className="font-['Outfit',sans-serif] text-base font-bold text-slate-900 mb-2">
                  Active & Past Subscriptions
                </h3>
                {selectedUser.subscriptions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No subscriptions on record.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.subscriptions.map((s: any) => (
                      <div
                        key={s.subscription_id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {s.plan_name} (₹{s.price})
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            {s.start_date} to {s.end_date} • {s.days_remaining} days left
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments belonging to this user */}
              <div>
                <h3 className="font-['Outfit',sans-serif] text-base font-bold text-slate-900 mb-2">
                  Payment History ({selectedUser.payments.length} Transactions)
                </h3>
                {selectedUser.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No payments recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.payments.map((p: any) => (
                      <div
                        key={p.payment_id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-mono font-bold text-indigo-700">{p.transaction_id}</p>
                          <p className="text-slate-500 text-[11px]">{p.payment_method} • {p.payment_date}</p>
                        </div>
                        <span className="font-bold text-slate-900 text-sm">₹{p.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
