import React, { useState } from 'react';
import api from '../../services/api';
import { MapPin, Phone, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.post('/public/contact', formData);
      setSuccessMsg(res.message || 'Your inquiry has been sent to BikeFix Club.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send message. Please try calling us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
          Contact BikeFix Club
        </span>
        <h1 className="text-4xl font-extrabold text-[#111111] tracking-tight">
          Get in Touch With Our Workshop
        </h1>
        <p className="text-neutral-600 text-sm leading-relaxed">
          Have a question regarding repair estimates, motorcycle service schedules, or need help reaching our workshop? Contact our friendly team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Workshop Physical Address</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              <strong>BikeFix Club</strong><br />
              2/2, RS Puram, Aruppukkottai,<br />
              Tamil Nadu — 626101
            </p>
            <a
              href="https://maps.google.com/?q=2/2+RS+Puram+Aruppukkottai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-bold text-[#F97316] hover:text-[#EA580C] pt-2"
            >
              Open in Google Maps →
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Workshop Mobile & Support</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              For appointment scheduling and repair assistance:
            </p>
            <a
              href="tel:9597881218"
              className="inline-block text-xl font-black text-[#111111] hover:text-[#F97316] transition-colors"
            >
              +91 9597881218
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Operational Hours</h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              <strong>Monday – Saturday:</strong> 8:30 AM – 7:30 PM<br />
              <strong>Sunday:</strong> Closed (Emergency roadside service on call)
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 p-8 rounded-3xl bg-white border border-[#E5E5E5] shadow-xs">
          <h2 className="text-2xl font-bold text-[#111111] mb-2">Send us a Message</h2>
          <p className="text-xs text-[#737373] mb-6">
            Fill in the form below and a workshop service advisor will get back to you promptly.
          </p>

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
                placeholder="e.g. Sathish Kumar"
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
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sathish@example.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Message / Service Inquiry *
              </label>
              <textarea
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your motorcycle make, problem, or service question..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition-colors shadow-md shadow-orange-500/20"
            >
              {submitting ? 'Sending...' : 'Send Inquiry'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
