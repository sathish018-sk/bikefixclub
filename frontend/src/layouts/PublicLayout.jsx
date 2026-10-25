import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { Phone, MapPin, Clock, Menu, X, ArrowRight, User, ShieldCheck } from 'lucide-react';

export default function PublicLayout() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8] text-[#171717]">
      {/* Top Notification Strip */}
      <div className="bg-[#111111] text-white text-xs py-2 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              2/2, RS Puram, Aruppukkottai
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-[#F97316]" />
              Mon - Sat: 8:30 AM - 7:30 PM
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:9597881218"
              className="flex items-center gap-1.5 font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Support: 9597881218
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Logo showTagline={true} size="md" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-[#F97316] font-semibold'
                    : 'text-[#404040] hover:text-[#F97316]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={isAdmin ? '/admin' : '/customer'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#111111] hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  {isAdmin ? <ShieldCheck className="w-4 h-4 text-[#F97316]" /> : <User className="w-4 h-4 text-[#F97316]" />}
                  {isAdmin ? 'Admin Portal' : 'My Dashboard'}
                </Link>
                <button
                  onClick={logout}
                  className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-sm font-semibold text-[#171717] hover:text-[#F97316] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/book-service"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-98"
                >
                  Book a Service
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E5E5E5] bg-white px-4 pt-2 pb-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-base font-medium ${
                  isActive(link.path) ? 'text-[#F97316] font-bold' : 'text-neutral-700'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isAdmin ? '/admin' : '/customer'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white bg-[#111111]"
                  >
                    {isAdmin ? 'Admin Portal' : 'My Dashboard'}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2 text-sm font-medium text-neutral-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-semibold border border-neutral-300 text-neutral-800"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/book-service"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white bg-[#F97316]"
                  >
                    Book a Service
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Official Footer */}
      <footer className="bg-[#111111] text-white border-t border-neutral-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <Logo variant="light-text" showTagline={true} size="md" />
              <p className="text-sm text-neutral-400 leading-relaxed mt-3">
                Premium Motorcycle Service & Care. Professional motorcycle servicing, reliable repairs, and convenient service tracking — all in one place.
              </p>
              <div className="pt-2 text-xs text-neutral-400">
                Official Tagline: <span className="text-[#F97316] font-semibold">Your Bike. Your Club. Our Care.</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li><Link to="/" className="hover:text-[#F97316] transition-colors">Home</Link></li>
                <li><Link to="/services" className="hover:text-[#F97316] transition-colors">Service Catalogue</Link></li>
                <li><Link to="/about" className="hover:text-[#F97316] transition-colors">About Workshop</Link></li>
                <li><Link to="/contact" className="hover:text-[#F97316] transition-colors">Workshop Location</Link></li>
                <li><Link to="/login" className="hover:text-[#F97316] transition-colors">Customer Login</Link></li>
                <li><Link to="/register" className="hover:text-[#F97316] transition-colors">Create Account</Link></li>
              </ul>
            </div>

            {/* Col 3: Services Offered */}
            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase mb-4">Our Services</h4>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li>Periodic General Service</li>
                <li>Synthetic Engine Oil Change</li>
                <li>Front & Rear Brake Overhaul</li>
                <li>Chain Clean & Motul Lubrication</li>
                <li>Engine & Carburetor/FI Tuning</li>
                <li>Electrical & Battery Diagnostics</li>
                <li>Fork Oil & Seal Replacement</li>
              </ul>
            </div>

            {/* Col 4: Contact & Workshop Details */}
            <div>
              <h4 className="text-sm font-bold tracking-wider text-white uppercase mb-4">Workshop Location</h4>
              <div className="space-y-3.5 text-sm text-neutral-400">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                  <span>
                    <strong>BikeFix Club</strong><br />
                    2/2, RS Puram, Aruppukkottai,<br />
                    Tamil Nadu — 626101
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5 text-[#F97316] shrink-0" />
                  <a href="tel:9597881218" className="hover:text-white transition-colors">
                    +91 9597881218
                  </a>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Business Hours:</span><br />
                    Mon - Sat: 8:30 AM – 7:30 PM<br />
                    Sunday: Closed (Emergency on-call)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-400 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} BikeFix Club. All rights reserved. Your Bike. Your Club. Our Care.</p>
            <div className="flex gap-6">
              <span className="hover:text-neutral-300">Privacy Policy</span>
              <span className="hover:text-neutral-300">Terms of Service</span>
              <span className="hover:text-neutral-300">Workshop Safety Standards</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
