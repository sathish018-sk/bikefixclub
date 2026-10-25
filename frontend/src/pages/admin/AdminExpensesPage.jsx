import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { TrendingDown, Plus, Search, Calendar, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'workshop_supplies',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payee: '',
    payment_method: 'cash',
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await api.get(`/admin/expenses?${params.toString()}`);
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.post('/admin/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setMsg({ type: 'success', text: 'Workshop operating expense recorded successfully.' });
      setModalOpen(false);
      setFormData({
        category: 'workshop_supplies',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payee: '',
        payment_method: 'cash',
      });
      fetchExpenses();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to record expense.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Workshop Expenses Ledger</h1>
          <p className="text-xs text-[#737373]">
            Track workshop supplies, equipment maintenance, utilities, and daily operating costs.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
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

      {/* KPI & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5E5E5] text-xs">
        <div>
          <span className="text-[#737373]">Total Operating Expenses Recorded:</span>
          <span className="text-lg font-black text-[#111111] ml-2">
            ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
        >
          <option value="">All Categories</option>
          <option value="workshop_supplies">Workshop Supplies</option>
          <option value="tools_equipment">Tools & Equipment</option>
          <option value="utilities">Utilities & Electricity</option>
          <option value="rent">Workshop Rent</option>
          <option value="salaries">Salaries</option>
          <option value="maintenance">Maintenance</option>
          <option value="miscellaneous">Miscellaneous</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Payee / Vendor</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#111111]">{e.expense_date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800">
                      {e.category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{e.description}</td>
                  <td className="py-3 px-4 font-semibold text-[#111111]">{e.payee}</td>
                  <td className="py-3 px-4 uppercase text-[11px] text-neutral-500">{e.payment_method}</td>
                  <td className="py-3 px-4 text-right font-black text-red-600">
                    ₹{parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{e.recorded_by_name || 'Admin'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">Record Workshop Operating Expense</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="workshop_supplies">Workshop Supplies (Rags, Degreaser)</option>
                  <option value="tools_equipment">Tools & Equipment</option>
                  <option value="utilities">Utilities & Electricity (TANGEDCO)</option>
                  <option value="rent">Workshop Rent</option>
                  <option value="salaries">Salaries</option>
                  <option value="maintenance">Facility Maintenance</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Digital Tyre Pressure Gauge & Nitrogen Chuck"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="2800"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Payee / Vendor *</label>
                  <input
                    type="text"
                    required
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                    placeholder="e.g. Bosch Tools Dist"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
