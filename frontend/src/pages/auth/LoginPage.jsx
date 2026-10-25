import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import GhostRiderTransition from '../../components/common/GhostRiderTransition';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transitionUser, setTransitionUser] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(loginInput, password);
      // Trigger Ghost Rider cinematic transition
      setTransitionUser(user);
      setIsTransitioning(true);
    } catch (err) {
      setError(err.message || 'Invalid email/phone or password.');
      setLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    if (transitionUser?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/customer');
    }
  };

  return (
    <>
      {isTransitioning && (
        <GhostRiderTransition
          userRole={transitionUser?.role}
          onComplete={handleTransitionComplete}
        />
      )}
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo size="lg" showTagline={true} />
        <h2 className="mt-6 text-2xl font-extrabold text-[#111111] tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="mt-2 text-xs text-[#737373]">
          Access your registered motorcycles, bookings, and digital service history.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E5E5E5] rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Enter your email or phone number"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-md focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition-all shadow-md shadow-orange-500/20"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E5E5] text-center text-xs text-[#737373]">
            Don't have a BikeFix Club account?{' '}
            <Link to="/register" className="font-bold text-[#F97316] hover:text-[#EA580C]">
              Register Your Motorcycle
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
