'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Toggle ignore status for a profile.
 * @param profileId - The Profile ID (not user ID) to ignore/unignore
 */
export async function toggleIgnore(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'লগইন করুন' };
  }

  const userId = session.user.id;

  try {
    // Get the user ID from the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
    }

    const targetUserId = profile.userId;

    // Can't ignore yourself
    if (userId === targetUserId) {
      return { success: false, error: 'নিজেকে উপেক্ষা করতে পারবেন না' };
    }

    // Check if already ignored
    const existing = await prisma.ignoredProfile.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId: targetUserId,
        },
      },
    });

    if (existing) {
      // Remove from ignored
      await prisma.ignoredProfile.delete({
        where: { id: existing.id },
      });
      revalidatePath('/browse');
      revalidatePath('/favorites');
      return { success: true, isIgnored: false };
    } else {
      // Add to ignored
      await prisma.ignoredProfile.create({
        data: {
          userId,
          profileId: targetUserId,
        },
      });
      revalidatePath('/browse');
      revalidatePath('/favorites');
      return { success: true, isIgnored: true };
    }
  } catch (error) {
    console.error('Ignore toggle error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে' };
  }
}

/**
 * Check if a profile is ignored by the current user
 * @param profileId - The Profile ID to check
 */
export async function checkIgnoreStatus(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: true, isIgnored: false };
  }

  try {
    // Get the user ID from the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: true, isIgnored: false };
    }

    const ignored = await prisma.ignoredProfile.findUnique({
      where: {
        userId_profileId: {
          userId: session.user.id,
          profileId: profile.userId,
        },
      },
    });

    return { success: true, isIgnored: !!ignored };
  } catch (error) {
    console.error('Check ignore status error:', error);
    return { success: false, isIgnored: false };
  }
}

/**
 * Get all ignored profiles of the current user
 */
export async function getIgnoredProfiles() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'লগইন করুন', ignored: [] };
  }

  try {
    const ignored = await prisma.ignoredProfile.findMany({
      where: { userId: session.user.id },
      include: {
        profile: {
          select: {
            id: true,
            profile: {
              select: {
                id: true,
                oderId: true,
                displayName: true,
                dateOfBirth: true,
                gender: true,
                division: true,
                district: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, ignored };
  } catch (error) {
    console.error('Get ignored profiles error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে', ignored: [] };
  }
}

/**
 * Remove a profile from ignored list
 * @param targetUserId - The User ID to remove from ignored (this comes from the ignored list)
 */
export async function removeFromIgnored(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'লগইন করুন' };
  }

  try {
    await prisma.ignoredProfile.delete({
      where: {
        userId_profileId: {
          userId: session.user.id,
          profileId: targetUserId,
        },
      },
    });

    revalidatePath('/favorites');
    revalidatePath('/browse');
    return { success: true };
  } catch (error) {
    console.error('Remove from ignored error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে' };
  }
}
