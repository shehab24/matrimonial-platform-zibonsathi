import { prisma } from './prisma';
import { Gender, Prisma } from '@prisma/client';

/**
 * Generate a unique Biodata ID in format:
 * - ZBM-00001 for Male
 * - ZBF-00001 for Female
 * ZB = Zibonsathi Biodata
 */
export async function generateBiodataId(gender: Gender): Promise<string> {
  const prefix = gender === Gender.MALE ? 'ZBM' : 'ZBF';
  
  // Find the highest existing ID for this gender prefix
  const lastProfile = await prisma.profile.findFirst({
    where: {
      oderId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      oderId: 'desc',
    },
    select: {
      oderId: true,
    },
  });

  let nextNumber = 1;
  
  if (lastProfile?.oderId) {
    // Extract the number from the ID (e.g., "ZBM-00042" -> 42)
    const match = lastProfile.oderId.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  // Pad to 5 digits (allows up to 99999 profiles per gender)
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  
  return `${prefix}-${paddedNumber}`;
}

/**
 * Assign a biodata ID to a profile. Runs when a member submits their biodata (so it has its number while
 * under review) and again on admin approval as a fallback for older biodatas submitted without one.
 * A rejected biodata keeps its number, so numbers can have gaps; that's expected.
 */
export async function assignBiodataId(profileId: string): Promise<string | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { gender: true, oderId: true },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  // Don't reassign if already has an ID
  if (profile.oderId) {
    return profile.oderId;
  }

  if (!profile.gender) {
    throw new Error('Profile gender is required to generate biodata ID');
  }

  // Two submissions at the same moment can pick the same next number; the unique index rejects the
  // second one, so try again with a fresh number
  for (let attempt = 0; ; attempt++) {
    const biodataId = await generateBiodataId(profile.gender);
    try {
      await prisma.profile.update({
        where: { id: profileId },
        data: { oderId: biodataId },
      });
      return biodataId;
    } catch (error) {
      const isConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (!isConflict || attempt >= 4) throw error;
    }
  }
}
