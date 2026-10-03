import React, { useState } from 'react';
import { Plan, Subscription } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Loader2,
  Database,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  mode?: 'subscribe' | 'renew' | 'upgrade';
  existingSubscription?: Subscription | null;
  onSuccess: (txnId: string, subscriptionId: number) => void;
  onOpenBackendStorage?: (tableName: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  mode = 'subscribe',
  existingSubscription,
  onSuccess,
  onOpenBackendStorage,
}) => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [method, setMethod] = useState<'UPI' | 'Credit/Debit Card' | 'Net Banking'>('UPI');
  const [autoRenew, setAutoRenew] = useState(true);

  // Form states
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardHolder, setCardHolder] = useState('Demo Customer');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('782');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState<{ txnId: string; subId: number } | null>(null);

  if (!isOpen || !plan) return null;

  const subtotal = Number(plan.price);
  const gstRate = 0.18;
  const basePrice = +(subtotal / (1 + gstRate)).toFixed(2);
  const gstAmount = +(subtotal - basePrice).toFixed(2);

  const handlePay = async () => {
    setProcessing(true);

    try {
      // Simulate realistic payment gateway processing delay
      await new Promise((r) => setTimeout(r, 1200));

      let resTxnId = '';
      let resSubId = 0;

      if (mode === 'subscribe') {
        const res = await api.subscriptions.subscribe({
          plan_id: plan.plan_id,
          payment_method: method,
          auto_renew: autoRenew,
        });
        resTxnId = res.transaction_id;
        resSubId = res.subscription_id;
      } else if (mode === 'renew' && existingSubscription) {
        const res = await api.subscriptions.renew(existingSubscription.subscription_id, method);
        resTxnId = res.transaction_id;
        resSubId = existingSubscription.subscription_id;
      } else if (mode === 'upgrade' && existingSubscription) {
        const res = await api.subscriptions.upgrade(existingSubscription.subscription_id, plan.plan_id, method);
        resTxnId = res.transaction_id;
        resSubId = existingSubscription.subscription_id;
      }

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#EC4899', '#10B981', '#F59E0B'],
        });
      } catch {
        // Safe fallback
      }

      setSuccessData({ txnId: resTxnId, subId: resSubId });
      toast.success(`Payment verified successfully! Txn: ${resTxnId}`, 'Payment Successful');
      onSuccess(resTxnId, resSubId);
    } catch (err: any) {
      toast.error(err.message || 'Payment simulation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinish = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <div
      id="payment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="payment-modal-dialog"
        className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-payment-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* DEMO NOTICE BADGE */}
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>SIMULATED PAYMENT GATEWAY (TEST MODE)</span>
        </div>

        {/* SUCCESS VIEW */}
        {successData ? (
          <div id="payment-success-screen" className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full mb-1.5">
                <Database className="w-3 h-3" />
                <span>COMMITTED TO SQLITE TRANSACTION</span>
              </span>
              <h3 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
                Payment Stored in Database!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Transaction committed atomically to tables: <code className="font-mono text-indigo-700 font-bold">subscriptions</code> & <code className="font-mono text-indigo-700 font-bold">payments</code>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60 font-mono">
                <span className="text-slate-500">transaction_id (PK):</span>
                <span className="font-bold text-indigo-700">{successData.txnId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 font-mono">
                <span className="text-slate-500">subscription_id (FK):</span>
                <span className="font-bold text-emerald-700">#{successData.subscriptionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Plan / Billing:</span>
                <span className="font-bold text-slate-800">{plan.plan_name} ({plan.billing_cycle})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 font-mono">
                <span className="text-slate-500">amount / method:</span>
                <span className="font-bold text-slate-900">₹{plan.price} via {method}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Database Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[11px]">
                  ✓ active / successful
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {isAdmin && (
                <button
                  id="payment-check-backend-btn"
                  onClick={() => {
                    onClose();
                    if (onOpenBackendStorage) {
                      onOpenBackendStorage('subscriptions');
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Check Backend Storage</span>
                </button>
              )}

              <button
                id="payment-success-done-btn"
                onClick={handleFinish}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT FORM VIEW */
          <div>
            <div className="mb-4">
              <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                {mode === 'renew' ? 'Renew Subscription' : mode === 'upgrade' ? 'Upgrade Plan' : 'Confirm Subscription'}
              </h3>
              <p className="text-xs text-slate-500">
                Review payment details for <strong className="text-slate-800">{plan.plan_name}</strong>
              </p>
            </div>

            {/* Price Breakdown Card */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl mb-4 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-600">Base Subscription ({plan.billing_cycle}):</span>
                <span className="font-semibold text-slate-800">₹{basePrice}</span>
              </div>
              <div className="flex justify-between items-center mb-1 text-slate-500">
                <span>Applicable GST (18% included):</span>
                <span>₹{gstAmount}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-amber-200/60 font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600 text-base">₹{plan.price}</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Select Demo Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="method-upi-btn"
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    method === 'UPI'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span>UPI / QR</span>
                </button>

                <button
                  id="method-card-btn"
                  type="button"
                  onClick={() => setMethod('Credit/Debit Card')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    method === 'Credit/Debit Card'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-rose-500" />
                  <span>Card</span>
                </button>

                <button
                  id="method-netbanking-btn"
                  type="button"
                  onClick={() => setMethod('Net Banking')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    method === 'Net Banking'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {/* Method Details */}
            <div className="mb-4">
              {method === 'UPI' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Enter Demo Virtual Payment Address (VPA)</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okhdfcbank"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Scan via GPay, PhonePe, Paytm or use UPI ID.</p>
                </div>
              )}

              {method === 'Credit/Debit Card' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Expiry</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">CVV</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          maxLength={4}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {method === 'Net Banking' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Simulation will route an instant simulated clearance token.</p>
                </div>
              )}
            </div>

            {/* Auto-renew checkbox */}
            {mode === 'subscribe' && (
              <div className="flex items-center mb-4 text-xs">
                <input
                  id="auto-renew-toggle"
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="auto-renew-toggle" className="ml-2 text-slate-700">
                  Enable automatic renewal before expiration
                </label>
              </div>
            )}

            {/* Pay Button */}
            <button
              id="confirm-pay-btn"
              type="button"
              disabled={processing}
              onClick={handlePay}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                  <span>Processing Demo Payment...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{plan.price} & Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure encrypted payment transaction with instant confirmation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
