'use client';

import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { Heart, UserPlus, UserCheck, UserX, BadgeCheck, AlertCircle } from 'lucide-react';
import type { NotificationType } from '@prisma/client';

export interface NotificationData {
  id: string;
  type: NotificationType;
  readAt: Date | string | null;
  createdAt: Date | string;
  actorProfile: { id: string; displayName: string | null; oderId: string | null } | null;
}

const icons = {
  FAVORITED: { icon: Heart, className: 'text-pink-700 bg-pink-100' },
  CONNECTION_REQUEST: { icon: UserPlus, className: 'text-blue-700 bg-blue-100' },
  CONNECTION_ACCEPTED: { icon: UserCheck, className: 'text-green-700 bg-green-100' },
  CONNECTION_REJECTED: { icon: UserX, className: 'text-red-600 bg-red-100' },
  PROFILE_APPROVED: { icon: BadgeCheck, className: 'text-green-700 bg-green-100' },
  PROFILE_REJECTED: { icon: AlertCircle, className: 'text-yellow-700 bg-yellow-100' },
} as const;

/** Where clicking a notification takes the user */
export function notificationHref(n: NotificationData) {
  switch (n.type) {
    case 'FAVORITED':
      return n.actorProfile?.oderId ? `/profile/${n.actorProfile.id}` : '/liked-me';
    case 'CONNECTION_REQUEST':
      return '/connections/received';
    case 'CONNECTION_ACCEPTED':
    case 'CONNECTION_REJECTED':
      return '/connections/sent';
    default:
      return '/profile';
  }
}

export function NotificationItem({ notification, onOpen }: { notification: NotificationData; onOpen: (n: NotificationData) => void }) {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const { icon: Icon, className } = icons[notification.type];
  // Identify people by biodata ID rather than their real name
  const name = notification.actorProfile?.oderId
    ? t('biodata', { id: notification.actorProfile.oderId })
    : t('someone');
  const unread = !notification.readAt;

  return (
    <Link
      href={notificationHref(notification)}
      onClick={() => onOpen(notification)}
      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${unread ? 'bg-green-50' : ''}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${unread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {t(`types.${notification.type}`, { name })}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">
          {format.relativeTime(new Date(notification.createdAt), new Date())}
        </span>
      </span>
      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-600" aria-label={t('unread')} />}
    </Link>
  );
}
