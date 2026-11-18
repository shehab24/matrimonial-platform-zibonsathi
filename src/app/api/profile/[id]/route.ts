import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { ProfileStatus, ConnectionStatus } from '@prisma/client';
import { isImportedEmail } from '@/lib/imported-biodata';

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
      user: { select: { id: true, createdAt: true, email: true } },
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
    // The name is part of the paid contact details: only sent once unlocked (or to the owner)
    displayName: session?.user?.id === profile.userId ? profile.displayName : null,
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
    // NEVER include phoneNumber, guardianPhone or contactEmail unless authorized
    phoneNumber: null as string | null,
    guardianPhone: null as string | null,
    contactEmail: null as string | null,
    // Imported biodata: contact is free for any logged-in member (no connection or own biodata needed)
    freeContact: isImportedEmail(profile.user.email),
  };

  // Server-side only. Contact numbers are revealed when the viewer sent (paid for) a connection to this
  // biodata, or received one from it and accepted. Imported biodatas are free for any logged-in user.
  if (session?.user?.id && !safeProfile.isOwn) {
    const connection = safeProfile.freeContact
      ? null
      : await prisma.connection.findFirst({
          where: {
            OR: [
              // The sender paid a credit for this contact, so it's theirs straight away (even if later declined)
              { senderId: session.user.id, receiverProfileId: profile.id },
              // The receiver didn't pay; they see the sender's contact only after accepting
              { receiverId: session.user.id, senderProfileId: profile.id, status: ConnectionStatus.ACCEPTED },
            ],
          },
          select: { id: true },
        });

    if (safeProfile.freeContact || connection) {
      safeProfile.displayName = profile.displayName;
      safeProfile.phoneNumber = profile.phoneNumber;
      safeProfile.guardianPhone = profile.guardianPhone;
      // No separate contact email given: fall back to the account email (imported accounts only have a placeholder)
      safeProfile.contactEmail = profile.contactEmail || (safeProfile.freeContact ? null : profile.user.email);
    }
  }

  return NextResponse.json({ profile: safeProfile });
}
