'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError, type ActionErrorKey } from '@/lib/action-error';
import { ProfileStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { normalizePhone } from '@/lib/phone';

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'passwordMin'),
});

/**
 * Change the account password. Accounts created through Google have no password yet,
 * so they can set one without the current password.
 */
export async function changePassword(data: { currentPassword?: string; newPassword: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  const parsed = passwordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: await actionError(parsed.error.issues[0].message as ActionErrorKey) };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
    if (!user) {
      return { success: false, error: await actionError('notAuthorized') };
    }

    if (user.passwordHash) {
      const valid = await bcrypt.compare(parsed.data.currentPassword ?? '', user.passwordHash);
      if (!valid) {
        return { success: false, error: await actionError('wrongPassword') };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
    });
    return { success: true };
  } catch (error) {
    console.error('changePassword error:', error);
    return { success: false, error: await actionError('somethingWrong') };
  }
}

/**
 * Save the two details every member must have. Google sign-ups skip the register form,
 * so the dashboard sends them here first. Gender can only be set once.
 */
export async function completeAccount(data: { gender?: string; phone: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  const phoneNumber = normalizePhone(data.phone);
  if (!phoneNumber) {
    return { success: false, error: await actionError('phoneInvalid') };
  }

  try {
    const [user, existing] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
      prisma.profile.findUnique({ where: { userId: session.user.id }, select: { gender: true } }),
    ]);
    const gender = existing?.gender ?? (data.gender === 'MALE' || data.gender === 'FEMALE' ? data.gender : null);
    if (!gender) {
      return { success: false, error: await actionError('genderRequired') };
    }

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { gender, phoneNumber },
      create: { userId: session.user.id, gender, phoneNumber, displayName: user?.name },
    });
    return { success: true };
  } catch (error) {
    console.error('completeAccount error:', error);
    return { success: false, error: await actionError('somethingWrong') };
  }
}

/**
 * Delete the member's biodata. Every detail, photo and pledge is erased and it leaves the public listing.
 * The row itself stays: it holds the account's gender and mobile, and connections other members paid for
 * still point at it, so they keep seeing the phone numbers they bought. A fresh biodata can be written later.
 */
export async function deleteMyBiodata() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('notAuthorized') };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return { success: false, error: await actionError('ownProfileNotFound') };
    }

    await prisma.$transaction([
      prisma.profilePhoto.deleteMany({ where: { profileId: profile.id } }),
      prisma.profile.update({
        where: { id: profile.id },
        data: {
          status: ProfileStatus.DRAFT,
          approvedAt: null,
          approvedBy: null,
          displayName: null,
          dateOfBirth: null,
          religion: null,
          sect: null,
          country: null,
          division: null,
          district: null,
          upazila: null,
          education: null,
          educationDetails: null,
          occupation: null,
          occupationDetails: null,
          monthlyIncome: null,
          maritalStatus: null,
          numberOfChildren: null,
          fatherAlive: null,
          motherAlive: null,
          siblings: null,
          familyType: null,
          familyStatus: null,
          prayerHabit: null,
          beardOrHijab: null,
          mazhab: null,
          aboutMe: null,
          partnerPreferences: null,
          hadiaPledge: null,
          removalPledgeAcceptedAt: null,
        },
      }),
    ]);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('deleteMyBiodata error:', error);
    return { success: false, error: await actionError('somethingWrong') };
  }
}
