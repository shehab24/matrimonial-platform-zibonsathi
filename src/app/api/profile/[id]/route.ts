import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { ProfileStatus, ConnectionStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  // Accepts the internal ID or the public biodata no. (any case), so /biodata/zbf-00010 works too
  const profile = await prisma.profile.findFirst({
    where: { OR: [{ id }, { oderId: { equals: id, mode: 'insensitive' } }] },
    include: {
      photos: true,
      user: { select: { id: true, createdAt: true } },
    },
  });

  if (!profile || profile.status !== ProfileStatus.APPROVED || !profile.isVisible) {
    return NextResponse.json({ error: await actionError('profileNotFound') }, { status: 404 });
  }

  // Record a view for the owner's dashboard stats (logged-in visitors only, never the owner)
  if (session?.user?.id && session.user.id !== profile.userId) {
    await prisma.recentlyViewed
      .upsert({
        where: { userId_profileId: { userId: session.user.id, profileId: profile.id } },
        create: { userId: session.user.id, profileId: profile.id },
        update: { viewedAt: new Date() },
      })
      .catch((error) => console.error('record view error:', error));
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
    // Lets the page hide proposal/favorite/report buttons on the viewer's own biodata
    isOwn: session?.user?.id === profile.userId,
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
          { senderId: session.user.id, receiverProfileId: profile.id },
          { receiverId: session.user.id, senderProfileId: profile.id },
        ],
      },
    });

    if (connection) {
      // Contact numbers are what a connection pays for, so both are always shown
      safeProfile.phoneNumber = profile.phoneNumber;
      safeProfile.guardianPhone = profile.guardianPhone;
    }
  }

  return NextResponse.json({ profile: safeProfile });
}
