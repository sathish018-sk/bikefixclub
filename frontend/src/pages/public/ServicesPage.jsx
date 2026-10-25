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
  Clock,
  Search,
  ArrowRight,
  Info
} from 'lucide-react';

export default function ServicesPage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const [catsRes, svcsRes] = await Promise.all([
          api.get('/public/service-categories'),
          api.get('/public/services')
        ]);
        setCategories(catsRes.data || []);
        setServices(svcsRes.data || []);
      } catch (err) {
        console.error('Failed to load services catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  const categoryIcons = {
    'general-service': Wrench,
    'oil-fluids': Droplet,
    'brakes-suspension': Disc,
    'engine-performance': Cpu,
    'tyres-wheel': CircleDot,
    'electricals-diagnostics': Zap,
  };

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory ? s.category_id === selectedCategory : true;
    const matchesSearch = searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase font-extrabold tracking-wider text-[#F97316]">
          BikeFix Club Workshop Catalogue
        </span>
        <h1 className="text-4xl font-extrabold text-[#111111]">
          Motorcycle Services & Care Packages
        </h1>
        <p className="text-neutral-600 text-sm leading-relaxed">
          Explore our complete range of certified motorcycle maintenance, diagnostic, and overhaul procedures. All labour prices are transparent and backed by our service guarantee.
        </p>
      </div>

      {/* Pricing Policy Disclaimer Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Note on Pricing:</strong> Standard labour prices shown below represent base rates. Different motorcycle makes, engine cubic capacity (e.g., 100cc commuters vs 350cc–650cc twin-cylinders), and specific spare part requirements may adjust the final job card estimate.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#F97316]'
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === c.id
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#F97316]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((s) => {
          const Icon = categoryIcons[s.category_slug] || Wrench;
          return (
            <div
              key={s.id}
              className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#F97316]/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#737373]">
                    <Clock className="w-3.5 h-3.5" />
                    ~{s.estimated_duration} mins
                  </span>
                </div>

                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373]">
                  {s.category_name}
                </span>

                <h3 className="text-base font-bold text-[#111111]">
                  {s.name}
                </h3>

                <p className="text-xs text-[#737373] leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#737373]">Standard Labour Price</span>
                  <p className="text-lg font-extrabold text-[#111111]">
                    ₹{parseFloat(s.standard_price).toLocaleString('en-IN')}
                  </p>
                </div>

                <Link
                  to="/book-service"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors"
                >
                  Book Service
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
