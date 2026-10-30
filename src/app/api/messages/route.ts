import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findChatConnection, MAX_MESSAGE_LENGTH } from '@/lib/messaging';
import { z } from 'zod';

const sendSchema = z.object({
  connectionId: z.string().min(1),
  body: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  // Only the two members of an ACCEPTED connection can message each other
  const connection = await findChatConnection(parsed.data.connectionId, session.user.id);
  if (!connection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const receiverId = connection.senderId === session.user.id ? connection.receiverId : connection.senderId;
  const message = await prisma.message.create({
    data: {
      connectionId: connection.id,
      senderId: session.user.id,
      receiverId,
      body: parsed.data.body,
    },
    select: { id: true, body: true, senderId: true, createdAt: true },
  });

  return NextResponse.json({ message });
}
