'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileStatus, Gender, MaritalStatus } from '@prisma/client';
import { MARITAL_STATUSES } from '@/lib/constants';

interface BrowseFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  division?: string[];
  district?: string;
  education?: string[];
  occupation?: string[];
  maritalStatus?: string[];
  mazhab?: string[];
  familyStatus?: string[];
  biodataNo?: string;
  sort?: 'default' | 'newest' | 'oldest';
  page?: number;
}

const ORDER_BY = {
  default: { approvedAt: 'desc' },
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
} as const;

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

  if (filters.biodataNo?.trim()) {
    where.oderId = { contains: filters.biodataNo.trim(), mode: 'insensitive' };
  }

  if (filters.division?.length) {
    where.division = { in: filters.division };
  }

  if (filters.district?.trim()) {
    where.district = { contains: filters.district.trim(), mode: 'insensitive' };
  }

  if (filters.education?.length) {
    where.education = { in: filters.education };
  }

  if (filters.occupation?.length) {
    where.occupation = { in: filters.occupation };
  }

  if (filters.mazhab?.length) {
    where.mazhab = { in: filters.mazhab };
  }

  if (filters.familyStatus?.length) {
    where.familyStatus = { in: filters.familyStatus };
  }

  const maritalStatuses = filters.maritalStatus?.filter((m): m is MaritalStatus =>
    (MARITAL_STATUSES as readonly string[]).includes(m)
  );
  if (maritalStatuses?.length) {
    where.maritalStatus = { in: maritalStatuses };
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
      orderBy: ORDER_BY[filters.sort ?? 'default'] ?? ORDER_BY.default,
      select: {
        id: true,
        userId: true,
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

  // Favorites are keyed by the target's user ID; resolve them here so user IDs never reach the client
  const favoriteUserIds = new Set<string>();
  if (session?.user?.id && profiles.length > 0) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id, profileId: { in: profiles.map(p => p.userId) } },
      select: { profileId: true },
    });
    favorites.forEach(f => favoriteUserIds.add(f.profileId));
  }

  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true,
    profiles: profiles.map(({ userId, ...p }) => ({ ...p, isFavorite: favoriteUserIds.has(userId) })),
    pagination: { page, pageSize, total, totalPages },
  };
}
