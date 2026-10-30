'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileStatus, ReportStatus } from '@prisma/client';
import { assignBiodataId } from '@/lib/biodata-id';
import { notify } from '@/lib/notifications';

const APPROVAL_BONUS_CREDITS = 1;
// Also identifies the grant in the ledger, so keep it stable once users have received it
const APPROVAL_BONUS_NOTE = 'বায়োডাটা অনুমোদনের বোনাস - ১টি ফ্রি সংযোগ';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('ADMIN_REQUIRED');
  }
  return session;
}

export async function getAdminStats() {
  try {
    await requireAdmin();

    const [totalUsers, pendingProfiles, openReports] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count({ where: { status: ProfileStatus.PENDING_APPROVAL } }),
      prisma.report.count({ where: { status: ReportStatus.OPEN } }),
    ]);

    return { success: true, stats: { totalUsers, pendingProfiles, openReports } };
  } catch (error) {
    console.error('getAdminStats error:', error);
    return { success: false, error: 'পরিসংখ্যান লোড ব্যর্থ হয়েছে' };
  }
}

export async function listPendingProfiles() {
  try {
    await requireAdmin();

    const profiles = await prisma.profile.findMany({
      where: { status: ProfileStatus.PENDING_APPROVAL },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
        photos: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { updatedAt: 'asc' },
    });

    return { success: true, profiles };
  } catch (error) {
    console.error('listPendingProfiles error:', error);
    return { success: false, error: 'প্রোফাইল লোড ব্যর্থ হয়েছে' };
  }
}

export async function approveProfile(profileId: string) {
  try {
    const session = await requireAdmin();

    // Assign biodata ID if not already assigned
    const biodataId = await assignBiodataId(profileId);

    const profile = await prisma.$transaction(async (tx) => {
      const approved = await tx.profile.update({
        where: { id: profileId },
        data: {
          status: ProfileStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          oderId: biodataId,
        },
      });

      // One free connection on the first approval only - re-approving after an edit doesn't grant another
      const alreadyGranted = await tx.creditLedger.findFirst({
        where: { userId: approved.userId, type: 'ADJUSTMENT', note: APPROVAL_BONUS_NOTE },
        select: { id: true },
      });
      if (!alreadyGranted) {
        const balance = await tx.creditBalance.upsert({
          where: { userId: approved.userId },
          create: { userId: approved.userId, balance: APPROVAL_BONUS_CREDITS },
          update: { balance: { increment: APPROVAL_BONUS_CREDITS } },
        });
        await tx.creditLedger.create({
          data: {
            userId: approved.userId,
            type: 'ADJUSTMENT',
            amount: APPROVAL_BONUS_CREDITS,
            balanceBefore: balance.balance - APPROVAL_BONUS_CREDITS,
            balanceAfter: balance.balance,
            note: APPROVAL_BONUS_NOTE,
          },
        });
      }

      return approved;
    });

    await notify(profile.userId, 'PROFILE_APPROVED');

    return { success: true, biodataId };
  } catch (error) {
    console.error('approveProfile error:', error);
    return { success: false, error: 'অনুমোদন ব্যর্থ হয়েছে' };
  }
}

export async function rejectProfile(profileId: string, reason: string) {
  try {
    await requireAdmin();

    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        status: ProfileStatus.REJECTED,
        adminNote: reason,
      },
    });

    await notify(profile.userId, 'PROFILE_REJECTED');

    return { success: true };
  } catch (error) {
    console.error('rejectProfile error:', error);
    return { success: false, error: 'প্রত্যাখ্যান ব্যর্থ হয়েছে' };
  }
}

export async function suspendProfile(profileId: string, reason: string) {
  try {
    await requireAdmin();

    // Hides the biodata from browse; approving it again restores it
    await prisma.profile.update({
      where: { id: profileId },
      data: { status: ProfileStatus.SUSPENDED, adminNote: reason || null },
    });

    return { success: true };
  } catch (error) {
    console.error('suspendProfile error:', error);
    return { success: false, error: 'স্থগিত করা ব্যর্থ হয়েছে' };
  }
}

export async function suspendUser(userId: string) {
  try {
    await requireAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });

    return { success: true };
  } catch (error) {
    console.error('suspendUser error:', error);
    return { success: false, error: 'স্থগিত করা ব্যর্থ হয়েছে' };
  }
}

export async function restoreUser(userId: string) {
  try {
    await requireAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });

    return { success: true };
  } catch (error) {
    console.error('restoreUser error:', error);
    return { success: false, error: 'পুনরুদ্ধার ব্যর্থ হয়েছে' };
  }
}

export async function listReports() {
  try {
    await requireAdmin();

    const reports = await prisma.report.findMany({
      where: { status: ReportStatus.OPEN },
      include: {
        submitter: { select: { id: true, email: true, name: true } },
        target: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, reports };
  } catch (error) {
    console.error('listReports error:', error);
    return { success: false, error: 'রিপোর্ট লোড ব্যর্থ হয়েছে' };
  }
}

export async function resolveReport(reportId: string, note: string) {
  try {
    await requireAdmin();

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        adminNote: note,
        resolvedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('resolveReport error:', error);
    return { success: false, error: 'রিপোর্ট সমাধান ব্যর্থ হয়েছে' };
  }
}

export async function createCreditPackage(data: {
  name: string;
  description?: string;
  credits: number;
  price: number;
  currency?: string;
}) {
  try {
    await requireAdmin();

    const pkg = await prisma.creditPackage.create({
      data: {
        name: data.name,
        description: data.description,
        credits: data.credits,
        price: data.price,
        currency: data.currency ?? 'BDT',
      },
    });

    return { success: true, package: pkg };
  } catch (error) {
    console.error('createCreditPackage error:', error);
    return { success: false, error: 'প্যাকেজ তৈরি ব্যর্থ হয়েছে' };
  }
}

export async function listCreditPackages() {
  try {
    await requireAdmin();

    const packages = await prisma.creditPackage.findMany({
      orderBy: { credits: 'asc' },
    });

    return { success: true, packages };
  } catch (error) {
    console.error('listCreditPackages error:', error);
    return { success: false, error: 'প্যাকেজ লোড ব্যর্থ হয়েছে' };
  }
}

export async function listAllUsers() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuspended: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          select: { status: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, users };
  } catch (error) {
    console.error('listAllUsers error:', error);
    return { success: false, error: 'ব্যবহারকারী লোড ব্যর্থ হয়েছে' };
  }
}

export async function toggleCreditPackage(packageId: string, isActive: boolean) {
  try {
    await requireAdmin();

    await prisma.creditPackage.update({
      where: { id: packageId },
      data: { isActive },
    });

    return { success: true };
  } catch (error) {
    console.error('toggleCreditPackage error:', error);
    return { success: false, error: 'প্যাকেজ আপডেট ব্যর্থ হয়েছে' };
  }
}
