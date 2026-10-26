'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConnectionStatus } from '@prisma/client';

export async function sendConnectionRequest(receiverProfileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'অনুমোদিত নয়' };
  }

  try {
    const senderProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!senderProfile) {
      return { success: false, error: 'আপনার প্রোফাইল পাওয়া যায়নি' };
    }

    const receiverProfile = await prisma.profile.findUnique({
      where: { id: receiverProfileId },
    });

    if (!receiverProfile) {
      return { success: false, error: 'প্রাপকের প্রোফাইল পাওয়া যায়নি' };
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
      return { success: false, error: 'সংযোগ ইতিমধ্যে বিদ্যমান' };
    }

    // Transaction with SELECT FOR UPDATE on credit balance
    const result = await prisma.$transaction(async (tx) => {
      const creditBalance = await tx.creditBalance.findUnique({
        where: { userId: session.user.id },
      });

      if (!creditBalance || creditBalance.balance < 1) {
        throw new Error('অপর্যাপ্ত ক্রেডিট');
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

    return { success: true, connection: result };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'সংযোগ অনুরোধ ব্যর্থ হয়েছে';
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
    return { success: false, error: 'অনুমোদিত নয়' };
  }

  try {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return { success: false, error: 'সংযোগ পাওয়া যায়নি' };
    }

    if (connection.receiverId !== session.user.id) {
      return { success: false, error: 'শুধুমাত্র প্রাপক এই সিদ্ধান্ত নিতে পারেন' };
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      return { success: false, error: 'এই সংযোগ ইতিমধ্যে প্রক্রিয়া করা হয়েছে' };
    }

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: action === 'ACCEPT' ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED,
      },
    });

    return { success: true, connection: updated };
  } catch (error) {
    console.error('respondToConnection error:', error);
    return { success: false, error: 'প্রতিক্রিয়া ব্যর্থ হয়েছে' };
  }
}

export async function getMyConnections() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'অনুমোদিত নয়' };
  }

  try {
    const sent = await prisma.connection.findMany({
      where: { senderId: session.user.id },
      include: {
        receiverProfile: {
          select: {
            id: true,
            displayName: true,
            gender: true,
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
            displayName: true,
            gender: true,
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
    return { success: false, error: 'সংযোগ লোড ব্যর্থ হয়েছে' };
  }
}

export async function getContactInfo(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, error: 'অনুমোদিত নয়' };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return { authorized: false, error: 'প্রোফাইল পাওয়া যায়নি' };
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
    return { authorized: false, error: 'যোগাযোগ তথ্য লোড ব্যর্থ হয়েছে' };
  }
}
