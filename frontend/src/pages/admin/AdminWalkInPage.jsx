import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { UserPlus, Bike, Wrench, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminWalkInPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: 'Aruppukkottai',
    registration_number: '',
    brand: '',
    model: '',
    current_odometer: '',
    reported_problem: '',
    assigned_mechanic_id: '',
  });

  const [mechanics, setMechanics] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadMechanics() {
      try {
        const res = await api.get('/admin/mechanics');
        const active = (res.data || []).filter((m) => m.employment_status === 'active');
        setMechanics(active);
        if (active.length > 0) {
          setFormData((f) => ({ ...f, assigned_mechanic_id: active[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load mechanics:', err);
      }
    }
    loadMechanics();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // 1. Register or find walk-in customer and bike
      const walkInRes = await api.post('/admin/walk-in', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        registration_number: formData.registration_number,
        brand: formData.brand,
        model: formData.model,
        current_odometer: parseInt(formData.current_odometer, 10) || 0,
      });

      const { customer_user_id, bike_id } = walkInRes.data;

      // 2. Create Job Card immediately for this walk-in
      const jcRes = await api.post('/admin/job-cards', {
        booking_id: null, // Walk-in has no prior online booking
        customer_user_id: customer_user_id,
        bike_id: bike_id,
        assigned_mechanic_id: formData.assigned_mechanic_id ? parseInt(formData.assigned_mechanic_id, 10) : null,
        reported_problem: formData.reported_problem,
        initial_odometer: parseInt(formData.current_odometer, 10) || 0,
        customer_visible_notes: 'Walk-in job card created at reception desk.',
      });

      setSuccess(`Job card #${jcRes.data.job_card_reference} opened for walk-in customer ${formData.name}!`);
      setTimeout(() => {
        navigate('/admin/job-cards');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to process walk-in customer intake.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Walk-in Customer Intake</h1>
        <p className="text-xs text-[#737373]">
          Quick registration and immediate job card opening for riders visiting the workshop without an appointment.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-xs space-y-6">
        {/* Section 1: Customer Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            1. Rider Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Rider Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arunachalam S"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rider@example.com"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Locality / Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. RS Puram, Aruppukkottai"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Motorcycle Details */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100 flex items-center gap-2">
            <Bike className="w-4 h-4" />
            2. Motorcycle Details
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Registration Number * (e.g. TN-67-EF-8765)
            </label>
            <input
              type="text"
              required
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              placeholder="TN-67-EF-8765"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316] font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Brand *
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="TVS / Honda / RE"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Model *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Apache RTR 200 / Classic 350"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Odometer (km) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.current_odometer}
                onChange={(e) => setFormData({ ...formData, current_odometer: e.target.value })}
                placeholder="16500"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Job Card Assignment */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            3. Work Required & Mechanic Assignment
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Assign Technician
            </label>
            <select
              value={formData.assigned_mechanic_id}
              onChange={(e) => setFormData({ ...formData, assigned_mechanic_id: e.target.value })}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            >
              <option value="">No mechanic assigned initially</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.skills}) — Active: {m.current_workload} jobs
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Reported Problem / Work Description *
            </label>
            <textarea
              rows={3}
              required
              value={formData.reported_problem}
              onChange={(e) => setFormData({ ...formData, reported_problem: e.target.value })}
              placeholder="e.g. Rear brake grinding, general water wash and synthetic oil change"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Generating Job Card...' : 'Open Walk-in Job Card'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
