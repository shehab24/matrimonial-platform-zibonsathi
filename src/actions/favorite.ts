'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Toggle favorite status for a profile.
 * @param profileId - The Profile ID (not user ID) to favorite/unfavorite
 */
export async function toggleFavorite(profileId: string) {
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

    // Can't favorite yourself
    if (userId === targetUserId) {
      return { success: false, error: 'নিজেকে পছন্দে রাখতে পারবেন না' };
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId: targetUserId,
        },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      revalidatePath('/favorites');
      return { success: true, isFavorite: false };
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId,
          profileId: targetUserId,
        },
      });
      revalidatePath('/favorites');
      return { success: true, isFavorite: true };
    }
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে' };
  }
}

/**
 * Check if a profile is favorited by the current user
 * @param profileId - The Profile ID to check
 */
export async function checkFavoriteStatus(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: true, isFavorite: false };
  }

  try {
    // Get the user ID from the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: true, isFavorite: false };
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_profileId: {
          userId: session.user.id,
          profileId: profile.userId,
        },
      },
    });

    return { success: true, isFavorite: !!favorite };
  } catch (error) {
    console.error('Check favorite status error:', error);
    return { success: false, isFavorite: false };
  }
}

/**
 * Get all favorites of the current user
 */
export async function getFavorites() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'লগইন করুন', favorites: [] };
  }

  try {
    const favorites = await prisma.favorite.findMany({
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
                education: true,
                occupation: true,
                maritalStatus: true,
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

    return { success: true, favorites };
  } catch (error) {
    console.error('Get favorites error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে', favorites: [] };
  }
}

/**
 * Get all users who favorited the current user ("Who liked me")
 */
export async function getWhoLikedMe() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'লগইন করুন', likedBy: [] };
  }

  try {
    const likedBy = await prisma.favorite.findMany({
      where: { profileId: session.user.id },
      include: {
        user: {
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
                education: true,
                occupation: true,
                maritalStatus: true,
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

    return { success: true, likedBy };
  } catch (error) {
    console.error('Get who liked me error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে', likedBy: [] };
  }
}

/**
 * Remove a profile from favorites
 * @param profileId - The Profile ID to remove
 */
export async function removeFromFavorites(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'লগইন করুন' };
  }

  try {
    // Get the user ID from the profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
    }

    await prisma.favorite.delete({
      where: {
        userId_profileId: {
          userId: session.user.id,
          profileId: profile.userId,
        },
      },
    });

    revalidatePath('/favorites');
    return { success: true };
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return { success: false, error: 'কিছু সমস্যা হয়েছে' };
  }
}
