import { NotificationType } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Create a notification. Never throws: a failed notification must not break the
 * action that triggered it. Repeat events (e.g. un-like/like again) are collapsed
 * while the previous notification from the same actor is still unread.
 */
export async function notify(userId: string, type: NotificationType, actorProfileId?: string | null) {
  try {
    const duplicate = await prisma.notification.findFirst({
      where: { userId, type, actorProfileId: actorProfileId ?? null, readAt: null },
      select: { id: true },
    });
    if (duplicate) return;

    await prisma.notification.create({
      data: { userId, type, actorProfileId: actorProfileId ?? null },
    });
  } catch (error) {
    console.error('notify error:', error);
  }
}
