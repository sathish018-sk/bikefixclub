import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Wrench,
  X,
  AlertCircle,
  Calendar,
  ChevronRight
} from 'lucide-react';

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [activeBooking, setActiveBooking] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [assignedMechanicId, setAssignedMechanicId] = useState('');
  const [initialOdometer, setInitialOdometer] = useState('');
  const [reportedProblem, setReportedProblem] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (search) params.append('search', search);

      const [bkRes, mechRes] = await Promise.all([
        api.get(`/admin/bookings?${params.toString()}`),
        api.get('/admin/mechanics')
      ]);
      setBookings(bkRes.data || []);
      setMechanics(mechRes.data || []);
    } catch (err) {
      console.error('Failed to load admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter, search]);

  const handleUpdateStatus = async () => {
    if (!activeBooking || !newStatus) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.patch(`/admin/bookings/${activeBooking.id}/status`, {
        status: newStatus,
        notes: statusNotes || `Status updated to ${newStatus} by admin`,
      });
      setMsg({ type: 'success', text: `Booking #${activeBooking.booking_reference} status updated to ${newStatus}.` });
      setStatusModalOpen(false);
      fetchBookings();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateJobCard = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await api.post('/admin/job-cards', {
        booking_id: activeBooking.id,
        customer_user_id: activeBooking.customer_user_id,
        bike_id: activeBooking.bike_id,
        assigned_mechanic_id: assignedMechanicId ? parseInt(assignedMechanicId, 10) : null,
        reported_problem: reportedProblem || activeBooking.problem_description,
        initial_odometer: parseInt(initialOdometer, 10) || activeBooking.current_odometer || 0,
        customer_visible_notes: 'Vehicle inspected and checked into workshop bay.',
      });

      setMsg({ type: 'success', text: `Job card ${res.data.job_card_reference} opened successfully!` });
      setCheckInModalOpen(false);
      navigate(`/admin/job-cards`);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to check in bike and create job card.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckInModal = (b) => {
    setActiveBooking(b);
    setInitialOdometer((b.current_odometer || 0).toString());
    setReportedProblem(b.problem_description || '');
    setAssignedMechanicId(mechanics.length > 0 ? mechanics[0].id.toString() : '');
    setCheckInModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Bookings Management</h1>
          <p className="text-xs text-[#737373]">
            Review, confirm appointments, assign mechanics, and check in motorcycles.
          </p>
        </div>

        <Link
          to="/admin/walk-in"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          + Register Walk-in Customer
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
            placeholder="Search reference, customer, motorcycle, phone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
        />

        {(statusFilter || dateFilter || search) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setDateFilter('');
              setSearch('');
            }}
            className="px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Motorcycle</th>
                <th className="py-3.5 px-4">Preferred Slot</th>
                <th className="py-3.5 px-4">Est. Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                    {b.booking_reference}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111] block">{b.customer_name}</span>
                    <span className="text-[11px] text-[#737373]">{b.customer_phone}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#111111] block">{b.bike_brand} {b.bike_model}</span>
                    <span className="font-mono text-[11px] text-neutral-500">{b.registration_number}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111] block">{b.preferred_date}</span>
                    <span className="text-[11px] text-[#737373]">{b.preferred_time}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#111111]">
                    ₹{parseFloat(b.estimated_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Check-in & Open Job Card Button (if not already opened) */}
                      {!b.job_card_id && b.status !== 'cancelled' && (
                        <button
                          onClick={() => openCheckInModal(b)}
                          className="px-3 py-1 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          Check In & Job Card
                        </button>
                      )}

                      {/* Open Job Card if exists */}
                      {b.job_card_id && (
                        <Link
                          to={`/admin/job-cards?job_card_id=${b.job_card_id}`}
                          className="px-3 py-1 text-xs font-bold rounded-lg text-[#F97316] bg-orange-50 hover:bg-orange-100 transition-colors"
                        >
                          Job Card #{b.job_card_reference}
                        </Link>
                      )}

                      {/* Quick Status Modal Button */}
                      <button
                        onClick={() => {
                          setActiveBooking(b);
                          setNewStatus(b.status);
                          setStatusNotes('');
                          setStatusModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check In & Create Job Card Modal */}
      {checkInModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Motorcycle Check-In & Job Card Intake</h3>
                <p className="text-xs text-[#737373]">
                  Booking Ref: #{activeBooking.booking_reference} • {activeBooking.customer_name}
                </p>
              </div>
              <button onClick={() => setCheckInModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobCard} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#F8F8F8] border border-neutral-200 text-xs space-y-1">
                <p><strong>Motorcycle:</strong> {activeBooking.bike_brand} {activeBooking.bike_model} ({activeBooking.registration_number})</p>
                <p><strong>Customer:</strong> {activeBooking.customer_name} ({activeBooking.customer_phone})</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Assign Lead Mechanic *
                </label>
                <select
                  required
                  value={assignedMechanicId}
                  onChange={(e) => setAssignedMechanicId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="">Select Technician...</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.skills}) — Workload: {m.current_workload} active
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Initial Check-In Odometer Reading (km) *
                </label>
                <input
                  type="number"
                  required
                  value={initialOdometer}
                  onChange={(e) => setInitialOdometer(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Inspection Findings & Reported Problem *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportedProblem}
                  onChange={(e) => setReportedProblem(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckInModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Open Job Card & Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Status Update Modal */}
      {statusModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              Update Status: #{activeBooking.booking_reference}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">New Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Status Notes</label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason or notes..."
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
                {submitting ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
