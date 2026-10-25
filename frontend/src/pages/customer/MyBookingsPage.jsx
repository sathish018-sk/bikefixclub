import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  CalendarDays,
  Clock,
  Compass,
  XCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  CalendarPlus,
  Receipt
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [activeBooking, setActiveBooking] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:30 AM');

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/bookings');
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!activeBooking) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await api.post(`/customer/bookings/${activeBooking.id}/cancel`, {
        reason: cancelReason || 'Cancelled by customer',
      });
      setMsg({ type: 'success', text: `Booking #${activeBooking.booking_reference} has been cancelled.` });
      setCancelModalOpen(false);
      fetchBookings();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to cancel booking.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!activeBooking) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await api.post(`/customer/bookings/${activeBooking.id}/reschedule`, {
        preferred_date: newDate,
        preferred_time: newTime,
      });
      setMsg({ type: 'success', text: `Booking rescheduled to ${newDate} at ${newTime}.` });
      setRescheduleModalOpen(false);
      fetchBookings();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to reschedule booking.' });
    } finally {
      setActionLoading(false);
    }
  };

  const statusConfig = {
    pending: { label: 'Pending Approval', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    checked_in: { label: 'Bike Checked In', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    in_progress: { label: 'In Progress', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rescheduled: { label: 'Rescheduled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-700 border-red-200' },
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'confirmed', 'checked_in', 'in_progress', 'rescheduled'].includes(b.status);
    if (filter === 'completed') return b.status === 'completed' || b.job_card_status === 'delivered';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">My Service Bookings</h1>
          <p className="text-xs text-[#737373]">
            Track upcoming appointments, reschedule, or check live progress of your motorcycle repair.
          </p>
        </div>

        <Link
          to="/customer/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Another Service
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
        {[
          { key: 'all', label: `All Bookings (${bookings.length})` },
          { key: 'active', label: 'Active & Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === tab.key
                ? 'bg-[#111111] text-white'
                : 'text-[#737373] hover:text-[#111111] hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
          <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Bookings Found</h3>
          <p className="text-xs text-[#737373]">No motorcycle service appointments match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const sc = statusConfig[b.job_card_status || b.status] || { label: b.status, bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
            const canCancelOrReschedule = ['pending', 'confirmed', 'rescheduled'].includes(b.status);

            return (
              <div
                key={b.id}
                className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#F97316]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold text-[#111111] bg-neutral-100 px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                      {b.booking_reference}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sc.bg}`}>
                      {sc.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      {b.bike_brand} {b.bike_model} <span className="font-mono text-xs text-neutral-500">({b.bike_registration})</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#737373] mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {b.preferred_date}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {b.preferred_time}
                      </span>
                      {b.current_odometer && (
                        <span>Odometer: {b.current_odometer.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>

                  {b.services && b.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {b.services.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#F8F8F8] border border-neutral-200 text-[11px] text-[#404040]">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Estimated Price</span>
                    <span className="text-base font-black text-[#111111]">
                      ₹{parseFloat(b.estimated_amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Tracker Button (if in progress or checked in) */}
                    {(b.job_card_id || ['checked_in', 'in_progress'].includes(b.status)) && (
                      <Link
                        to={`/customer/tracking?job_card_id=${b.job_card_id || ''}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        Live Tracker
                      </Link>
                    )}

                    {/* View Invoice Shortcut */}
                    {b.invoice_id && (
                      <Link
                        to={`/customer/invoices?invoice_id=${b.invoice_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Invoice
                      </Link>
                    )}

                    {canCancelOrReschedule && (
                      <>
                        <button
                          onClick={() => {
                            setActiveBooking(b);
                            setNewDate(b.preferred_date);
                            setNewTime(b.preferred_time);
                            setRescheduleModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setActiveBooking(b);
                            setCancelReason('');
                            setCancelModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              Cancel Booking #{activeBooking?.booking_reference}
            </h3>
            <p className="text-xs text-[#737373]">
              Are you sure you wish to cancel this appointment? Please state a reason below.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Reason for cancellation *</label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, will re-book for next week"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              Reschedule Booking #{activeBooking?.booking_reference}
            </h3>
            <p className="text-xs text-[#737373]">
              Select a new preferred date and check-in time slot.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">New Time Slot *</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="08:30 AM">08:30 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReschedule}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
