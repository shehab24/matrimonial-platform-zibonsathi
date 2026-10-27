import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileStatus, ConnectionStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      photos: true,
      user: { select: { id: true, createdAt: true } },
    },
  });

  if (!profile || profile.status !== ProfileStatus.APPROVED || !profile.isVisible) {
    return NextResponse.json({ error: 'প্রোফাইল পাওয়া যায়নি' }, { status: 404 });
  }

  // Strip contact info by default
  const safeProfile = {
    id: profile.id,
    oderId: profile.oderId,
    displayName: profile.displayName,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    religion: profile.religion,
    sect: profile.sect,
    country: profile.country,
    division: profile.division,
    district: profile.district,
    upazila: profile.upazila,
    education: profile.education,
    educationDetails: profile.educationDetails,
    occupation: profile.occupation,
    occupationDetails: profile.occupationDetails,
    monthlyIncome: profile.monthlyIncome,
    maritalStatus: profile.maritalStatus,
    numberOfChildren: profile.numberOfChildren,
    fatherAlive: profile.fatherAlive,
    motherAlive: profile.motherAlive,
    siblings: profile.siblings,
    familyType: profile.familyType,
    familyStatus: profile.familyStatus,
    prayerHabit: profile.prayerHabit,
    beardOrHijab: profile.beardOrHijab,
    mazhab: profile.mazhab,
    aboutMe: profile.aboutMe,
    partnerPreferences: profile.partnerPreferences,
    photos: profile.photos,
    approvedAt: profile.approvedAt,
    createdAt: profile.createdAt,
    // NEVER include phoneNumber or guardianPhone unless authorized
    phoneNumber: null as string | null,
    guardianPhone: null as string | null,
  };

  // Server-side only: check ACCEPTED connection
  if (session?.user?.id) {
    const connection = await prisma.connection.findFirst({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { senderId: session.user.id, receiverProfileId: id },
          { receiverId: session.user.id, senderProfileId: id },
        ],
      },
    });

    if (connection) {
      if (profile.showPhoneToConnected) safeProfile.phoneNumber = profile.phoneNumber;
      if (profile.showGuardianPhoneToConnected) safeProfile.guardianPhone = profile.guardianPhone;
    }
  }

  return NextResponse.json({ profile: safeProfile });
}
