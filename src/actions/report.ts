'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { ReportStatus } from '@prisma/client';
import { REPORT_REASONS } from '@/lib/constants';
import { z } from 'zod';

const reportSchema = z.object({
  profileId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});

/**
 * Report a member to the admins.
 * @param profileId - The Profile ID (not user ID) being reported
 */
export async function reportProfile(data: { profileId: string; reason: string; details?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('loginRequired') };
  }

  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: await actionError('reportFailed') };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: parsed.data.profileId },
      select: { userId: true },
    });

    if (!profile) {
      return { success: false, error: await actionError('profileNotFound') };
    }

    if (profile.userId === session.user.id) {
      return { success: false, error: await actionError('cannotReportSelf') };
    }

    // One open report per member is enough for admins to act on
    const existing = await prisma.report.findFirst({
      where: { submitterId: session.user.id, targetId: profile.userId, status: ReportStatus.OPEN },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: await actionError('alreadyReported') };
    }

    await prisma.report.create({
      data: {
        submitterId: session.user.id,
        targetId: profile.userId,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('reportProfile error:', error);
    return { success: false, error: await actionError('reportFailed') };
  }
}
