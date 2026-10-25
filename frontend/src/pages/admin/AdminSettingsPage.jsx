import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Settings, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    workshop_name: 'BikeFix Club',
    tagline: 'Your Bike. Your Club. Our Care.',
    headline: 'Your Bike. Our Priority.',
    description: 'Premium Motorcycle Service & Care.',
    workshop_address: '2/2, RS Puram, Aruppukkottai',
    workshop_phone: '9597881218',
    business_hours: 'Monday - Saturday: 8:30 AM - 7:30 PM | Sunday: Closed',
    tax_rate: '18.00',
    daily_booking_capacity: '12',
    auto_confirm_bookings: '0',
    allow_reviews_unpaid: '0',
    razorpay_key_id: 'rzp_test_bikefixclub_sandbox',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await api.get('/admin/settings');
        const map = {};
        (res.data || []).forEach((row) => {
          map[row.setting_key] = row.setting_value;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.put('/admin/settings', settings);
      setMsg({ type: 'success', text: 'Workshop configuration saved successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Workshop Settings & Policy Config</h1>
        <p className="text-xs text-[#737373]">
          Manage official brand details, address, telephone numbers, GST rates, daily capacities, and gateway keys.
        </p>
      </div>

      {msg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-xs space-y-6">
        {/* Section 1: Brand & Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100">
            1. Official Brand Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Official Brand Name</label>
              <input
                type="text"
                required
                value={settings.workshop_name}
                onChange={(e) => handleChange('workshop_name', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Official Tagline</label>
              <input
                type="text"
                required
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">Hero Public Headline</label>
            <input
              type="text"
              required
              value={settings.headline}
              onChange={(e) => handleChange('headline', e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100">
            2. Contact & Physical Workshop Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Workshop Address *</label>
              <input
                type="text"
                required
                value={settings.workshop_address}
                onChange={(e) => handleChange('workshop_address', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Customer Support Phone *</label>
              <input
                type="tel"
                required
                value={settings.workshop_phone}
                onChange={(e) => handleChange('workshop_phone', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">Business Hours Description</label>
            <input
              type="text"
              required
              value={settings.business_hours}
              onChange={(e) => handleChange('business_hours', e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        {/* Section 3: Operational Policies & Financials */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100">
            3. Invoicing, Taxes & Capacities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Applicable GST / Tax Rate (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                required
                value={settings.tax_rate}
                onChange={(e) => handleChange('tax_rate', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1">Daily Workshop Booking Capacity (Slots) *</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={settings.daily_booking_capacity}
                onChange={(e) => handleChange('daily_booking_capacity', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoConfirm"
                checked={settings.auto_confirm_bookings === '1'}
                onChange={(e) => handleChange('auto_confirm_bookings', e.target.checked ? '1' : '0')}
                className="accent-[#F97316]"
              />
              <label htmlFor="autoConfirm" className="text-xs font-semibold text-[#171717]">
                Automatically confirm online customer service bookings without manual approval
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="strictReviews"
                checked={settings.allow_reviews_unpaid === '0'}
                onChange={(e) => handleChange('allow_reviews_unpaid', e.target.checked ? '0' : '1')}
                className="accent-[#F97316]"
              />
              <label htmlFor="strictReviews" className="text-xs font-semibold text-[#171717]">
                Enforce strict review policy (Requires Delivered status and Paid in Full invoice)
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Gateway Keys */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F97316] pb-2 border-b border-neutral-100">
            4. Payment Gateway Settings
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">Razorpay Sandbox Key ID</label>
            <input
              type="text"
              value={settings.razorpay_key_id}
              onChange={(e) => handleChange('razorpay_key_id', e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition-all shadow-md shadow-orange-500/20"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving Configuration...' : 'Save Workshop Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
