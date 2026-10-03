import React, { useEffect, useState } from 'react';
import { Payment } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ArrowRight,
} from 'lucide-react';

interface PaymentHistoryPageProps {
  onViewReceipt: (paymentId: number) => void;
}

export const PaymentHistoryPage: React.FC<PaymentHistoryPageProps> = ({
  onViewReceipt,
}) => {
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<{ totalCount: number; successfulCount: number; totalAmount: number }>({
    totalCount: 0,
    successfulCount: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.payments.getAll({
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setPayments(res.payments);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [status, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-['Outfit',sans-serif] text-3xl font-extrabold text-slate-900 tracking-tight">
          Payment History & Invoices
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete ledger of transactions stored in the <code className="text-indigo-600 font-mono">payments</code> table.
        </p>
      </div>

      {/* Metric summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Spent (INR)
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{summary.totalAmount.toFixed(2)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            All Verified Transactions
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Successful Payments
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.successfulCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Out of {summary.totalCount} total attempts
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Invoice Downloads
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            100% Tax Compliant
          </p>
          <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
            GST Breakdowns with 1-Click PDF
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Txn ID or Plan..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-1 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700"
              title="Filter from date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700"
              title="Filter to date"
            />
          </div>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Querying payment transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No payment records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Subscription ID</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const isSuccess = p.payment_status === 'successful';

                  return (
                    <tr key={p.payment_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {p.transaction_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        #{p.subscription_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {p.plan_name || 'Membership'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        ₹{p.amount}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.payment_method}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {p.payment_date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.payment_status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`history-receipt-btn-${p.payment_id}`}
                          onClick={() => onViewReceipt(p.payment_id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
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
