import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  History,
  TrendingUp,
  X,
  CheckCircle2,
  AlertCircle,
  Edit2
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [searchParams] = useSearchParams();
  const initialLowStock = searchParams.get('low_stock') === '1';

  const [parts, setParts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(initialLowStock);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'movements'

  // Modals
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [partForm, setPartForm] = useState({
    sku: '',
    name: '',
    category: 'Lubricants',
    brand: 'Motul',
    description: '',
    purchase_price: '',
    selling_price: '',
    stock_quantity: 10,
    minimum_stock: 5,
  });

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustPart, setAdjustPart] = useState(null);
  const [adjustType, setAdjustType] = useState('purchase');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStockFilter) params.append('low_stock', '1');

      const [partsRes, smRes] = await Promise.all([
        api.get(`/admin/parts?${params.toString()}`),
        api.get('/admin/stock-movements')
      ]);

      setParts(partsRes.data || []);
      setMovements(smRes.data || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, lowStockFilter]);

  const openAddModal = () => {
    setEditId(null);
    setPartForm({
      sku: '',
      name: '',
      category: 'Lubricants',
      brand: 'Motul',
      description: '',
      purchase_price: '',
      selling_price: '',
      stock_quantity: 10,
      minimum_stock: 5,
    });
    setPartModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditId(p.id);
    setPartForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      brand: p.brand,
      description: p.description || '',
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
      minimum_stock: p.minimum_stock,
    });
    setPartModalOpen(true);
  };

  const handleSavePart = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      if (editId) {
        await api.put(`/admin/parts/${editId}`, partForm);
        setMsg({ type: 'success', text: 'Spare part updated successfully.' });
      } else {
        await api.post('/admin/parts', partForm);
        setMsg({ type: 'success', text: 'New spare part added to inventory with opening stock movement.' });
      }
      setPartModalOpen(false);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to save spare part.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustPart) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const qty = parseInt(adjustQty, 10);
      const qtyChange = adjustType === 'usage' ? -Math.abs(qty) : Math.abs(qty);

      await api.post(`/admin/parts/${adjustPart.id}/stock-adjustments`, {
        movement_type: adjustType,
        quantity_change: qtyChange,
        reason: adjustReason || `Stock ${adjustType} recorded`,
      });

      setMsg({ type: 'success', text: `Stock adjusted for ${adjustPart.name}.` });
      setAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustReason('');
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to adjust stock.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalStockValuation = parts.reduce(
    (acc, p) => acc + (parseFloat(p.purchase_price) * parseInt(p.stock_quantity, 10)),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Spare Parts & Inventory</h1>
          <p className="text-xs text-[#737373]">
            Track workshop inventory levels, record stock purchases, monitor stock movements, and prevent stockouts.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Spare Part
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Total SKUs</span>
          <p className="text-2xl font-black text-[#111111]">{parts.length}</p>
          <span className="text-[11px] text-[#737373]">Active catalogued parts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Inventory Valuation (Cost)</span>
          <p className="text-2xl font-black text-emerald-600">
            ₹{totalStockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-[#737373]">Documented purchasing value</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Low-Stock Warnings</span>
          <p className="text-2xl font-black text-amber-600">
            {parts.filter((p) => p.stock_quantity <= p.minimum_stock).length}
          </p>
          <span className="text-[11px] text-[#737373]">Below reorder threshold</span>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'stock' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:text-[#111111]'
            }`}
          >
            Inventory Stock Items ({parts.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'movements' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:text-[#111111]'
            }`}
          >
            Stock Movements Log ({movements.length})
          </button>
        </div>

        {activeTab === 'stock' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                lowStockFilter
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-[#E5E5E5] text-[#737373] hover:border-amber-400'
              }`}
            >
              ⚠️ Low Stock Only
            </button>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, name, brand..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stock Tab Table */}
      {activeTab === 'stock' ? (
        <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4">Part Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Purchase Price</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-center">Stock Level</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {parts.map((p) => {
                  const isLow = p.stock_quantity <= p.minimum_stock;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#111111] block">{p.name}</span>
                        <span className="text-[11px] text-[#737373]">{p.brand}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-700">
                        {p.category}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-500">
                        ₹{parseFloat(p.purchase_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#111111]">
                        ₹{parseFloat(p.selling_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${
                          p.stock_quantity <= 0
                            ? 'bg-red-100 text-red-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.stock_quantity} units
                          {isLow && <span title="Low stock threshold met">⚠️</span>}
                        </span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5">Min: {p.minimum_stock}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAdjustPart(p);
                              setAdjustType('purchase');
                              setAdjustQty('');
                              setAdjustReason('');
                              setAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Tab Table */
        <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Part / SKU</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4 text-center">Qty Change</th>
                  <th className="py-3.5 px-4">Reason / Reference</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 font-mono">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#111111]">
                      {m.part_name} <span className="font-mono text-[10px] text-neutral-400">({m.sku})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800">
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={m.quantity_change > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {m.reason} {m.reference_id && <span className="font-mono text-[10px]">({m.reference_id})</span>}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {m.user_name || 'System Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Part Modal */}
      {partModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              {editId ? 'Edit Spare Part' : 'Add New Spare Part to Inventory'}
            </h3>

            <form onSubmit={handleSavePart} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editId}
                    value={partForm.sku}
                    onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })}
                    placeholder="OIL-MOTUL-7100"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316] uppercase font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={partForm.category}
                    onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                    placeholder="Lubricants / Brakes / Filters"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Part Name *</label>
                  <input
                    type="text"
                    required
                    value={partForm.name}
                    onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                    placeholder="Motul 7100 4T 10W-40 1L"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={partForm.brand}
                    onChange={(e) => setPartForm({ ...partForm, brand: e.target.value })}
                    placeholder="Motul / Brembo / NGK"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Purchase Cost (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={partForm.purchase_price}
                    onChange={(e) => setPartForm({ ...partForm, purchase_price: e.target.value })}
                    placeholder="650"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Selling Price (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={partForm.selling_price}
                    onChange={(e) => setPartForm({ ...partForm, selling_price: e.target.value })}
                    placeholder="850"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">
                    {editId ? 'Current Stock Quantity' : 'Opening Stock *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={!!editId}
                    value={partForm.stock_quantity}
                    onChange={(e) => setPartForm({ ...partForm, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Minimum Alert Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={partForm.minimum_stock}
                    onChange={(e) => setPartForm({ ...partForm, minimum_stock: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={partForm.description}
                  onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                  placeholder="Part specifications, compatibility notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPartModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Stock Adjustment Modal */}
      {adjustModalOpen && adjustPart && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              Record Stock Adjustment: {adjustPart.name}
            </h3>
            <p className="text-xs text-[#737373]">
              Current stock: <strong>{adjustPart.stock_quantity} units</strong> (Min: {adjustPart.minimum_stock})
            </p>

            <form onSubmit={handleRecordAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Adjustment Type *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="purchase">Purchase Stock Entry (+)</option>
                  <option value="return">Supplier Return / Scrap (-)</option>
                  <option value="adjustment">Manual Physical Audit Correction (+/-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Units Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Reason / Supplier Invoice Ref *</label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Motul distributor delivery invoice #MOT-9921"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
