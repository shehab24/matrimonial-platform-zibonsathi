'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { notify } from '@/lib/notifications';
import { ConnectionStatus } from '@prisma/client';

export async function sendConnectionRequest(receiverProfileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  try {
    const senderProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!senderProfile) {
      return { success: false, error: await actionError('ownProfileNotFound') };
    }

    const receiverProfile = await prisma.profile.findUnique({
      where: { id: receiverProfileId },
    });

    if (!receiverProfile) {
      return { success: false, error: await actionError('recipientNotFound') };
    }

    // Check existing connection
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: receiverProfile.userId },
          { senderId: receiverProfile.userId, receiverId: session.user.id },
        ],
      },
    });

    if (existingConnection) {
      return { success: false, error: await actionError('connectionExists') };
    }

    // Transaction with SELECT FOR UPDATE on credit balance
    const result = await prisma.$transaction(async (tx) => {
      const creditBalance = await tx.creditBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!creditBalance || creditBalance.balance < 1) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const connection = await tx.connection.create({
        data: {
          senderId: session.user.id,
          receiverId: receiverProfile.userId,
          senderProfileId: senderProfile.id,
          receiverProfileId: receiverProfile.id,
          creditSpent: 1,
        },
      });

      const updatedBalance = await tx.creditBalance.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: 1 } },
      });

      await tx.creditLedger.create({
        data: {
          userId: session.user.id,
          type: 'DEDUCTION',
          amount: -1,
          balanceBefore: creditBalance.balance,
          balanceAfter: updatedBalance.balance,
          connectionId: connection.id,
          note: 'সংযোগ অনুরোধ পাঠানো হয়েছে',
        },
      });

      return connection;
    });

    await notify(receiverProfile.userId, 'CONNECTION_REQUEST', senderProfile.id);

    return { success: true, connection: result };
  } catch (error: unknown) {
    // Only surface the known credit error; anything else gets a generic message
    const errorMessage = await actionError(
      error instanceof Error && error.message === 'INSUFFICIENT_CREDITS' ? 'insufficientCredits' : 'connectionFailed'
    );
    console.error('sendConnectionRequest error:', error);
    return { success: false, error: errorMessage };
  }
}

export async function respondToConnection(
  connectionId: string,
  action: 'ACCEPT' | 'REJECT'
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  try {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return { success: false, error: await actionError('connectionNotFound') };
    }

    if (connection.receiverId !== session.user.id) {
      return { success: false, error: await actionError('onlyRecipient') };
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return { success: false, error: await actionError('alreadyProcessed') };
    }

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: action === 'ACCEPT' ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED,
      },
    });

    await notify(
      connection.senderId,
      action === 'ACCEPT' ? 'CONNECTION_ACCEPTED' : 'CONNECTION_REJECTED',
      connection.receiverProfileId
    );

    return { success: true, connection: updated };
  } catch (error) {
    console.error('respondToConnection error:', error);
    return { success: false, error: await actionError('respondFailed') };
  }
}

export async function getMyConnections() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  try {
    const sent = await prisma.connection.findMany({
      where: { senderId: session.user.id },
      include: {
        receiverProfile: {
          select: {
            id: true,
            oderId: true,
            displayName: true,
            dateOfBirth: true,
            gender: true,
            maritalStatus: true,
            division: true,
            district: true,
            education: true,
            occupation: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const received = await prisma.connection.findMany({
      where: { receiverId: session.user.id },
      include: {
        senderProfile: {
          select: {
            id: true,
            oderId: true,
            displayName: true,
            dateOfBirth: true,
            gender: true,
            maritalStatus: true,
            division: true,
            district: true,
            education: true,
            occupation: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, sent, received };
  } catch (error) {
    console.error('getMyConnections error:', error);
    return { success: false, error: await actionError('connectionsLoadFailed') };
  }
}

export async function getContactInfo(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, error: await actionError('notAuthorized') };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return { authorized: false, error: await actionError('profileNotFound') };
    }

    // CRITICAL: server-side only check
    const connection = await prisma.connection.findFirst({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { senderId: session.user.id, receiverProfileId: profileId },
          { receiverId: session.user.id, senderProfileId: profileId },
        ],
      },
    });

    if (!connection) {
      return { authorized: false };
    }

    return {
      authorized: true,
      phoneNumber: profile.showPhoneToConnected ? profile.phoneNumber : null,
      guardianPhone: profile.showGuardianPhoneToConnected ? profile.guardianPhone : null,
    };
  } catch (error) {
    console.error('getContactInfo error:', error);
    return { authorized: false, error: await actionError('contactLoadFailed') };
  }
}

export async function checkConnectionStatus(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: true, status: null };
  }

  try {
    // First get the profile to find the user ID
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: true, status: null };
    }

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: profile.userId },
          { senderId: profile.userId, receiverId: session.user.id },
        ],
      },
      select: { status: true },
    });

    return { 
      success: true, 
      status: connection?.status || null 
    };
  } catch (error) {
    console.error('checkConnectionStatus error:', error);
    return { success: false, status: null };
  }
}
