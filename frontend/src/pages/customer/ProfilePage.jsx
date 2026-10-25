import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Aruppukkottai',
    state: 'Tamil Nadu',
    postal_code: '626101',
    emergency_contact: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await api.get('/customer/profile');
        if (res.data) {
          setFormData({
            name: res.data.name || '',
            phone: res.data.phone || '',
            email: res.data.email || '',
            address: res.data.address || '',
            city: res.data.city || 'Aruppukkottai',
            state: res.data.state || 'Tamil Nadu',
            postal_code: res.data.postal_code || '626101',
            emergency_contact: res.data.emergency_contact || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      await api.put('/customer/profile', formData);
      await refreshUser();
      setMsg({ type: 'success', text: 'Profile information updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">My Profile & Account</h1>
        <p className="text-xs text-[#737373]">
          Manage your personal contact info, workshop delivery address, and emergency notifications.
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

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-[#E5E5E5]">
          <div className="w-14 h-14 rounded-full bg-[#111111] text-[#F97316] font-black text-xl flex items-center justify-center">
            {formData.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111111]">{formData.name}</h3>
            <p className="text-xs text-[#737373]">Registered BikeFix Club Member</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-neutral-100 text-neutral-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Workshop / Home Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                City / Town
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Emergency Contact Number
            </label>
            <input
              type="tel"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="e.g. 9876543299"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition-all shadow-md shadow-orange-500/20"
            >
              {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
