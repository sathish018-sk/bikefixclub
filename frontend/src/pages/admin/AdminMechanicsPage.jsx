import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Hammer, Plus, Edit2, Phone, Mail, Award, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminMechanicsPage() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    skills: '',
    employment_status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/mechanics');
      setMechanics(res.data || []);
    } catch (err) {
      console.error('Failed to load mechanics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      skills: '',
      employment_status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditId(m.id);
    setFormData({
      name: m.name,
      phone: m.phone,
      email: m.email || '',
      skills: m.skills || '',
      employment_status: m.employment_status || 'active',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      if (editId) {
        await api.put(`/admin/mechanics/${editId}`, formData);
        setMsg({ type: 'success', text: 'Mechanic details updated successfully.' });
      } else {
        await api.post('/admin/mechanics', formData);
        setMsg({ type: 'success', text: 'New technician added to workshop roster.' });
      }
      setModalOpen(false);
      fetchMechanics();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to save mechanic.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Workshop Mechanics Roster</h1>
          <p className="text-xs text-[#737373]">
            Manage certified technicians, workloads, assigned motorcycle bays, and specialty skills.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Technician
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

      {/* Mechanics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mechanics.map((m) => (
          <div key={m.id} className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                m.employment_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
              }`}>
                {m.employment_status}
              </span>
              <button
                onClick={() => openEditModal(m)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111111]">{m.name}</h3>
              <p className="text-xs text-[#737373] mt-0.5">{m.skills || 'General technician'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8F8F8] p-3 rounded-2xl border border-neutral-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Active Jobs</span>
                <span className="text-base font-black text-[#F97316]">{m.active_jobs_count || m.current_workload}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Completed</span>
                <span className="text-base font-black text-emerald-600">{m.completed_jobs_count || 0}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-[#737373] space-y-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>{m.phone}</span>
              </div>
              {m.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">{m.email}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              {editId ? 'Edit Technician Details' : 'Add Technician to Roster'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Muthu Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876500001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Specialties & Skills *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. Royal Enfield specialist, Engine & Transmission overhaul"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Status</label>
                <select
                  value={formData.employment_status}
                  onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {submitting ? 'Saving...' : 'Save Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
