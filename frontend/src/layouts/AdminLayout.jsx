import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Bike,
  CalendarDays,
  UserPlus,
  Wrench,
  Hammer,
  BookOpen,
  Boxes,
  Receipt,
  CreditCard,
  TrendingDown,
  Star,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Motorcycles', path: '/admin/bikes', icon: Bike },
    { label: 'Bookings', path: '/admin/bookings', icon: CalendarDays },
    { label: 'Walk-in Intake', path: '/admin/walk-in', icon: UserPlus, highlight: true },
    { label: 'Job Cards', path: '/admin/job-cards', icon: Wrench },
    { label: 'Mechanics', path: '/admin/mechanics', icon: Hammer },
    { label: 'Service Catalogue', path: '/admin/services', icon: BookOpen },
    { label: 'Spare Parts & Stock', path: '/admin/inventory', icon: Boxes },
    { label: 'Billing & Invoices', path: '/admin/billing', icon: Receipt },
    { label: 'Payments Ledger', path: '/admin/payments', icon: CreditCard },
    { label: 'Expenses', path: '/admin/expenses', icon: TrendingDown },
    { label: 'Review Moderation', path: '/admin/reviews', icon: Star },
    { label: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
    { label: 'Workshop Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#111111] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-neutral-800">
        <Logo variant="light-text" size="sm" showTagline={false} to="/admin" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-neutral-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Dark Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#111111] text-white border-r border-neutral-800 flex flex-col transition-all duration-200 ease-in-out md:static md:translate-x-0 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-neutral-800">
          {!collapsed ? (
            <Logo variant="light-text" size="sm" showTagline={true} to="/admin" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-bold mx-auto">
              BF
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Admin Badge */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-neutral-800/60 bg-neutral-900/60 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#F97316]">
              Admin Operations
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#F97316] text-white shadow-sm shadow-orange-500/20'
                    : item.highlight
                    ? 'bg-neutral-800/90 text-amber-400 hover:bg-neutral-800 border border-amber-500/20'
                    : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-neutral-400 group-hover:text-white'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-800 space-y-1">
          <Link
            to="/"
            target="_blank"
            title={collapsed ? 'View Public Site' : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Live Website</span>}
          </Link>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-lg transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Control Header */}
        <header className="bg-white border-b border-[#E5E5E5] px-6 py-3.5 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#737373]">Workshop Center:</span>
            <span className="text-xs font-bold text-[#111111] bg-neutral-100 px-2.5 py-1 rounded-md border border-[#E5E5E5]">
              2/2, RS Puram, Aruppukkottai
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Workshop Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-[#737373]">
              Support: <strong className="text-[#171717]">9597881218</strong>
            </span>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-full bg-[#111111] text-[#F97316] font-bold flex items-center justify-center">
                A
              </div>
              <span className="font-semibold text-[#171717]">{user?.name || 'Administrator'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
