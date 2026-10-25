import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Compass,
  CheckCircle2,
  Clock,
  User,
  Wrench,
  Receipt,
  AlertCircle,
  Phone,
  Bike,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ServiceTrackingPage() {
  const [searchParams] = useSearchParams();
  const urlJobCardId = searchParams.get('job_card_id');

  const [jobCards, setJobCards] = useState([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState(urlJobCardId || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all customer job cards to allow switching between services
  useEffect(() => {
    async function loadJobCards() {
      try {
        setLoading(true);
        const res = await api.get('/customer/service-history');
        const list = res.data || [];
        setJobCards(list);

        if (list.length > 0) {
          const defaultId = urlJobCardId || list[0].job_card_id;
          setSelectedJobCardId(defaultId.toString());
        }
      } catch (err) {
        console.error('Failed to load tracking job cards:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobCards();
  }, [urlJobCardId]);

  // 2. Fetch detailed tracking for selected job card
  useEffect(() => {
    if (!selectedJobCardId) return;

    async function loadDetails() {
      try {
        const res = await api.get(`/customer/job-cards/${selectedJobCardId}`);
        setTrackingData(res.data);
      } catch (err) {
        console.error('Failed to load job card tracking details:', err);
      }
    }
    loadDetails();
  }, [selectedJobCardId]);

  const stages = [
    { key: 'created', label: '1. Booking Received', desc: 'Request submitted online.' },
    { key: 'confirmed', label: '2. Confirmed', desc: 'Workshop slot scheduled.' },
    { key: 'checked_in', label: '3. Bike Checked In', desc: 'Motorcycle received at workshop.' },
    { key: 'diagnosis', label: '4. Diagnosis', desc: 'Inspection & test findings.' },
    { key: 'repair_in_progress', label: '5. Repair in Progress', desc: 'Mechanic performing service.' },
    { key: 'quality_check', label: '6. Quality Check', desc: 'Post-service road test & wash.' },
    { key: 'ready_for_delivery', label: '7. Ready for Delivery', desc: 'Bike ready for rider collection.' },
    { key: 'delivered', label: '8. Delivered', desc: 'Handed over to customer.' },
  ];

  const currentStep = trackingData?.current_step_index ?? 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
            Live Service Tracking
          </span>
          <h1 className="text-2xl font-extrabold text-[#111111]">Motorcycle Repair Timeline</h1>
          <p className="text-xs text-[#737373]">
            Track diagnosis, parts installation, and road testing in real-time.
          </p>
        </div>

        {/* Job Card Selector if customer has multiple services */}
        {jobCards.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373]">Switch Job Card:</span>
            <select
              value={selectedJobCardId}
              onChange={(e) => setSelectedJobCardId(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
            >
              {jobCards.map((jc) => (
                <option key={jc.job_card_id} value={jc.job_card_id}>
                  {jc.job_card_reference} — {jc.bike_brand} {jc.bike_model}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!trackingData ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
          <Compass className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Active Service Job Card</h3>
          <p className="text-xs text-[#737373] max-w-sm mx-auto">
            Once you book an appointment and check in your motorcycle at the workshop, your live tracking progress will appear here.
          </p>
          <Link
            to="/customer/book"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316]"
          >
            Book a Service Now
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Card: Bike & Status Summary */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold bg-neutral-900 text-white px-2 py-0.5 rounded">
                    {trackingData.registration_number}
                  </span>
                  <span className="text-xs font-bold text-[#F97316]">
                    Job #{trackingData.job_card_reference}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#111111] mt-1">
                  {trackingData.bike_brand} {trackingData.bike_model} {trackingData.variant}
                </h2>
                <p className="text-xs text-[#737373]">
                  Initial Odometer: {trackingData.initial_odometer?.toLocaleString()} km
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {trackingData.invoice_id && (
                <Link
                  to={`/customer/invoices?invoice_id=${trackingData.invoice_id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  View Tax Invoice ({trackingData.invoice_status?.toUpperCase()})
                </Link>
              )}
            </div>
          </div>

          {/* Visual 8-Stage Timeline */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
              Service Progress Flow (8 Stages)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stages.map((stage, idx) => {
                const stageNum = idx;
                const isPassed = currentStep > stageNum;
                const isCurrent = currentStep === stageNum;

                return (
                  <div
                    key={stage.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-[#F97316] bg-[#FFF7ED] shadow-sm ring-2 ring-[#F97316]/20'
                        : isPassed
                        ? 'border-emerald-200 bg-emerald-50/40 text-neutral-800'
                        : 'border-[#E5E5E5] bg-[#F8F8F8] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-[#F97316]' : isPassed ? 'text-emerald-700' : 'text-neutral-500'}`}>
                        Stage {idx + 1}
                      </span>
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-ping" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>

                    <h4 className={`text-xs font-bold ${isCurrent ? 'text-[#111111]' : isPassed ? 'text-neutral-800' : 'text-neutral-500'}`}>
                      {stage.label}
                    </h4>
                    <p className="text-[11px] text-[#737373] mt-1">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Technician & Customer Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technician Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F97316]">
                Assigned Workshop Specialist
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#111111] text-[#F97316] font-bold flex items-center justify-center shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#111111]">
                    {trackingData.mechanic_name || 'Assigned Lead Technician'}
                  </h4>
                  <p className="text-xs text-[#737373]">
                    {trackingData.mechanic_skills || 'Multi-brand motorcycle engine, electrical & transmission specialist'}
                  </p>
                  {trackingData.mechanic_phone && (
                    <a
                      href={`tel:${trackingData.mechanic_phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] mt-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      {trackingData.mechanic_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Visible Notes Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F97316]">
                Technician Notes for Rider
              </span>
              <div className="p-4 rounded-2xl bg-[#F8F8F8] border border-neutral-200 text-xs text-[#171717] leading-relaxed italic">
                "{trackingData.customer_visible_notes || 'Initial 24-point motorcycle check completed. Standard procedure in progress.'}"
              </div>
              <p className="text-[11px] text-[#737373]">
                Workshop Location: 2/2, RS Puram, Aruppukkottai (Tel: 9597881218)
              </p>
            </div>
          </div>

          {/* Work Performed: Services & Spare Parts */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] space-y-6">
            <h3 className="text-base font-bold text-[#111111]">
              Itemized Labour Procedures & Spare Parts
            </h3>

            <div className="space-y-4">
              {/* Labour Items */}
              {trackingData.services && trackingData.services.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#737373] mb-2 tracking-wider">
                    Labour Procedures ({trackingData.services.length})
                  </h4>
                  <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                    {trackingData.services.map((svc) => (
                      <div key={svc.id} className="p-3 bg-white flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#171717]">{svc.description}</span>
                        <span className="font-bold text-[#111111]">₹{parseFloat(svc.line_total).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spare Parts Installed */}
              {trackingData.parts && trackingData.parts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#737373] mb-2 tracking-wider">
                    Spare Parts & Consumables Installed ({trackingData.parts.length})
                  </h4>
                  <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                    {trackingData.parts.map((p) => (
                      <div key={p.id} className="p-3 bg-white flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-[#171717]">{p.part_name}</span>
                          <span className="text-[10px] text-[#737373] ml-2 font-mono">({p.sku}) × {p.quantity}</span>
                        </div>
                        <span className="font-bold text-[#111111]">₹{parseFloat(p.line_total).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
