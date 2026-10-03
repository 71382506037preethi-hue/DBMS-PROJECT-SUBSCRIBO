import React, { useEffect, useState } from 'react';
import { InvoiceReceipt } from '../types.ts';
import { api } from '../services/api.ts';
import { X, Printer, Download, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';

interface InvoiceReceiptModalProps {
  paymentId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  paymentId,
  isOpen,
  onClose,
}) => {
  const [receipt, setReceipt] = useState<InvoiceReceipt | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && paymentId) {
      setLoading(true);
      api.payments
        .getReceipt(paymentId)
        .then((res) => {
          setReceipt(res.receipt);
        })
        .catch((err) => console.error('Failed to load receipt:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, paymentId]);

  if (!isOpen || !paymentId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="receipt-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="receipt-modal-dialog"
        className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <CreditCard className="w-5 h-5" />
            <span>SUBSCRIBO OFFICIAL TAX INVOICE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-invoice-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              id="close-receipt-btn"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading || !receipt ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Generating tax receipt...
          </div>
        ) : (
          <div id="printable-invoice" className="pt-5 space-y-6 text-slate-800">
            {/* Header / Brand info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
                  SUBSCRIBO
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{receipt.issuedBy}</p>
                <p className="text-xs text-slate-500">{receipt.address}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">GSTIN: {receipt.gstNumber}</p>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PAID
                </span>
                <p className="font-mono font-bold text-sm text-slate-800 mt-2">
                  Invoice #{receipt.payment_id}
                </p>
                <p className="text-slate-500">Date: {receipt.payment_date}</p>
              </div>
            </div>

            {/* Bill to & Txn info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Billed To:
                </span>
                <p className="font-bold text-slate-900 text-sm">{receipt.user_name}</p>
                <p className="text-slate-600">{receipt.user_email}</p>
                {receipt.user_phone && <p className="text-slate-600">{receipt.user_phone}</p>}
              </div>

              <div>
                <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Transaction Details:
                </span>
                <p className="text-slate-700">
                  Ref: <span className="font-mono font-bold text-indigo-700">{receipt.transaction_id}</span>
                </p>
                <p className="text-slate-700">Payment Mode: <strong>{receipt.payment_method}</strong></p>
                <p className="text-slate-700">Subscription ID: #{receipt.subscription_id}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Plan / Description</th>
                    <th className="p-3">Period Validity</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{receipt.plan_name}</p>
                      <p className="text-slate-500 text-[11px] capitalize">{receipt.billing_cycle} billing cycle</p>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {receipt.start_date} to {receipt.end_date}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      ₹{receipt.baseAmount}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-4 bg-slate-50/70 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value:</span>
                  <span>₹{receipt.baseAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span>₹{receipt.gstAmount}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total (INR):</span>
                  <span className="text-indigo-600 text-base">₹{receipt.amount}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-2 text-center text-[11px] text-slate-400">
              <p>This is a computer-generated electronic receipt.</p>
              <p className="mt-0.5">Thank you for subscribing with Subscribo!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
