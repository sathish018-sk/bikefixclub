import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, Edit2, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    standard_price: '',
    estimated_duration: 60,
    is_active: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/public/service-categories')
      ]);
      setServices(svcRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load catalogue services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id.toString() : '',
      description: '',
      standard_price: '',
      estimated_duration: 60,
      is_active: 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditId(s.id);
    setFormData({
      name: s.name,
      category_id: s.category_id.toString(),
      description: s.description || '',
      standard_price: s.standard_price,
      estimated_duration: s.estimated_duration || 60,
      is_active: s.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      if (editId) {
        await api.put(`/admin/services/${editId}`, formData);
        setMsg({ type: 'success', text: 'Service details updated in catalogue.' });
      } else {
        await api.post('/admin/services', formData);
        setMsg({ type: 'success', text: 'New service created and added to public catalogue.' });
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to save service.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Service Catalogue Management</h1>
          <p className="text-xs text-[#737373]">
            Configure labour rates, estimated durations, service descriptions, and public visibility.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Service
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

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Service Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Standard Price</th>
                <th className="py-3.5 px-4 text-center">Duration</th>
                <th className="py-3.5 px-4 text-center">Active Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#111111]">
                    {s.name}
                    <span className="block text-[11px] font-normal text-[#737373] max-w-sm truncate">
                      {s.description}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-neutral-700">
                    {s.category_name}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-[#111111]">
                    ₹{parseFloat(s.standard_price).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-neutral-600 font-medium">
                    ~{s.estimated_duration} mins
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.is_active === 1
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                    }`}>
                      {s.is_active === 1 ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openEditModal(s)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-[#F97316] hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                  </td>
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
            <h3 className="text-lg font-bold text-[#111111]">
              {editId ? 'Edit Service' : 'Add New Service to Catalogue'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Synthetic Engine Oil Change"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Category *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Standard Price (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.standard_price}
                    onChange={(e) => setFormData({ ...formData, standard_price: e.target.value })}
                    placeholder="799"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                    placeholder="60"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of what the service includes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="accent-[#F97316]"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-[#171717]">
                  Active and visible on public website & booking form
                </label>
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
                  {submitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
