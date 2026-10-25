import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { CreditCard, Search, ShieldCheck, Download, Calendar } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [methodFilter, setMethodFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (methodFilter) params.append('payment_method', methodFilter);

      const res = await api.get(`/admin/payments?${params.toString()}`);
      setPayments(res.data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  const totalCollected = payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Payments Ledger</h1>
          <p className="text-xs text-[#737373]">
            Audit log of all payments verified online through Razorpay and recorded in cash or UPI at the workshop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          >
            <option value="">All Payment Methods</option>
            <option value="online_gateway">Razorpay Gateway (Online)</option>
            <option value="cash">Cash at Workshop</option>
            <option value="upi_workshop">UPI Direct at Workshop</option>
            <option value="card_workshop">POS Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-between text-xs">
        <div>
          <span className="text-[#737373]">Total Verified Payments Shown:</span>
          <span className="text-lg font-black text-emerald-600 ml-2">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <span className="text-neutral-400 font-mono">{payments.length} Transactions</span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Payment Ref</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Payment Channel</th>
                <th className="py-3.5 px-4">Transaction / UTR #</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Receiving Staff / Provider</th>
                <th className="py-3.5 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                    {p.payment_reference}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-600">
                    {p.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#111111]">
                    {p.customer_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800">
                      {p.payment_method?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                    {p.provider_transaction_id || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                    ₹{parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600">
                    {p.receiving_staff_name || (p.provider === 'razorpay' ? 'Razorpay Gateway' : 'Workshop Admin')}
                  </td>
                  <td className="py-3.5 px-4 text-right text-neutral-400">
                    {new Date(p.paid_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
