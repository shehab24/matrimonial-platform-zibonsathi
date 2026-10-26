import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProfileStatus, Gender, MaritalStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    status: ProfileStatus.APPROVED,
    isVisible: true,
  };

  const gender = searchParams.get('gender');
  if (gender && ['MALE', 'FEMALE'].includes(gender)) {
    where.gender = gender as Gender;
  }

  const division = searchParams.get('division');
  if (division) where.division = { contains: division, mode: 'insensitive' };

  const district = searchParams.get('district');
  if (district) where.district = { contains: district, mode: 'insensitive' };

  const education = searchParams.get('education');
  if (education) where.education = { contains: education, mode: 'insensitive' };

  const maritalStatus = searchParams.get('maritalStatus');
  if (maritalStatus && ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED'].includes(maritalStatus)) {
    where.maritalStatus = maritalStatus as MaritalStatus;
  }

  const ageMin = searchParams.get('ageMin');
  const ageMax = searchParams.get('ageMax');
  if (ageMin || ageMax) {
    const today = new Date();
    const dobConditions: Record<string, Date> = {};
    if (ageMax) {
      const minDate = new Date(today);
      minDate.setFullYear(today.getFullYear() - parseInt(ageMax));
      dobConditions.gte = minDate;
    }
    if (ageMin) {
      const maxDate = new Date(today);
      maxDate.setFullYear(today.getFullYear() - parseInt(ageMin));
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
        displayName: true,
        dateOfBirth: true,
        gender: true,
        division: true,
        district: true,
        education: true,
        occupation: true,
        maritalStatus: true,
        religion: true,
        approvedAt: true,
        photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
        // NEVER include phoneNumber or guardianPhone
      },
    }),
    prisma.profile.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    profiles,
    pagination: { page, pageSize, total, totalPages },
  });
}
