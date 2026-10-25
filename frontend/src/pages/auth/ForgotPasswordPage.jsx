import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import api from '../../services/api';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.message || 'Password reset instructions have been generated.');
    } catch (err) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo size="lg" showTagline={true} />
        <h2 className="mt-6 text-2xl font-extrabold text-[#111111] tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-xs text-[#737373]">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E5E5E5] rounded-3xl sm:px-10">
          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sathish@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition-all shadow-md shadow-orange-500/20"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E5E5] text-center text-xs text-[#737373]">
            Remember your credentials?{' '}
            <Link to="/login" className="font-bold text-[#F97316] hover:text-[#EA580C]">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
