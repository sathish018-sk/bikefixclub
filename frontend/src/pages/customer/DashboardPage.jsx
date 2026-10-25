import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bike,
  CalendarPlus,
  Clock,
  Compass,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [bikesRes, bookingsRes, invoicesRes] = await Promise.all([
          api.get('/customer/bikes'),
          api.get('/customer/bookings'),
          api.get('/customer/invoices')
        ]);
        setBikes(bikesRes.data || []);
        setBookings(bookingsRes.data || []);
        setInvoices(invoicesRes.data || []);
      } catch (err) {
        console.error('Failed to load customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const activeServices = bookings.filter((b) =>
    ['checked_in', 'in_progress'].includes(b.status) || (b.job_card_id && b.job_card_status !== 'delivered')
  );

  const completedServices = bookings.filter((b) =>
    b.status === 'completed' || b.job_card_status === 'delivered'
  );

  const totalOutstanding = invoices.reduce(
    (acc, inv) => acc + (parseFloat(inv.outstanding_balance) || 0),
    0
  );

  const statusBadge = (status) => {
    const config = {
      pending: { label: 'Pending Approval', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      checked_in: { label: 'Bike Checked In', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
      in_progress: { label: 'In Progress', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
      completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      delivered: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-700 border-red-200' },
    };
    const s = config[status] || { label: status, bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Strip */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#111111] via-[#171717] to-[#111111] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F97316] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Your Bike. Your Club. Our Care.
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Rider'}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
            Track your motorcycle servicing progress in real-time, view itemized digital invoices, and manage service appointments.
          </p>
        </div>

        <Link
          to="/customer/book"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#F97316] hover:bg-[#EA580C] shadow-lg shadow-orange-500/25 transition-all shrink-0 active:scale-98"
        >
          <CalendarPlus className="w-4 h-4" />
          Book a Service
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">My Bikes</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111111]">{bikes.length}</p>
          <Link to="/customer/bikes" className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1">
            Manage Bikes <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">Services In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111111]">{activeServices.length}</p>
          <Link to="/customer/tracking" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            Track Live <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">Completed Services</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111111]">{completedServices.length}</p>
          <Link to="/customer/history" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1">
            View History <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black ${totalOutstanding > 0 ? 'text-[#DC2626]' : 'text-emerald-600'}`}>
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <Link to="/customer/invoices" className="text-xs font-semibold text-[#171717] hover:text-[#F97316] inline-flex items-center gap-1">
            View Invoices <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Active Service Banner (if any) */}
      {activeServices.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111]">
                Service in Progress: {activeServices[0].bike_brand} {activeServices[0].bike_model} ({activeServices[0].bike_registration})
              </h4>
              <p className="text-xs text-[#737373]">
                Job Card #{activeServices[0].job_card_reference || 'Assigned'} is currently undergoing workshop diagnostics & service.
              </p>
            </div>
          </div>

          <Link
            to={activeServices[0].job_card_id ? `/customer/tracking` : `/customer/bookings`}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shrink-0"
          >
            Open Live Tracker
          </Link>
        </div>
      )}

      {/* Two Column Grid: My Motorcycles & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Registered Motorcycles */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111111]">My Motorcycles</h3>
            <Link to="/customer/bikes" className="text-xs font-bold text-[#F97316] hover:text-[#EA580C]">
              + Add / View All
            </Link>
          </div>

          {bikes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] text-center space-y-3">
              <Bike className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-xs text-[#737373]">No motorcycles registered yet.</p>
              <Link
                to="/customer/bikes"
                className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#F97316]"
              >
                Register Your First Bike
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bikes.slice(0, 3).map((bike) => (
                <div key={bike.id} className="p-4 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
                      <Bike className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111111]">{bike.brand} {bike.model}</h4>
                      <p className="text-xs text-[#737373]">{bike.registration_number} • {bike.current_odometer.toLocaleString()} km</p>
                    </div>
                  </div>

                  <Link
                    to={`/customer/book?bike_id=${bike.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    Book
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Bookings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111111]">Recent Service Bookings</h3>
            <Link to="/customer/bookings" className="text-xs font-bold text-[#F97316] hover:text-[#EA580C]">
              View All Bookings
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] text-center space-y-3">
              <Clock className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-xs text-[#737373]">You have no service bookings yet.</p>
              <Link
                to="/customer/book"
                className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#F97316]"
              >
                Schedule First Service
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#111111]">{b.booking_reference}</span>
                      {statusBadge(b.job_card_status || b.status)}
                    </div>
                    <p className="text-xs text-[#737373]">
                      {b.bike_brand} {b.bike_model} • Date: <strong>{b.preferred_date}</strong> ({b.preferred_time})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#111111]">
                      ₹{parseFloat(b.estimated_amount).toLocaleString('en-IN')}
                    </span>
                    <div>
                      <Link
                        to="/customer/bookings"
                        className="text-[11px] font-semibold text-[#F97316] hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
