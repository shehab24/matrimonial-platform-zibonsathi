import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findChatConnection } from '@/lib/messaging';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await findChatConnection(connectionId, session.user.id);
  if (!connection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { connectionId },
    orderBy: { createdAt: 'asc' },
    take: 500,
    select: { id: true, body: true, senderId: true, createdAt: true },
  });

  // Opening the thread marks everything sent to this user as read
  await prisma.message.updateMany({
    where: { connectionId, receiverId: session.user.id, status: 'SENT' },
    data: { status: 'READ' },
  });

  return NextResponse.json({ messages });
}
