// frontend/src/components/NotificationBell.jsx
import { useState, useEffect } from 'react';
import { Bell, X, Heart, MessageCircle, Calendar, UserPlus, Check } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'event': return Calendar;
      case 'member': return UserPlus;
      default: return Bell;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition"
        style={{ color: 'var(--text-primary)' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-xl border border-white/10 z-50">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-white/40">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-white/40">No notifications</div>
            ) : (
              notifications.map((notif) => {
                const Icon = getIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 hover:bg-white/5 transition cursor-pointer ${
                      !notif.read ? 'bg-white/5' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.link) {
                        window.location.href = notif.link;
                      }
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {notif.message}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(notif.time).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}