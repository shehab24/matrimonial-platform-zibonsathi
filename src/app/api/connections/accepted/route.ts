import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConnectionStatus } from '@prisma/client';

// Accepted connections are the conversation threads on the messages page
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const profileSelect = { id: true, displayName: true, oderId: true };
  const connections = await prisma.connection.findMany({
    where: {
      status: ConnectionStatus.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      senderProfile: { select: profileSelect },
      receiverProfile: { select: profileSelect },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const unread = await prisma.message.groupBy({
    by: ['connectionId'],
    where: { receiverId: userId, status: 'SENT' },
    _count: { _all: true },
  });
  const unreadByConnection = new Map(unread.map((u) => [u.connectionId, u._count._all]));

  const threads = connections
    .map((c) => {
      // Show the other member's biodata name, never their account name or email
      const other = c.senderId === userId ? c.receiverProfile : c.senderProfile;
      const last = c.messages[0];
      return {
        id: c.id,
        otherUser: { id: other.id, name: other.displayName ?? other.oderId },
        lastMessage: last?.body,
        lastAt: (last?.createdAt ?? c.updatedAt).toISOString(),
        unread: unreadByConnection.get(c.id) ?? 0,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return NextResponse.json({ threads });
}
