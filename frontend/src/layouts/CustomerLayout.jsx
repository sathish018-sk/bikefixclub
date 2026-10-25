import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Bike,
  CalendarPlus,
  CalendarCheck,
  Compass,
  History,
  Receipt,
  Star,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/customer', icon: LayoutDashboard },
    { label: 'My Bikes', path: '/customer/bikes', icon: Bike },
    { label: 'Book a Service', path: '/customer/book', icon: CalendarPlus },
    { label: 'My Bookings', path: '/customer/bookings', icon: CalendarCheck },
    { label: 'Service Tracking', path: '/customer/tracking', icon: Compass },
    { label: 'Service History', path: '/customer/history', icon: History },
    { label: 'Invoices & Payments', path: '/customer/invoices', icon: Receipt },
    { label: 'My Reviews', path: '/customer/reviews', icon: Star },
    { label: 'Notifications', path: '/customer/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', path: '/customer/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/customer') return location.pathname === '/customer';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Logo size="sm" showTagline={false} to="/customer" />
        <div className="flex items-center gap-2">
          <Link to="/customer/notifications" className="relative p-2 text-neutral-600 hover:text-[#F97316]">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC2626] rounded-full ring-2 ring-white" />
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E5E5] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#E5E5E5]">
          <Logo size="sm" showTagline={true} to="/customer" />
        </div>

        {/* Customer Mini Profile */}
        <div className="p-4 mx-3 my-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111111] text-[#F97316] font-bold flex items-center justify-center shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-[#171717] truncate">{user?.name || 'Customer'}</h4>
            <p className="text-xs text-[#737373] truncate">{user?.phone || user?.email}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-orange-50/90 text-[#EA580C] font-bold shadow-2xs'
                    : 'text-[#404040] hover:bg-neutral-100 hover:text-[#171717] font-medium'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#F97316] rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-[#F97316]' : 'text-neutral-500 group-hover:text-neutral-800'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#DC2626] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E5E5E5] space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#737373] hover:text-[#171717] rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
