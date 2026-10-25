import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  History,
  Bike,
  Gauge,
  Receipt,
  Star,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ServiceHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await api.get('/customer/service-history');
        setHistory(res.data || []);
      } catch (err) {
        console.error('Failed to load service history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Motorcycle Service History</h1>
        <p className="text-xs text-[#737373]">
          Comprehensive digital maintenance records, odometer tracking, and invoices for your registered bikes.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
          <History className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Service Records Yet</h3>
          <p className="text-xs text-[#737373]">
            Once you complete a service at BikeFix Club, your permanent vehicle maintenance history will be logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.job_card_id}
              className="p-6 rounded-3xl bg-white border border-[#E5E5E5] hover:border-[#F97316]/40 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black bg-neutral-900 text-white px-2.5 py-1 rounded">
                    {item.registration_number}
                  </span>
                  <h3 className="text-base font-bold text-[#111111]">
                    {item.bike_brand} {item.bike_model}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#737373]">
                    Job Card: <strong className="text-[#111111]">{item.job_card_reference}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.job_card_status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#737373]">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Delivered On</span>
                  <span className="font-semibold text-[#111111]">
                    {item.delivered_at ? new Date(item.delivered_at).toLocaleDateString() : 'Delivered'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Initial Odometer</span>
                  <span className="font-semibold text-[#111111]">{item.initial_odometer?.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Final Odometer</span>
                  <span className="font-semibold text-[#111111]">{item.final_odometer ? `${item.final_odometer.toLocaleString()} km` : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Invoice Total</span>
                  <span className="font-bold text-[#111111]">
                    {item.total_amount ? `₹${parseFloat(item.total_amount).toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                </div>
              </div>

              {item.customer_visible_notes && (
                <div className="p-3 rounded-xl bg-[#F8F8F8] border border-neutral-100 text-xs text-[#171717] italic">
                  "{item.customer_visible_notes}"
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.invoice_id && (
                    <Link
                      to={`/customer/invoices?invoice_id=${item.invoice_id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:underline"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Invoice #{item.invoice_number} ({item.invoice_status?.toUpperCase()})
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {item.review_id ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Rated {item.review_rating} / 5
                    </span>
                  ) : item.booking_id && item.job_card_status === 'delivered' && item.invoice_status === 'paid' ? (
                    <Link
                      to={`/customer/reviews?booking_id=${item.booking_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C]"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Submit Review
                    </Link>
                  ) : null}

                  <Link
                    to={`/customer/tracking?job_card_id=${item.job_card_id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                  >
                    View Timeline <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
