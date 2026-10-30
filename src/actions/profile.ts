'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { ProfileStatus } from '@prisma/client';
import { z } from 'zod';

// Empty inputs arrive as '' (text) or NaN (cleared number fields) - store them as null
const optText = z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(5000).nullish());
const optInt = z.preprocess(
  (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : Number(v)),
  z.number().int().min(0).max(50).nullish()
);

// Only the fields a member may edit. Anything else the client sends (status, oderId,
// approvedAt, photos, adminNote...) is stripped, so it can't be written through this action
const profileInputSchema = z.object({
  displayName: optText,
  dateOfBirth: optText,
  gender: z.preprocess((v) => (v === '' ? null : v), z.enum(['MALE', 'FEMALE']).nullish()),
  division: optText,
  district: optText,
  upazila: optText,
  country: optText,
  education: optText,
  educationDetails: optText,
  occupation: optText,
  occupationDetails: optText,
  monthlyIncome: optText,
  maritalStatus: z.preprocess((v) => (v === '' ? null : v), z.enum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED']).nullish()),
  numberOfChildren: optInt,
  fatherAlive: z.boolean().nullish(),
  motherAlive: z.boolean().nullish(),
  siblings: optInt,
  familyType: optText,
  familyStatus: optText,
  prayerHabit: optText,
  beardOrHijab: optText,
  mazhab: optText,
  sect: optText,
  aboutMe: optText,
  partnerPreferences: optText,
  phoneNumber: optText,
  guardianPhone: optText,
  showPhoneToConnected: z.boolean().optional(),
  showGuardianPhoneToConnected: z.boolean().optional(),
});

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

  const parsed = profileInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: await actionError('profileSaveFailed') };
  }

  try {
    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    const dob = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null;
    const updateData: Record<string, unknown> = {
      ...parsed.data,
      dateOfBirth: dob && !Number.isNaN(dob.getTime()) ? dob : null,
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

    // A biodata suspended by an admin stays hidden until an admin restores it
    if (profile.status === ProfileStatus.SUSPENDED) {
      return { success: false, error: await actionError('profileSuspended') };
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
