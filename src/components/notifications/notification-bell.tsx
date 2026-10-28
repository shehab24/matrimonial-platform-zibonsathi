'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/actions/notification';
import { NotificationItem, type NotificationData } from './notification-item';

const POLL_MS = 60_000;

export function NotificationBell() {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    const result = await getNotifications(10);
    if (result.success) {
      setItems(result.notifications);
      setUnreadCount(result.unreadCount);
    }
  }, []);

  // Load on mount, then poll and refresh whenever the tab regains focus
  React.useEffect(() => {
    const load = () => void refresh();
    const initial = setTimeout(load, 0);
    const interval = setInterval(load, POLL_MS);
    window.addEventListener('focus', load);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener('focus', load);
    };
  }, [refresh]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    if (!open) void refresh();
    setOpen(!open);
  };

  const onOpenItem = (n: NotificationData) => {
    setOpen(false);
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date() } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
      void markNotificationRead(n.id);
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t('bell')}
        title={t('bell')}
        className="relative p-2 rounded-md text-gray-700 hover:text-green-700 hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? `${format.number(9)}+` : format.number(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">{t('title')}</h2>
            {unreadCount > 0 && (
              <button onClick={markAll} className="text-xs text-green-700 hover:underline">
                {t('markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">{t('empty')}</p>
            ) : (
              items.map((n) => <NotificationItem key={n.id} notification={n} onOpen={onOpenItem} />)
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-gray-50"
          >
            {t('viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
