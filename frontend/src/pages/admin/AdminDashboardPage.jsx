import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  CalendarDays,
  Compass,
  CheckCircle2,
  Users,
  Bike,
  Boxes,
  IndianRupee,
  Receipt,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-xs text-[#737373]">
        Loading database-driven workshop dashboard...
      </div>
    );
  }

  const { metrics, recent_bookings, recent_payments, charts } = data;

  const COLORS = ['#F97316', '#2563EB', '#16A34A', '#EAB308', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
            Operational Command Center
          </span>
          <h1 className="text-2xl font-extrabold text-[#111111]">
            BikeFix Club Workshop Overview
          </h1>
          <p className="text-xs text-[#737373]">
            Real-time workshop activity, live job cards, and authoritative financial balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/walk-in"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all"
          >
            + Fast Walk-in Intake
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Today's Bookings</span>
          <p className="text-2xl font-black text-[#111111]">{metrics.today_bookings}</p>
          <span className="text-[11px] text-neutral-400">Total: {metrics.total_bookings}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">In Progress</span>
          <p className="text-2xl font-black text-[#F97316]">{metrics.in_progress_services}</p>
          <span className="text-[11px] text-neutral-400">On workshop bays</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Ready for Delivery</span>
          <p className="text-2xl font-black text-blue-600">{metrics.ready_for_delivery}</p>
          <span className="text-[11px] text-neutral-400">Waiting for pickup</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Delivered Jobs</span>
          <p className="text-2xl font-black text-emerald-600">{metrics.completed_services}</p>
          <span className="text-[11px] text-neutral-400">Completed rides</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Active Customers</span>
          <p className="text-2xl font-black text-[#111111]">{metrics.total_customers}</p>
          <span className="text-[11px] text-neutral-400">{metrics.registered_bikes} Motorcycles</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">Active Mechanics</span>
          <p className="text-2xl font-black text-[#111111]">{metrics.active_mechanics}</p>
          <span className="text-[11px] text-neutral-400">Workshop roster</span>
        </div>
      </div>

      {/* Financial Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span className="font-bold uppercase tracking-wider">Collected Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ₹{metrics.collected_payments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-[#737373] block">
            Invoiced: ₹{metrics.invoiced_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span className="font-bold uppercase tracking-wider">Outstanding Invoices</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black ${metrics.outstanding_balances > 0 ? 'text-red-600' : 'text-neutral-500'}`}>
            ₹{metrics.outstanding_balances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-[#737373] block">Uncollected balance</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span className="font-bold uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-800">
            ₹{metrics.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-[#737373] block">Supplies, tools & utilities</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#EA580C]">
            <span className="font-bold uppercase tracking-wider">Net Operating Profit</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className={`text-2xl font-black ${metrics.net_profit >= 0 ? 'text-[#EA580C]' : 'text-red-600'}`}>
            ₹{metrics.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-[#737373] block">Collected minus expenses</span>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {metrics.low_stock_parts > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <strong>Low Stock Alert:</strong> {metrics.low_stock_parts} spare parts are at or below minimum threshold.
            </div>
          </div>
          <Link
            to="/admin/inventory?low_stock=1"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 transition-colors"
          >
            Review Inventory
          </Link>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Monthly Revenue Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Collected Revenue Trend
            </h3>
            <span className="text-xs text-[#737373]">Live payments ledger</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenue_trend}>
                <XAxis dataKey="month_label" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val) => [`₹${parseFloat(val).toLocaleString('en-IN')}`, 'Collected']}
                  contentStyle={{ backgroundColor: '#111', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="collected_amount" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Booking Status Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
            Booking Status Distribution
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            {charts.status_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.status_distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-neutral-400">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Tables: Recent Bookings & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-bold text-[#F97316] hover:underline">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-neutral-100">
            {recent_bookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#111111]">{b.booking_reference}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="font-semibold text-neutral-700">{b.customer_name}</span>
                  </div>
                  <p className="text-[11px] text-[#737373] mt-0.5">
                    {b.bike_brand} {b.bike_model} ({b.registration_number}) • {b.preferred_date}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-[#111111]">₹{parseFloat(b.estimated_amount).toLocaleString('en-IN')}</span>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Recent Payments</h3>
            <Link to="/admin/payments" className="text-xs font-bold text-[#F97316] hover:underline">
              Payments Ledger →
            </Link>
          </div>

          <div className="divide-y divide-neutral-100">
            {recent_payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#111111]">{p.payment_reference}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="font-semibold text-neutral-700">{p.customer_name}</span>
                  </div>
                  <p className="text-[11px] text-[#737373] mt-0.5">
                    Invoice #{p.invoice_number} • {p.payment_method?.toUpperCase()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-black text-emerald-600">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                  <span className="block text-[10px] text-neutral-400">
                    {new Date(p.paid_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
