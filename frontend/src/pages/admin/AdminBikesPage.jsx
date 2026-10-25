import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Bike, Search, Gauge, Calendar, Fuel } from 'lucide-react';

export default function AdminBikesPage() {
  const [bikes, setBikes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBikes() {
      try {
        setLoading(true);
        // Fetch all customer bikes
        const res = await api.get('/admin/customers');
        const allBikes = [];
        for (const c of res.data || []) {
          const detailRes = await api.get(`/admin/customers/${c.id}`);
          if (detailRes.data?.bikes) {
            detailRes.data.bikes.forEach((b) => {
              allBikes.push({
                ...b,
                owner_name: c.name,
                owner_phone: c.phone,
                owner_id: c.id
              });
            });
          }
        }
        setBikes(allBikes);
      } catch (err) {
        console.error('Failed to load all bikes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBikes();
  }, []);

  const filteredBikes = bikes.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.registration_number?.toLowerCase().includes(q) ||
      b.brand?.toLowerCase().includes(q) ||
      b.model?.toLowerCase().includes(q) ||
      b.owner_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Motorcycles Directory</h1>
          <p className="text-xs text-[#737373]">
            Complete registry of all customer-owned bikes and walk-in motorcycles.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reg number, brand, owner..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBikes.map((b) => (
          <div key={b.id} className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-neutral-900 text-white">
                {b.registration_number}
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                Owner: <strong className="text-[#111111]">{b.owner_name}</strong>
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#111111]">{b.brand} {b.model}</h3>
              {b.variant && <p className="text-xs text-[#737373]">{b.variant}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-xs text-[#737373]">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                <span>{b.current_odometer?.toLocaleString()} km</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>{b.manufacturing_year || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#737373] border-t border-neutral-100 flex justify-between">
              <span>Contact: {b.owner_phone}</span>
              <span className="font-bold text-[#111111]">{b.fuel_type || 'Petrol'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
