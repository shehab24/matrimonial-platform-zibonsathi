'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/actions/notification';
import { NotificationItem, type NotificationData } from '@/components/notifications/notification-item';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');
  const [items, setItems] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getNotifications(100);
    if (result.success) {
      setItems(result.notifications);
      setUnreadCount(result.unreadCount);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const onOpen = (n: NotificationData) => {
    if (!n.readAt) void markNotificationRead(n.id);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>{t('markAllRead')}</Button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {isLoading ? (
          <p className="px-4 py-12 text-center text-gray-500">{tc('loading')}</p>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-500">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            {t('empty')}
          </div>
        ) : (
          items.map((n) => <NotificationItem key={n.id} notification={n} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}
