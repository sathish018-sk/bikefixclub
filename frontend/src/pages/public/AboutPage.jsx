import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Wrench, Users, ArrowRight, MapPin, Phone } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
          About BikeFix Club
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111111] tracking-tight">
          Craftsmanship, Precision & Motorcycle Passion
        </h1>
        <p className="text-neutral-600 text-base leading-relaxed">
          Founded with a single mission: to provide motorcycle owners with transparent, dependable workshop care backed by modern digital tracking and genuine spare parts.
        </p>
      </div>

      {/* Brand Philosophy Box */}
      <div className="rounded-3xl bg-gradient-to-br from-[#111111] to-[#171717] text-white p-8 sm:p-14 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F97316]">Our Brand Motto</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            "Your Bike. Your Club. Our Care."
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            At BikeFix Club, your motorcycle is not merely another registration number. Whether you ride a daily commuter scooter, a high-torque Royal Enfield, or a high-performance KTM sports bike, our mechanics treat every motorcycle with the same uncompromising attention to detail.
          </p>
        </div>
      </div>

      {/* Workshop Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#111111]">100% Genuine Fluids & Spares</h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            We partner with verified OEM suppliers and premium performance brands including Motul, Brembo, NGK, and Exide to guarantee long engine life and safe braking.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#111111]">Certified Senior Mechanics</h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            Our team comprises experienced mechanics specializing in engine overhauls, fuel-injection diagnostics, fork hydraulic tuning, and electrical harness repairs.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#111111]">Digital Tracking & Clear Bills</h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            No unexpected repair bills. Inspect your live job card timeline, approve parts replacement beforehand, and download itemized tax invoices directly to your phone.
          </p>
        </div>
      </div>

      {/* Workshop Address Card */}
      <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-[#111111]">Visit the BikeFix Club Workshop</h3>
          <p className="text-sm text-[#737373]">
            2/2, RS Puram, Aruppukkottai, Tamil Nadu — 626101
          </p>
          <p className="text-xs text-neutral-500">
            Open Monday through Saturday from 8:30 AM to 7:30 PM.
          </p>
        </div>

        <div className="flex gap-4">
          <a
            href="tel:9597881218"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#EA580C] transition-colors"
          >
            <Phone className="w-4 h-4" />
            9597881218
          </a>
          <Link
            to="/book-service"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] text-white font-bold text-sm hover:bg-neutral-800 transition-colors"
          >
            Book Appointment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
