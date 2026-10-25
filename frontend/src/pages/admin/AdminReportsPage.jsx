import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  Users,
  Receipt
} from 'lucide-react';

export default function AdminReportsPage() {
  const [revenueData, setRevenueData] = useState(null);
  const [mechanicData, setMechanicData] = useState([]);
  const [inventoryVal, setInventoryVal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [revRes, mechRes, invRes] = await Promise.all([
          api.get('/admin/reports/revenue'),
          api.get('/admin/reports/mechanics'),
          api.get('/admin/reports/inventory')
        ]);
        setRevenueData(revRes.data);
        setMechanicData(mechRes.data || []);
        setInventoryVal(invRes.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const downloadCsv = (type) => {
    window.open(`/api/v1/admin/reports/export?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Workshop Reports & Data Exports</h1>
        <p className="text-xs text-[#737373]">
          Authoritative business intelligence, mechanic performance indexes, inventory valuations, and CSV exports.
        </p>
      </div>

      {/* CSV Export Quick Action Strip */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#F97316]" />
          Instant CSV Data Exports
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => downloadCsv('bookings')}
            className="p-3.5 rounded-xl border border-neutral-200 hover:border-[#F97316] hover:bg-orange-50/50 transition-all text-left group"
          >
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316] mb-2" />
            <h4 className="text-xs font-bold text-[#111111]">Export Bookings CSV</h4>
            <span className="text-[10px] text-[#737373]">All customer & walk-in jobs</span>
          </button>

          <button
            onClick={() => downloadCsv('invoices')}
            className="p-3.5 rounded-xl border border-neutral-200 hover:border-[#F97316] hover:bg-orange-50/50 transition-all text-left group"
          >
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316] mb-2" />
            <h4 className="text-xs font-bold text-[#111111]">Export Invoices CSV</h4>
            <span className="text-[10px] text-[#737373]">Billed totals, GST, & balances</span>
          </button>

          <button
            onClick={() => downloadCsv('inventory')}
            className="p-3.5 rounded-xl border border-neutral-200 hover:border-[#F97316] hover:bg-orange-50/50 transition-all text-left group"
          >
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316] mb-2" />
            <h4 className="text-xs font-bold text-[#111111]">Export Inventory CSV</h4>
            <span className="text-[10px] text-[#737373]">Stock levels & cost valuations</span>
          </button>

          <button
            onClick={() => downloadCsv('expenses')}
            className="p-3.5 rounded-xl border border-neutral-200 hover:border-[#F97316] hover:bg-orange-50/50 transition-all text-left group"
          >
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316] mb-2" />
            <h4 className="text-xs font-bold text-[#111111]">Export Expenses CSV</h4>
            <span className="text-[10px] text-[#737373]">Operating costs & vendor payees</span>
          </button>
        </div>
      </div>

      {/* Revenue & Inventory Valuation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Current Month Revenue Breakdown
            </h3>
            <span className="text-xs font-black text-emerald-600">
              ₹{revenueData?.total_collected?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {revenueData?.breakdown?.map((b, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#111111]">{b.pay_date}</span>
                  <span className="text-[10px] text-[#737373] ml-2 uppercase">({b.payment_method?.replace(/_/g, ' ')})</span>
                </div>
                <span className="font-black text-emerald-600">
                  ₹{parseFloat(b.total_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Stock Valuation */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Inventory Stock Valuation
            </h3>
            <span className="text-xs font-black text-[#111111]">
              Total Value: ₹{inventoryVal?.total_stock_valuation?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs max-h-64 overflow-y-auto">
            {inventoryVal?.parts?.slice(0, 7).map((p) => (
              <div key={p.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#111111]">{p.name}</span>
                  <span className="text-[10px] text-neutral-400 block font-mono">{p.sku} • Stock: {p.stock_quantity} units</span>
                </div>
                <span className="font-bold text-neutral-800">
                  ₹{parseFloat(p.total_valuation).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mechanic Performance Index */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
          Mechanic Performance & Workload Roster
        </h3>

        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100 text-neutral-700 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-3">Technician</th>
                <th className="p-3">Skills & Specialization</th>
                <th className="p-3 text-center">Active Jobs</th>
                <th className="p-3 text-center">Completed Jobs</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {mechanicData.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-[#111111]">{m.name}</td>
                  <td className="p-3 text-neutral-600">{m.skills}</td>
                  <td className="p-3 text-center font-bold text-[#F97316]">{m.jobs_active || 0}</td>
                  <td className="p-3 text-center font-bold text-emerald-600">{m.jobs_completed || 0}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                      {m.employment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
