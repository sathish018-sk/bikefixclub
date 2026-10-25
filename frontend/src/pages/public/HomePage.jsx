import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Wrench,
  Droplet,
  Disc,
  Cpu,
  CircleDot,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  MapPin,
  Star,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, reviewsRes] = await Promise.all([
          api.get('/public/services'),
          api.get('/public/reviews')
        ]);
        setServices(servicesRes.data?.slice(0, 6) || []);
        setReviews(reviewsRes.data?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to load public data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featureCards = [
    {
      icon: ShieldCheck,
      title: 'Certified Master Mechanics',
      description: 'Factory-trained specialists handling Royal Enfield, Yamaha, KTM, Honda, and TVS with precision OEM tools.',
    },
    {
      icon: Sparkles,
      title: '100% Genuine Spare Parts',
      description: 'Direct procurement of Motul synthetic fluids, Brembo pads, NGK plugs, and manufacturer-certified spares.',
    },
    {
      icon: Clock,
      title: 'Live Service Timeline',
      description: 'Track your motorcycle from check-in, diagnosis, and repair to quality inspection and delivery in real-time.',
    },
    {
      icon: CheckCircle2,
      title: 'Transparent Pricing',
      description: 'Zero hidden fees. Itemized labour charges, parts breakdown, and digital tax invoices approved by you first.',
    },
  ];

  const categoryIcons = {
    'general-service': Wrench,
    'oil-fluids': Droplet,
    'brakes-suspension': Disc,
    'engine-performance': Cpu,
    'tyres-wheel': CircleDot,
    'electricals-diagnostics': Zap,
  };

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#111111] via-[#171717] to-[#111111] text-white pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#F97316] to-transparent rounded-full blur-3xl" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#EA580C] rounded-full blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
              <span className="text-xs uppercase tracking-wider font-bold text-neutral-300">
                Your Bike. Your Club. Our Care.
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Your Bike. <span className="text-[#F97316]">Our Priority.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Professional motorcycle servicing, reliable repairs, and convenient service tracking — all in one place.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/book-service"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Book a Service
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all backdrop-blur-sm"
              >
                Explore Services
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-left">
              <div>
                <p className="text-2xl font-extrabold text-[#F97316]">500+</p>
                <p className="text-xs text-neutral-400">Bikes Serviced</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">4.9 ★</p>
                <p className="text-xs text-neutral-400">Verified Rating</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">100%</p>
                <p className="text-xs text-neutral-400">Genuine Spares</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-semibold text-[#F97316]">Active Workshop Slot</span>
                  <h3 className="text-base font-bold text-white">BikeFix Club Aruppukkottai</h3>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Open Today
                </span>
              </div>

              {/* Service Tracker Mock Preview */}
              <div className="space-y-3.5 mb-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Live Service Tracker Flow</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50">
                    <span className="font-semibold text-neutral-200">1. Booking Confirmed</span>
                    <span className="text-emerald-400 font-bold">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50">
                    <span className="font-semibold text-neutral-200">2. Bike Checked In & Inspected</span>
                    <span className="text-emerald-400 font-bold">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFF7ED]/10 border border-[#F97316]/40">
                    <span className="font-semibold text-[#F97316]">3. Master Service in Progress</span>
                    <span className="text-[#F97316] font-bold animate-pulse">● Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/40 border border-neutral-800 text-neutral-500">
                    <span>4. Quality Check & Wash</span>
                    <span>Queued</span>
                  </div>
                </div>
              </div>

              {/* Workshop Quick Contact Box */}
              <div className="p-4 rounded-xl bg-neutral-800/90 border border-neutral-700 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <MapPin className="w-4 h-4 text-[#F97316] shrink-0" />
                  <span>2/2, RS Puram, Aruppukkottai</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <Phone className="w-4 h-4 text-[#F97316] shrink-0" />
                  <span>Direct Hotline: <strong className="text-white">9597881218</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
            Service Catalogue
          </span>
          <h2 className="text-3xl font-extrabold text-[#111111]">
            Comprehensive Care for Every Ride
          </h2>
          <p className="text-neutral-600 text-sm">
            From routine periodic checkups to complex engine diagnostics, our workshop is fully equipped for your motorcycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = categoryIcons[s.category_slug] || Wrench;
            return (
              <div
                key={s.id}
                className="group p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#F97316]/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                    {s.category_name}
                  </span>
                  <h3 className="text-lg font-bold text-[#111111] mt-1 mb-2 group-hover:text-[#F97316] transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-[#737373] line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#737373]">Starting at</span>
                    <p className="text-lg font-extrabold text-[#111111]">
                      ₹{parseFloat(s.standard_price).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Link
                    to="/book-service"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-[#171717] bg-neutral-100 group-hover:bg-[#F97316] group-hover:text-white transition-colors"
                  >
                    Book Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 font-bold text-sm text-[#F97316] hover:text-[#EA580C]"
          >
            View Full Service Catalogue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Why Choose BikeFix Club */}
      <section className="bg-white border-y border-[#E5E5E5] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
              Why BikeFix Club
            </span>
            <h2 className="text-3xl font-extrabold text-[#111111]">
              Workshop Energy. Digital Convenience.
            </h2>
            <p className="text-neutral-600 text-sm">
              We eliminate traditional workshop stress with upfront pricing, verified mechanics, and live online tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="space-y-3 p-5 rounded-xl bg-[#F8F8F8] border border-[#E5E5E5]">
                  <div className="w-10 h-10 rounded-lg bg-[#F97316] text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#111111]">{feat.title}</h3>
                  <p className="text-xs text-[#737373] leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
            Effortless Process
          </span>
          <h2 className="text-3xl font-extrabold text-[#111111]">
            How BikeFix Club Works
          </h2>
          <p className="text-neutral-600 text-sm">
            Four simple steps to get your motorcycle serviced with total peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { step: '01', title: 'Book Online', desc: 'Select your motorcycle, requested services, and preferred date slot in 2 minutes.' },
            { step: '02', title: 'Bike Check-In', desc: 'Bring your bike to our Aruppukkottai workshop for 24-point visual inspection.' },
            { step: '03', title: 'Live Tracking', desc: 'Follow diagnosis, repair progress, and mechanic notes on your smartphone.' },
            { step: '04', title: 'Pick Up & Ride', desc: 'Inspect your bike, review the itemized tax invoice, pay online/cash, and ride away.' }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-[#E5E5E5] relative space-y-3">
              <span className="text-3xl font-black text-[#F97316]/20">{item.step}</span>
              <h3 className="text-base font-bold text-[#111111]">{item.title}</h3>
              <p className="text-xs text-[#737373] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Reviews Section */}
      <section className="bg-white border-y border-[#E5E5E5] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
              Verified Feedback
            </span>
            <h2 className="text-3xl font-extrabold text-[#111111]">
              What Our Club Riders Say
            </h2>
            <p className="text-neutral-600 text-sm">
              Reviews can only be submitted after motorcycle delivery and full payment verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 rounded-2xl bg-[#F8F8F8] border border-[#E5E5E5] space-y-4">
                <div className="flex items-center gap-1 text-[#EAB308]">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <p className="text-xs text-[#171717] leading-relaxed italic">
                  "{r.comment}"
                </p>

                <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#111111]">{r.customer_name}</h4>
                    <p className="text-[11px] text-[#737373]">{r.bike_brand} {r.bike_model}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Location Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#111111] text-white p-8 sm:p-12 overflow-hidden relative">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs uppercase font-bold tracking-wider text-[#F97316]">
              Visit Our Workshop
            </span>
            <h2 className="text-3xl font-extrabold">
              Ride In Anytime to BikeFix Club
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Located conveniently at <strong>2/2, RS Puram, Aruppukkottai</strong>. Feel free to book online or drop in for walk-in repair estimates.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <a
                href="tel:9597881218"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#EA580C] transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call 9597881218
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors border border-white/20"
              >
                <MapPin className="w-4 h-4" />
                View Map & Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
