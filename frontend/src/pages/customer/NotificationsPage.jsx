import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, Clock, ShieldCheck, Receipt, Calendar, Wrench } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const iconMap = {
    booking: Calendar,
    service_status: Wrench,
    invoice: Receipt,
    payment: ShieldCheck,
    system: Bell,
    reminder: Clock,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Notifications & Alerts</h1>
          <p className="text-xs text-[#737373]">
            Real-time updates regarding service status transitions, booking confirmations, and invoices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#F97316] bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
          <Bell className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Notifications Yet</h3>
          <p className="text-xs text-[#737373]">
            You're all caught up! Updates regarding your motorcycles will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            const isUnread = !n.is_read || n.is_read === 0;

            return (
              <div
                key={n.id}
                onClick={() => isUnread && markAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  isUnread
                    ? 'bg-white border-[#F97316]/50 shadow-xs ring-1 ring-[#F97316]/10'
                    : 'bg-white/80 border-[#E5E5E5] opacity-75'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUnread ? 'bg-[#FFF7ED] text-[#F97316]' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${isUnread ? 'text-[#111111]' : 'text-neutral-700'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
