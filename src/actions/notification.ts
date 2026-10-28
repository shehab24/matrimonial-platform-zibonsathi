'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';

export async function getNotifications(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('loginRequired'), notifications: [], unreadCount: 0 };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        include: { actorProfile: { select: { id: true, displayName: true, oderId: true } } },
      }),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    ]);

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error('getNotifications error:', error);
    return { success: false, error: await actionError('somethingWrong'), notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('loginRequired') };
  }

  try {
    // Scoped by userId so users can only touch their own notifications
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return { success: false, error: await actionError('somethingWrong') };
  }
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('loginRequired') };
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    return { success: false, error: await actionError('somethingWrong') };
  }
}
