import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, Search, Bike, Receipt, Calendar, ShieldCheck, X, Eye } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const viewCustomerDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/admin/customers/${id}`);
      setActiveCustomer(res.data);
    } catch (err) {
      alert('Failed to load customer details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to set this customer account to ${nextStatus}?`)) return;

    try {
      await api.patch(`/admin/customers/${id}/status`, { status: nextStatus });
      fetchCustomers();
      if (activeCustomer && activeCustomer.id === id) {
        setActiveCustomer({ ...activeCustomer, account_status: nextStatus });
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Customer Management</h1>
          <p className="text-xs text-[#737373]">
            Browse registered riders, inspect their motorcycles, and manage account statuses.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Bikes</th>
                <th className="py-3.5 px-4 text-center">Bookings</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#111111]">{c.name}</td>
                  <td className="py-3 px-4 text-neutral-700">{c.phone}</td>
                  <td className="py-3 px-4 text-neutral-500">{c.email}</td>
                  <td className="py-3 px-4 text-center font-bold">{c.total_bikes}</td>
                  <td className="py-3 px-4 text-center font-bold">{c.total_bookings}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.account_status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {c.account_status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => viewCustomerDetails(c.id)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-[#F97316] hover:text-white transition-colors mr-2"
                    >
                      Inspect Profile
                    </button>
                    <button
                      onClick={() => toggleStatus(c.id, c.account_status)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {c.account_status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Inspection Modal */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">{activeCustomer.name}</h3>
                <p className="text-xs text-[#737373]">
                  {activeCustomer.phone} • {activeCustomer.email}
                </p>
              </div>
              <button onClick={() => setActiveCustomer(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8F8F8] p-4 rounded-2xl border border-neutral-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Address</span>
                <p className="text-[#111111] font-semibold">{activeCustomer.address || 'N/A'}</p>
                <p className="text-neutral-500">{activeCustomer.city}, {activeCustomer.state} {activeCustomer.postal_code}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Emergency Contact</span>
                <p className="text-[#111111] font-semibold">{activeCustomer.emergency_contact || 'None recorded'}</p>
              </div>
            </div>

            {/* Registered Bikes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2">
                Registered Motorcycles ({activeCustomer.bikes?.length || 0})
              </h4>
              <div className="space-y-2">
                {activeCustomer.bikes?.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-neutral-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#111111]">{b.brand} {b.model}</span>
                      <span className="font-mono text-neutral-500 ml-2">({b.registration_number})</span>
                    </div>
                    <span className="text-[#737373]">{b.current_odometer.toLocaleString()} km</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2">
                Service History ({activeCustomer.bookings?.length || 0})
              </h4>
              <div className="space-y-2">
                {activeCustomer.bookings?.map((bk) => (
                  <div key={bk.id} className="p-3 rounded-xl border border-neutral-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#111111]">{bk.booking_reference}</span>
                      <span className="text-neutral-500 ml-2">({bk.preferred_date})</span>
                    </div>
                    <span className="uppercase font-bold text-[10px] text-[#F97316]">{bk.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveCustomer(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
