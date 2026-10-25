import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Wrench,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Boxes,
  Receipt,
  User,
  Clock,
  Bike,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function AdminJobCardsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('job_card_id');

  const [jobCards, setJobCards] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Job Card Detail Modal
  const [activeJc, setActiveJc] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add Part Modal
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Add Labour Service Modal
  const [labourModalOpen, setLabourModalOpen] = useState(false);
  const [labourDesc, setLabourDesc] = useState('');
  const [labourPrice, setLabourPrice] = useState('');

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Deliver Check Modal
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [overrideUnpaid, setOverrideUnpaid] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const [jcRes, mechRes, partsRes] = await Promise.all([
        api.get(`/admin/job-cards?${params.toString()}`),
        api.get('/admin/mechanics'),
        api.get('/admin/parts')
      ]);

      setJobCards(jcRes.data || []);
      setMechanics(mechRes.data || []);
      setSpareParts(partsRes.data || []);

      if (highlightId && !activeJc) {
        inspectJobCard(highlightId);
      }
    } catch (err) {
      console.error('Failed to load job cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [statusFilter, search]);

  const inspectJobCard = async (id) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/admin/job-cards/${id}`);
      setActiveJc(res.data);
    } catch (err) {
      alert('Failed to load job card details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddLabour = async (e) => {
    e.preventDefault();
    if (!activeJc) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.post(`/admin/job-cards/${activeJc.id}/services`, {
        description: labourDesc,
        unit_price: parseFloat(labourPrice),
        quantity: 1,
      });
      setMsg({ type: 'success', text: 'Labour service added to job card.' });
      setLabourModalOpen(false);
      setLabourDesc('');
      setLabourPrice('');
      inspectJobCard(activeJc.id);
      fetchJobCards();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to add labour item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!activeJc || !selectedPartId) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.post(`/admin/job-cards/${activeJc.id}/parts`, {
        part_id: parseInt(selectedPartId, 10),
        quantity: parseInt(partQty, 10),
      });
      setMsg({ type: 'success', text: 'Spare part allocated and inventory stock updated atomically.' });
      setPartModalOpen(false);
      setSelectedPartId('');
      setPartQty(1);
      inspectJobCard(activeJc.id);
      fetchJobCards();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to allocate spare part.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!activeJc || !newStatus) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.patch(`/admin/job-cards/${activeJc.id}/status`, {
        status: newStatus,
        notes: statusNotes,
      });
      setMsg({ type: 'success', text: `Job card status transitioned to ${newStatus}.` });
      setStatusModalOpen(false);
      inspectJobCard(activeJc.id);
      fetchJobCards();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliver = async (e) => {
    e.preventDefault();
    if (!activeJc) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.post(`/admin/job-cards/${activeJc.id}/deliver`, {
        override_unpaid: overrideUnpaid,
        override_reason: overrideReason,
      });
      setMsg({ type: 'success', text: 'Motorcycle officially delivered to customer!' });
      setDeliverModalOpen(false);
      inspectJobCard(activeJc.id);
      fetchJobCards();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Delivery validation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!activeJc) return;
    if (!window.confirm('Generate official tax invoice for this job card?')) return;
    setSubmitting(true);

    try {
      const res = await api.post(`/admin/job-cards/${activeJc.id}/invoice`, {});
      setMsg({ type: 'success', text: `Invoice #${res.data.invoice_number} generated for ₹${parseFloat(res.data.total_amount).toLocaleString('en-IN')}` });
      inspectJobCard(activeJc.id);
      fetchJobCards();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to generate invoice.' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const config = {
      checked_in: 'bg-purple-50 text-purple-700 border-purple-200',
      diagnosis: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      repair_in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
      quality_check: 'bg-blue-50 text-blue-700 border-blue-200',
      ready_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config[status] || 'bg-neutral-100 text-neutral-600'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Job Cards Management</h1>
          <p className="text-xs text-[#737373]">
            Track workshop bays, assign parts and labour items, manage status transitions, and issue invoices.
          </p>
        </div>

        <Link
          to="/admin/walk-in"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          + Open Walk-in Job Card
        </Link>
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
            placeholder="Search job card ref, motorcycle reg, customer..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
        >
          <option value="">All Workflow Stages</option>
          <option value="checked_in">Checked In</option>
          <option value="diagnosis">Diagnosis</option>
          <option value="repair_in_progress">Repair in Progress</option>
          <option value="quality_check">Quality Check</option>
          <option value="ready_for_delivery">Ready for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Job Cards Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Job Card Ref</th>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">Motorcycle</th>
                <th className="py-3.5 px-4">Assigned Mechanic</th>
                <th className="py-3.5 px-4 text-center">Stage Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {jobCards.map((jc) => (
                <tr key={jc.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                    {jc.job_card_reference}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111] block">{jc.customer_name}</span>
                    <span className="text-[11px] text-[#737373]">{jc.customer_phone}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#111111] block">{jc.bike_brand} {jc.bike_model}</span>
                    <span className="font-mono text-[11px] text-neutral-500">{jc.registration_number}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-neutral-700 font-medium">{jc.mechanic_name || 'Unassigned'}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {statusBadge(jc.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => inspectJobCard(jc.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#111111] hover:bg-[#F97316] transition-colors"
                    >
                      Manage Job Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Job Card Inspection & Operations Modal */}
      {activeJc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E5E5]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#111111]">
                    Job Card #{activeJc.job_card_reference}
                  </h3>
                  {statusBadge(activeJc.status)}
                </div>
                <p className="text-xs text-[#737373]">
                  Motorcycle: <strong>{activeJc.bike_brand} {activeJc.bike_model}</strong> ({activeJc.registration_number}) • Customer: {activeJc.customer_name} ({activeJc.customer_phone})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewStatus(activeJc.status);
                    setStatusNotes('');
                    setStatusModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
                >
                  Change Stage Status
                </button>
                <button onClick={() => setActiveJc(null)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#EA580C]">Actions:</span>
                <button
                  onClick={() => setLabourModalOpen(true)}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#111111] hover:bg-neutral-800"
                >
                  + Add Labour Item
                </button>
                <button
                  onClick={() => setPartModalOpen(true)}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C]"
                >
                  + Allocate Spare Part
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Generate Invoice button */}
                {!activeJc.invoice_id ? (
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Generate Tax Invoice
                  </button>
                ) : (
                  <a
                    href={`/api/v1/admin/invoices/${activeJc.invoice_id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Invoice #{activeJc.invoice_number} ({activeJc.invoice_status?.toUpperCase()})
                  </a>
                )}

                {/* Deliver Motorcycle Check */}
                {activeJc.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      setOverrideUnpaid(false);
                      setOverrideReason('');
                      setDeliverModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Deliver Motorcycle
                  </button>
                )}
              </div>
            </div>

            {/* Reported Problem & Inspection Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F8F8F8] border border-neutral-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#737373] block">Reported Rider Problem</span>
                <p className="text-[#111111] font-medium leading-relaxed">{activeJc.reported_problem}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8F8F8] border border-neutral-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#737373] block">Inspection Findings</span>
                <p className="text-[#111111] font-medium leading-relaxed">{activeJc.inspection_findings || 'Pending diagnosis findings'}</p>
              </div>
            </div>

            {/* Labour Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Labour Services Added ({activeJc.services?.length || 0})
                </h4>
              </div>
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-100 text-neutral-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {activeJc.services?.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2.5 font-medium">{s.description}</td>
                        <td className="p-2.5 text-center">{s.quantity}</td>
                        <td className="p-2.5 text-right">₹{parseFloat(s.unit_price).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-bold">₹{parseFloat(s.line_total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spare Parts Allocated Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Spare Parts Consumed ({activeJc.parts?.length || 0})
                </h4>
              </div>
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-100 text-neutral-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Part Name & SKU</th>
                      <th className="p-2.5 text-center">Qty Consumed</th>
                      <th className="p-2.5 text-right">Selling Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {activeJc.parts?.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-medium">
                          {p.part_name} <span className="font-mono text-[10px] text-neutral-500">({p.sku})</span>
                        </td>
                        <td className="p-2.5 text-center font-bold">{p.quantity}</td>
                        <td className="p-2.5 text-right">₹{parseFloat(p.unit_price).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-bold">₹{parseFloat(p.line_total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Labour Modal */}
      {labourModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">Add Labour Item</h3>
            <form onSubmit={handleAddLabour} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Labour Description *</label>
                <input
                  type="text"
                  required
                  value={labourDesc}
                  onChange={(e) => setLabourDesc(e.target.value)}
                  placeholder="e.g. Front Brake Pad Replacement Labour"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Price (INR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={labourPrice}
                  onChange={(e) => setLabourPrice(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLabourModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Labour Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Spare Part Modal (Atomically decrements inventory stock) */}
      {partModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">Allocate Spare Part to Job Card</h3>
            <p className="text-xs text-[#737373]">
              Allocating a part immediately logs a stock movement and decreases inventory quantity atomically.
            </p>

            <form onSubmit={handleAddPart} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Select Spare Part *</label>
                <select
                  required
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="">Choose part from stock...</option>
                  {spareParts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                      {p.name} ({p.sku}) — Available: {p.stock_quantity} (₹{p.selling_price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={partQty}
                  onChange={(e) => setPartQty(e.target.value)}
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
                  {submitting ? 'Allocating...' : 'Allocate & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">Update Job Card Stage</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Select Stage *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="checked_in">Checked In</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="repair_in_progress">Repair in Progress</option>
                  <option value="quality_check">Quality Check & Wash</option>
                  <option value="ready_for_delivery">Ready for Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Customer Visible Notes</label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Notes shown on customer's live tracker..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdateStatus}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Confirm Stage Transition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Check Modal */}
      {deliverModalOpen && activeJc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">Motorcycle Delivery Handover</h3>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Invoice Status:</span>
                <span className="font-bold">{activeJc.invoice_status?.toUpperCase() || 'NO INVOICE ISSUED'}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-red-600">₹{parseFloat(activeJc.outstanding_balance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {parseFloat(activeJc.outstanding_balance || 0) > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="override"
                    checked={overrideUnpaid}
                    onChange={(e) => setOverrideUnpaid(e.target.checked)}
                    className="accent-[#F97316] mt-0.5"
                  />
                  <label htmlFor="override" className="font-bold text-[#111111]">
                    Authorized Manager Override (Allow delivery with unpaid balance)
                  </label>
                </div>

                {overrideUnpaid && (
                  <div>
                    <label className="block text-xs font-bold text-[#171717] mb-1">
                      Override Reason (Logged in Audit Log) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Regular fleet client, payment promise on monthly credit"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliverModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeliver}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Confirming...' : 'Mark as Delivered'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
