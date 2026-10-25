import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const highlightInvoiceId = searchParams.get('invoice_id');

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes] = await Promise.all([
        api.get('/customer/invoices'),
        api.get('/customer/payments')
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPayModal = (invoice) => {
    setActiveInvoice(invoice);
    setPayAmount(parseFloat(invoice.outstanding_balance).toString());
    setPayModalOpen(true);
    setMsg({ type: '', text: '' });
  };

  const handleOnlinePayment = async () => {
    if (!activeInvoice) return;
    setPaymentProcessing(true);
    setMsg({ type: '', text: '' });

    try {
      // 1. Initialize Razorpay order from backend
      const orderRes = await api.post(`/customer/invoices/${activeInvoice.id}/payment-orders`, {
        amount: parseFloat(payAmount),
      });

      const { order_id, amount, key_id } = orderRes.data;

      // 2. Simulate Razorpay Sandbox Gateway Checkout Dialog / Verification
      // In live environment, opens new Razorpay(options).open()
      const mockRazorpayPaymentId = 'pay_sandbox_' + Math.random().toString(36).substring(2, 12);
      const mockSignature = 'sandbox_sig_' + Math.random().toString(36).substring(2, 16);

      // 3. Send payment signature and details to backend for authoritative verification
      const verifyRes = await api.post(`/customer/payments/${activeInvoice.id}/verify`, {
        order_id: order_id,
        payment_id: mockRazorpayPaymentId,
        signature: mockSignature,
        amount: amount,
      });

      setMsg({
        type: 'success',
        text: `Payment of ₹${amount.toLocaleString('en-IN')} verified successfully! Reference: ${verifyRes.data.payment_reference}`
      });
      setPayModalOpen(false);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Payment verification failed.' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const statusBadge = (status) => {
    const config = {
      paid: { label: 'PAID IN FULL', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      partially_paid: { label: 'PARTIALLY PAID', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      issued: { label: 'UNPAID / ISSUED', bg: 'bg-red-50 text-red-700 border-red-200' },
      draft: { label: 'DRAFT', bg: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
      cancelled: { label: 'CANCELLED', bg: 'bg-neutral-100 text-neutral-400 border-neutral-200' },
    };
    const s = config[status] || { label: status, bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Invoices & Workshop Billing</h1>
        <p className="text-xs text-[#737373]">
          Download official itemized tax invoices and complete secure online payments.
        </p>
      </div>

      {msg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ type: '', text: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
          <Receipt className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Invoices Issued Yet</h3>
          <p className="text-xs text-[#737373]">
            When workshop repairs are completed and billed by our administration, your invoices will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const hasBalance = parseFloat(inv.outstanding_balance) > 0;
            const isHighlighted = highlightInvoiceId && inv.id.toString() === highlightInvoiceId;

            return (
              <div
                key={inv.id}
                className={`p-6 rounded-3xl bg-white border transition-all ${
                  isHighlighted ? 'border-[#F97316] ring-2 ring-[#F97316]/20' : 'border-[#E5E5E5]'
                } space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#111111] bg-neutral-100 px-2.5 py-1 rounded">
                      {inv.invoice_number}
                    </span>
                    <span className="text-xs text-[#737373]">
                      Job Card: <strong>{inv.job_card_reference}</strong>
                    </span>
                    {statusBadge(inv.status)}
                  </div>

                  <div className="text-xs text-[#737373]">
                    Issue Date: <strong>{inv.issue_date}</strong> (Due: {inv.due_date})
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400">Motorcycle</span>
                    <span className="font-bold text-[#111111]">{inv.bike_brand} {inv.bike_model}</span>
                    <span className="block text-[11px] font-mono text-[#737373]">{inv.registration_number}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400">Total Billed</span>
                    <span className="text-base font-black text-[#111111]">
                      ₹{parseFloat(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400">Amount Paid</span>
                    <span className="text-base font-bold text-emerald-600">
                      ₹{parseFloat(inv.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400">Outstanding Balance</span>
                    <span className={`text-base font-black ${hasBalance ? 'text-red-600' : 'text-neutral-500'}`}>
                      ₹{parseFloat(inv.outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {inv.notes && (
                  <p className="text-[11px] text-[#737373] bg-[#F8F8F8] p-2.5 rounded-xl border border-neutral-100">
                    {inv.notes}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100">
                  <div className="text-xs text-[#737373]">
                    Workshop Tax Invoice (GST 18%) • BikeFix Club Aruppukkottai
                  </div>

                  <div className="flex items-center gap-3">
                    {/* View / Print PDF Link */}
                    <a
                      href={`/api/v1/customer/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View & Print Invoice
                    </a>

                    {/* Pay Online Button (if balance exists) */}
                    {hasBalance && (
                      <button
                        onClick={() => openPayModal(inv)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Online (Razorpay)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {payModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-[#111111]">Razorpay Sandbox Checkout</h3>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2 text-xs">
              <div className="flex justify-between font-medium text-neutral-800">
                <span>Invoice Number:</span>
                <span className="font-mono font-bold text-[#111111]">{activeInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between font-medium text-neutral-800">
                <span>Total Invoice Amount:</span>
                <span>₹{parseFloat(activeInvoice.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-red-600 pt-1 border-t border-orange-200">
                <span>Current Balance Due:</span>
                <span>₹{parseFloat(activeInvoice.outstanding_balance).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Payment Amount (INR) *
              </label>
              <input
                type="number"
                min="1"
                max={activeInvoice.outstanding_balance}
                step="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-base font-bold text-[#111111] rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
              <span className="text-[11px] text-[#737373] mt-1 block">
                Supports partial or full payments. Verified by Razorpay sandbox HMAC SHA256 engine.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 text-[11px] text-neutral-600 border border-neutral-200 space-y-1">
              <p>🔒 <strong>Secure Gateway Simulation:</strong></p>
              <p>Test Razorpay order generation, signature verification, and instant invoice reconciliation.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={handleOnlinePayment}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                {paymentProcessing ? 'Verifying with Gateway...' : `Authorize & Pay ₹${parseFloat(payAmount || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
