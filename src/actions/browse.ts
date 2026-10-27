'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileStatus, Gender, MaritalStatus } from '@prisma/client';

interface BrowseFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  division?: string;
  district?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  page?: number;
}

export async function browseProfiles(filters: BrowseFilters = {}) {
  const session = await auth();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  // Get ignored profile user IDs if logged in
  let ignoredUserIds: string[] = [];
  if (session?.user?.id) {
    const ignoredProfiles = await prisma.ignoredProfile.findMany({
      where: { userId: session.user.id },
      select: { profileId: true },
    });
    ignoredUserIds = ignoredProfiles.map(ip => ip.profileId);
  }

  const where: Record<string, unknown> = {
    status: ProfileStatus.APPROVED,
    isVisible: true,
  };

  // Filter out ignored profiles
  if (ignoredUserIds.length > 0) {
    where.userId = { notIn: ignoredUserIds };
  }

  // Also filter out own profile
  if (session?.user?.id) {
    if (where.userId) {
      // Already has userId filter, need to combine
      where.AND = [
        { userId: where.userId },
        { userId: { not: session.user.id } },
      ];
      delete where.userId;
    } else {
      where.userId = { not: session.user.id };
    }
  }

  if (filters.gender && ['MALE', 'FEMALE'].includes(filters.gender)) {
    where.gender = filters.gender as Gender;
  }

  if (filters.division) {
    where.division = { contains: filters.division, mode: 'insensitive' };
  }

  if (filters.district) {
    where.district = { contains: filters.district, mode: 'insensitive' };
  }

  if (filters.education) {
    where.education = { contains: filters.education, mode: 'insensitive' };
  }

  if (filters.occupation) {
    where.occupation = { contains: filters.occupation, mode: 'insensitive' };
  }

  if (filters.maritalStatus && ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED'].includes(filters.maritalStatus)) {
    where.maritalStatus = filters.maritalStatus as MaritalStatus;
  }

  if (filters.ageMin || filters.ageMax) {
    const today = new Date();
    const dobConditions: Record<string, Date> = {};

    if (filters.ageMax) {
      const minDate = new Date(today);
      minDate.setFullYear(today.getFullYear() - filters.ageMax);
      dobConditions.gte = minDate;
    }

    if (filters.ageMin) {
      const maxDate = new Date(today);
      maxDate.setFullYear(today.getFullYear() - filters.ageMin);
      dobConditions.lte = maxDate;
    }

    where.dateOfBirth = dobConditions;
  }

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { approvedAt: 'desc' },
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
        religion: true,
        prayerHabit: true,
        beardOrHijab: true,
        status: true,
        approvedAt: true,
        photos: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        // NEVER include phoneNumber or guardianPhone
      },
    }),
    prisma.profile.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true,
    profiles,
    pagination: { page, pageSize, total, totalPages },
  };
}
