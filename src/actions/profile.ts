'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { ProfileStatus } from '@prisma/client';

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { photos: true },
  });

  if (!profile) {
    return { success: false, error: await actionError('profileNotFound') };
  }

  return { success: true, profile };
}

export async function upsertProfile(data: {
  displayName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  division?: string;
  district?: string;
  upazila?: string;
  country?: string;
  education?: string;
  educationDetails?: string;
  occupation?: string;
  occupationDetails?: string;
  monthlyIncome?: string;
  maritalStatus?: 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED';
  numberOfChildren?: number;
  fatherAlive?: boolean;
  motherAlive?: boolean;
  siblings?: number;
  familyType?: string;
  familyStatus?: string;
  prayerHabit?: string;
  beardOrHijab?: string;
  mazhab?: string;
  sect?: string;
  aboutMe?: string;
  partnerPreferences?: string;
  phoneNumber?: string;
  guardianPhone?: string;
  showPhoneToConnected?: boolean;
  showGuardianPhoneToConnected?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  try {
    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    const updateData: Record<string, unknown> = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    };

    // If profile was APPROVED, reset to DRAFT on update
    if (existing?.status === ProfileStatus.APPROVED) {
      updateData.status = ProfileStatus.DRAFT;
      updateData.approvedAt = null;
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });

    return { success: true, profile };
  } catch (error) {
    console.error('upsertProfile error:', error);
    return { success: false, error: await actionError('profileSaveFailed') };
  }
}

export async function submitForApproval() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return { success: false, error: await actionError('profileNotFound') };
    }

    if (profile.status === ProfileStatus.PENDING_APPROVAL) {
      return { success: false, error: await actionError('alreadyPending') };
    }

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { status: ProfileStatus.PENDING_APPROVAL },
    });

    return { success: true };
  } catch (error) {
    console.error('submitForApproval error:', error);
    return { success: false, error: await actionError('submitFailed') };
  }
}

export async function getPublicProfile(id: string) {
  const session = await auth();

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { photos: true, user: { select: { id: true, createdAt: true } } },
  });

  if (!profile || profile.status !== ProfileStatus.APPROVED || !profile.isVisible) {
    return { success: false, error: await actionError('profileNotFound') };
  }

  // Strip contact info by default
  const safeProfile = {
    ...profile,
    phoneNumber: null as string | null,
    guardianPhone: null as string | null,
  };

  // Check if requesting user has ACCEPTED connection
  if (session?.user?.id) {
    const connection = await prisma.connection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: session.user.id, receiverProfileId: id },
          { receiverId: session.user.id, senderProfileId: id },
        ],
      },
    });

    if (connection) {
      if (profile.showPhoneToConnected) {
        safeProfile.phoneNumber = profile.phoneNumber;
      }
      if (profile.showGuardianPhoneToConnected) {
        safeProfile.guardianPhone = profile.guardianPhone;
      }
    }
  }

  return { success: true, profile: safeProfile };
}
