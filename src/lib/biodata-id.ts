import { prisma } from './prisma';
import { Gender } from '@prisma/client';

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
 * Assign a biodata ID to a profile (used during admin approval)
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

  const biodataId = await generateBiodataId(profile.gender);

  await prisma.profile.update({
    where: { id: profileId },
    data: { oderId: biodataId },
  });

  return biodataId;
}
