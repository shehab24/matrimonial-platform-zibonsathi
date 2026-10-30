import { prisma } from '@/lib/prisma';
import { ConnectionStatus } from '@prisma/client';

export const MAX_MESSAGE_LENGTH = 2000;

/** The ACCEPTED connection with this id that the user is part of, or null */
export async function findChatConnection(connectionId: string, userId: string) {
  return prisma.connection.findFirst({
    where: {
      id: connectionId,
      status: ConnectionStatus.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}
