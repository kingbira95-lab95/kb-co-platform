import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { X, TrendingUp, TrendingDown, Bell, Wallet, Newspaper } from 'lucide-react';

interface ToastProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    symbol?: string;
    urgent?: boolean;
  };
  onDismiss: (id: string) => void;
}

function Toast({ notification: n, onDismiss }: ToastProps) {
  const Icon =
    n.type === 'price' ? (n.message.includes('▲') ? TrendingUp : TrendingDown) :
    n.type === 'dividend' ? Wallet :
    n.type === 'news' ? Newspaper : Bell;

  const iconColor =
    n.type === 'price' && n.message.includes('▲') ? '#22c55e' :
    n.type === 'price' ? '#ef4444' :
    n.type === 'dividend' ? '#D4AF37' :
    n.type === 'news' ? '#a855f7' : '#3b82f6';

  return (
    <motion.div
      layout
      initial={{ x: 400, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl mb-3"
      style={{
        background: 'rgba(13,21,48,0.97)',
        backdropFilter: 'blur(20px)',
        border: n.urgent ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(212,175,55,0.15)',
        minWidth: 300,
        maxWidth: 340,
        boxShadow: n.urgent ? '0 0 30px rgba(212,175,55,0.2)' : '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {n.urgent && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
        />
      )}
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${iconColor}20` }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">{n.title}</div>
          <div className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">{n.message}</div>
          {n.symbol && (
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
              {n.symbol}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(n.id)}
          className="flex-shrink-0 text-gray-500 hover:text-white transition-colors mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationToasts() {
  const { notifications, clearNotification } = useStore();
  const [shown, setShown] = useState<string[]>([]);
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read && !shown.includes(n.id)).slice(0, 3);
    if (unread.length > 0) {
      const ids = unread.map(n => n.id);
      setShown(prev => [...prev, ...ids]);
      setVisible(prev => [...prev, ...ids]);
      ids.forEach(id => {
        setTimeout(() => {
          setVisible(prev => prev.filter(v => v !== id));
        }, 5000);
      });
    }
  }, [notifications]);

  const dismiss = (id: string) => {
    setVisible(prev => prev.filter(v => v !== id));
    clearNotification(id);
  };

  const visibleNotifications = notifications.filter(n => visible.includes(n.id));

  return (
    <div className="fixed bottom-6 right-4 z-[200] flex flex-col items-end">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map(n => (
          <Toast key={n.id} notification={n} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
