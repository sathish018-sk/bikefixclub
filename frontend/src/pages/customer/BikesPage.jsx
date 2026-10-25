import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Bike,
  Plus,
  Edit2,
  Trash2,
  CalendarPlus,
  AlertCircle,
  X,
  CheckCircle2,
  Gauge,
  Fuel,
  Calendar
} from 'lucide-react';

export default function BikesPage() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBikeId, setEditBikeId] = useState(null);

  const [formData, setFormData] = useState({
    registration_number: '',
    brand: '',
    model: '',
    variant: '',
    manufacturing_year: new Date().getFullYear(),
    fuel_type: 'Petrol',
    current_odometer: 0,
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/bikes');
      setBikes(res.data || []);
    } catch (err) {
      console.error('Failed to load bikes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const openAddModal = () => {
    setEditBikeId(null);
    setFormData({
      registration_number: '',
      brand: '',
      model: '',
      variant: '',
      manufacturing_year: 2022,
      fuel_type: 'Petrol',
      current_odometer: 10000,
      notes: '',
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (bike) => {
    setEditBikeId(bike.id);
    setFormData({
      registration_number: bike.registration_number,
      brand: bike.brand,
      model: bike.model,
      variant: bike.variant || '',
      manufacturing_year: bike.manufacturing_year || 2022,
      fuel_type: bike.fuel_type || 'Petrol',
      current_odometer: bike.current_odometer || 0,
      notes: bike.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editBikeId) {
        await api.put(`/customer/bikes/${editBikeId}`, formData);
        setSuccess('Motorcycle details updated successfully.');
      } else {
        await api.post('/customer/bikes', formData);
        setSuccess('Motorcycle registered successfully.');
      }
      setModalOpen(false);
      fetchBikes();
    } catch (err) {
      setError(err.message || 'Failed to save motorcycle details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bikeId) => {
    if (!window.confirm('Are you sure you want to remove or archive this motorcycle? Historical service records and invoices will remain intact.')) {
      return;
    }

    try {
      await api.delete(`/customer/bikes/${bikeId}`);
      setSuccess('Motorcycle removed or safely archived.');
      fetchBikes();
    } catch (err) {
      alert(err.message || 'Failed to remove motorcycle.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">My Motorcycles</h1>
          <p className="text-xs text-[#737373]">
            Register and manage your garage. Book services and maintain your bike's service logs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register Motorcycle
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bikes Grid */}
      {bikes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <Bike className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Motorcycles Added Yet</h3>
          <p className="text-xs text-[#737373] max-w-sm mx-auto">
            Add your motorcycle details once and use them for all future quick service bookings.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316]"
          >
            <Plus className="w-4 h-4" />
            Add Your Bike
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bikes.map((bike) => (
            <div
              key={bike.id}
              className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#F97316]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-neutral-900 text-white font-mono text-xs font-bold tracking-wider">
                    {bike.registration_number}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(bike)}
                      className="p-1.5 text-neutral-500 hover:text-[#111111] hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bike.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove / Archive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#111111]">{bike.brand} {bike.model}</h3>
                  {bike.variant && <p className="text-xs text-[#737373]">{bike.variant}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-xs text-[#737373]">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{bike.current_odometer.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{bike.manufacturing_year || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{bike.fuel_type || 'Petrol'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#111111] font-semibold">
                    <span>{bike.total_bookings} Services</span>
                  </div>
                </div>

                {bike.notes && (
                  <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-lg italic">
                    "{bike.notes}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#E5E5E5]">
                <Link
                  to={`/customer/book?bike_id=${bike.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Book Service for This Bike
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Motorcycle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
              <h3 className="text-lg font-bold text-[#111111]">
                {editBikeId ? 'Edit Motorcycle Details' : 'Register New Motorcycle'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Registration Number * (e.g. TN-67-AB-1234)
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editBikeId}
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="TN-67-AB-1234"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316] uppercase font-mono disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Brand * (e.g. Royal Enfield)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Yamaha / RE / KTM"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Model * (e.g. Classic 350)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Classic 350 / MT-15"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Variant / Edition (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                    placeholder="Dual Channel ABS"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Manufacturing Year
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={formData.manufacturing_year}
                    onChange={(e) => setFormData({ ...formData, manufacturing_year: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Current Odometer (km) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.current_odometer}
                    onChange={(e) => setFormData({ ...formData, current_odometer: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Rider Notes / Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Always use Motul 7100 oil; check front fork noise"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editBikeId ? 'Update Motorcycle' : 'Register Motorcycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
