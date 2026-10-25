import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Bike,
  Wrench,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus
} from 'lucide-react';

export default function BookServicePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [bikes, setBikes] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State
  const [selectedBikeId, setSelectedBikeId] = useState(searchParams.get('bike_id') || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredDate, setPreferredDate] = useState(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('09:30 AM');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [bikesRes, svcsRes, catsRes] = await Promise.all([
          api.get('/customer/bikes'),
          api.get('/public/services'),
          api.get('/public/service-categories')
        ]);
        const userBikes = bikesRes.data || [];
        setBikes(userBikes);
        setServices(svcsRes.data || []);
        setCategories(catsRes.data || []);

        if (userBikes.length > 0 && !selectedBikeId) {
          setSelectedBikeId(userBikes[0].id.toString());
          setCurrentOdometer(userBikes[0].current_odometer.toString());
        } else if (selectedBikeId) {
          const match = userBikes.find((b) => b.id.toString() === selectedBikeId);
          if (match) setCurrentOdometer(match.current_odometer.toString());
        }
      } catch (err) {
        console.error('Failed to load booking form data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBikeChange = (id) => {
    setSelectedBikeId(id);
    const match = bikes.find((b) => b.id.toString() === id.toString());
    if (match) setCurrentOdometer(match.current_odometer.toString());
  };

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const selectedServicesList = services.filter((s) => selectedServiceIds.includes(s.id));
  const estimatedTotal = selectedServicesList.reduce((acc, s) => acc + parseFloat(s.standard_price), 0);
  const selectedBike = bikes.find((b) => b.id.toString() === selectedBikeId?.toString());

  const timeSlots = [
    '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM',
    '01:30 PM', '02:30 PM', '03:30 PM', '04:30 PM', '05:30 PM'
  ];

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!selectedBikeId) {
        setError('Please select a motorcycle to service or add a new bike.');
        return;
      }
    } else if (step === 2) {
      if (selectedServiceIds.length === 0) {
        setError('Please select at least one workshop service.');
        return;
      }
    } else if (step === 3) {
      if (!preferredDate) {
        setError('Please select a preferred service date.');
        return;
      }
    } else if (step === 4) {
      if (!problemDescription.trim()) {
        setError('Please describe the problem or service requirements.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        bike_id: parseInt(selectedBikeId, 10),
        service_ids: selectedServiceIds,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        current_odometer: parseInt(currentOdometer, 10) || 0,
        problem_description: problemDescription,
        notes: notes,
      };

      const res = await api.post('/customer/bookings', payload);
      setConfirmedBooking(res.data);
    } catch (err) {
      setError(err.message || 'Failed to submit booking. Please check date capacity or call us.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation Success Screen
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
            Appointment Confirmed
          </span>
          <h1 className="text-3xl font-extrabold text-[#111111]">
            Your Service Appointment is Booked!
          </h1>
          <p className="text-xs text-[#737373]">
            Booking Reference: <strong className="text-[#111111] font-mono text-sm">{confirmedBooking.booking_reference}</strong>
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] text-left space-y-3">
          <div className="flex justify-between text-xs py-1 border-b border-neutral-100">
            <span className="text-[#737373]">Motorcycle:</span>
            <span className="font-bold text-[#111111]">{selectedBike?.brand} {selectedBike?.model} ({selectedBike?.registration_number})</span>
          </div>
          <div className="flex justify-between text-xs py-1 border-b border-neutral-100">
            <span className="text-[#737373]">Scheduled Date & Time:</span>
            <span className="font-bold text-[#111111]">{preferredDate} at {preferredTime}</span>
          </div>
          <div className="flex justify-between text-xs py-1 border-b border-neutral-100">
            <span className="text-[#737373]">Initial Status:</span>
            <span className="font-bold text-amber-600 uppercase">{confirmedBooking.status}</span>
          </div>
          <div className="flex justify-between text-xs py-1 border-b border-neutral-100">
            <span className="text-[#737373]">Estimated Labour Total:</span>
            <span className="font-bold text-[#111111]">₹{parseFloat(confirmedBooking.estimated_amount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className="text-[#737373]">Workshop Address:</span>
            <span className="font-semibold text-[#111111]">2/2, RS Puram, Aruppukkottai (Tel: 9597881218)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/customer/bookings"
            className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors"
          >
            View in My Bookings
          </Link>
          <Link
            to="/customer"
            className="px-6 py-3 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-[#E5E5E5] hover:bg-neutral-50 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Book a Workshop Service</h1>
        <p className="text-xs text-[#737373]">
          Guided 5-step booking flow for certified motorcycle care at BikeFix Club Aruppukkottai.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-5 gap-2">
        {['1. Motorcycle', '2. Services', '3. Schedule', '4. Diagnosis', '5. Confirm'].map((label, i) => {
          const stepNum = i + 1;
          const isDone = step > stepNum;
          const isCurrent = step === stepNum;

          return (
            <div key={i} className="space-y-1.5 text-center">
              <div
                className={`h-2 rounded-full transition-all ${
                  isDone
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-[#F97316]'
                    : 'bg-neutral-200'
                }`}
              />
              <span className={`text-[10px] font-bold block truncate ${isCurrent ? 'text-[#F97316]' : 'text-neutral-500'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Motorcycle */}
      {step === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#111111]">Step 1: Choose Motorcycle</h2>
              <p className="text-xs text-[#737373]">Select which bike from your garage needs service.</p>
            </div>
            <Link
              to="/customer/bikes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:text-[#EA580C]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Bike
            </Link>
          </div>

          {bikes.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Bike className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-xs text-[#737373]">You have not registered any motorcycles yet.</p>
              <Link
                to="/customer/bikes"
                className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#F97316]"
              >
                Register Bike First
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bikes.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleBikeChange(b.id.toString())}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedBikeId === b.id.toString()
                      ? 'border-[#F97316] bg-[#FFF7ED] shadow-sm'
                      : 'border-[#E5E5E5] bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
                      {b.registration_number}
                    </span>
                    <input
                      type="radio"
                      name="bike_select"
                      checked={selectedBikeId === b.id.toString()}
                      onChange={() => handleBikeChange(b.id.toString())}
                      className="accent-[#F97316]"
                    />
                  </div>
                  <h4 className="text-sm font-bold text-[#111111]">{b.brand} {b.model}</h4>
                  <p className="text-xs text-[#737373] mt-1">Odometer: {b.current_odometer.toLocaleString()} km</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Services */}
      {step === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#111111]">Step 2: Select Services</h2>
              <p className="text-xs text-[#737373]">Choose one or multiple required workshop services.</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#737373]">Estimated Labour:</span>
              <p className="text-lg font-extrabold text-[#F97316]">₹{estimatedTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {services.map((s) => {
              const isSelected = selectedServiceIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#F97316] bg-[#FFF7ED] shadow-xs'
                      : 'border-[#E5E5E5] bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                        {s.category_name}
                      </span>
                      <h4 className="text-xs font-bold text-[#111111]">{s.name}</h4>
                      <p className="text-[11px] text-[#737373] line-clamp-2">{s.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleService(s.id)}
                      className="accent-[#F97316] mt-1 shrink-0"
                    />
                  </div>

                  <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-[#737373]">~{s.estimated_duration} mins</span>
                    <span className="font-extrabold text-[#111111]">₹{parseFloat(s.standard_price).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Select Date & Time Slot */}
      {step === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Step 3: Appointment Date & Slot</h2>
            <p className="text-xs text-[#737373]">Choose when you plan to drop off your motorcycle at the workshop.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Preferred Date (Mon - Sat) *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
              <span className="text-[11px] text-[#737373] mt-1 block">
                Workshop is open Monday – Saturday: 8:30 AM – 7:30 PM (Closed on Sundays).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                Preferred Check-In Time Slot *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPreferredTime(slot)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      preferredTime === slot
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-[#F8F8F8] border-[#E5E5E5] text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Diagnosis & Odometer */}
      {step === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Step 4: Problem Description & Odometer</h2>
            <p className="text-xs text-[#737373]">Provide details so our technicians can prepare the right tools and diagnostic equipment.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Current Odometer Reading (km) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                placeholder="e.g. 18450"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Reported Problems & Noise / Service Requests *
              </label>
              <textarea
                rows={4}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe any abnormal noises, engine vibration, brake sponginess, or periodic checkup requirements..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Special Requests / Preferred Oil Brand (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Use Motul 7100 10W-40, inspect front fork seal"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review & Confirm */}
      {step === 5 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Step 5: Review Booking Request</h2>
            <p className="text-xs text-[#737373]">Please review your service appointment request before confirming.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F8F8] border border-[#E5E5E5] space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-[#737373]">Motorcycle:</span>
              <span className="font-bold text-[#111111]">{selectedBike?.brand} {selectedBike?.model} ({selectedBike?.registration_number})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-[#737373]">Scheduled Appointment:</span>
              <span className="font-bold text-[#111111]">{preferredDate} at {preferredTime}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-[#737373]">Odometer Reading:</span>
              <span className="font-bold text-[#111111]">{currentOdometer} km</span>
            </div>

            <div className="py-2 border-b border-neutral-200">
              <span className="text-[#737373] block mb-1">Selected Services ({selectedServicesList.length}):</span>
              <ul className="space-y-1 pl-2">
                {selectedServicesList.map((s) => (
                  <li key={s.id} className="flex justify-between font-medium text-[#171717]">
                    <span>• {s.name}</span>
                    <span className="font-bold">₹{parseFloat(s.standard_price).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between py-1 text-sm font-bold text-[#111111]">
              <span>Estimated Labour Charges:</span>
              <span className="text-[#F97316] text-base">₹{estimatedTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 text-[11px] text-[#737373] italic">
              "Problem: {problemDescription}"
            </div>
          </div>

          <div className="text-xs text-[#737373] bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            📍 Drop off location: <strong>BikeFix Club, 2/2, RS Puram, Aruppukkottai</strong> (Support: 9597881218). Spares consumed will be billed transparently on the final invoice upon your approval.
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-[#E5E5E5] hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmBooking}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Confirming...' : 'Confirm Service Appointment'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
