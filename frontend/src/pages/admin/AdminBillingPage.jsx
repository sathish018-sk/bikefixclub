import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Receipt,
  Search,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Record Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');
  const [payTxnId, setPayTxnId] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/invoices?${params.toString()}`);
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  const openPayModal = (inv) => {
    setActiveInvoice(inv);
    setPayAmount(parseFloat(inv.outstanding_balance).toString());
    setPayMethod('cash');
    setPayTxnId('');
    setPayNotes(`Payment received at workshop counter`);
    setPayModalOpen(true);
    setMsg({ type: '', text: '' });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await api.post(`/admin/invoices/${activeInvoice.id}/record-payment`, {
        payment_method: payMethod,
        amount: parseFloat(payAmount),
        provider_transaction_id: payTxnId || undefined,
        notes: payNotes,
      });

      setMsg({ type: 'success', text: `Payment of ₹${parseFloat(payAmount).toLocaleString('en-IN')} recorded for Invoice #${activeInvoice.invoice_number}.` });
      setPayModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to record workshop payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const config = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
      issued: 'bg-red-50 text-red-700 border-red-200',
      draft: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      cancelled: 'bg-neutral-100 text-neutral-400 border-neutral-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config[status] || 'bg-neutral-100 text-neutral-600'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Billing & Invoices</h1>
          <p className="text-xs text-[#737373]">
            Authoritative workshop billing ledger with automated GST calculations and payment recording.
          </p>
        </div>
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

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer, motorcycle reg..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
        >
          <option value="">All Invoice Statuses</option>
          <option value="issued">Issued / Unpaid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid in Full</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Motorcycle</th>
                <th className="py-3.5 px-4 text-right">Total Billed</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.map((inv) => {
                const hasBalance = parseFloat(inv.outstanding_balance) > 0;

                return (
                  <tr key={inv.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                      {inv.invoice_number}
                      <span className="block text-[10px] text-neutral-400">Job: {inv.job_card_reference}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#111111] block">{inv.customer_name}</span>
                      <span className="text-[11px] text-[#737373]">{inv.customer_phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#111111] block">{inv.bike_brand} {inv.bike_model}</span>
                      <span className="font-mono text-[11px] text-neutral-500">{inv.registration_number}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#111111]">
                      ₹{parseFloat(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      ₹{parseFloat(inv.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className={hasBalance ? 'text-red-600' : 'text-neutral-400'}>
                        ₹{parseFloat(inv.outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {statusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Printable PDF Link */}
                        <a
                          href={`/api/v1/admin/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-[#111111] hover:bg-neutral-100 transition-colors"
                          title="Print / View PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </a>

                        {/* Record Payment Button */}
                        {hasBalance && (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="px-3 py-1 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            + Record Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Workshop Payment Modal */}
      {payModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              Record Payment: #{activeInvoice.invoice_number}
            </h3>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{activeInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between font-bold text-red-600">
                <span>Outstanding Balance:</span>
                <span>₹{parseFloat(activeInvoice.outstanding_balance).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="cash">Cash at Workshop Counter</option>
                  <option value="upi_workshop">Workshop QR / UPI Direct</option>
                  <option value="card_workshop">POS Card Swipe</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Payment Amount (INR) *</label>
                <input
                  type="number"
                  min="1"
                  max={activeInvoice.outstanding_balance}
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Reference / UTR / Cash Receipt #</label>
                <input
                  type="text"
                  value={payTxnId}
                  onChange={(e) => setPayTxnId(e.target.value)}
                  placeholder="e.g. UPI Ref / Cash Memo #"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Notes / Receiving Staff Comment</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Payment Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
