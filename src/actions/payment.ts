'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { createCodePayCheckout, getCodePayConfig, siteBaseUrl } from '@/lib/codepay';

/**
 * Start a CodePay checkout for a credit package. Creates a PENDING payment (its id is the order_id
 * CodePay sees) and returns the hosted checkout URL to send the visitor to.
 *
 * Credits are NOT granted when the visitor comes back: the return URL can be typed by anyone.
 * They are granted by confirmPayment once the payment is verified.
 */
export async function startCodePayCheckout(packageId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('loginRequired') };
  }

  const [config, pkg, user] = await Promise.all([
    getCodePayConfig(),
    prisma.creditPackage.findFirst({ where: { id: packageId, isActive: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
  ]);
  if (!config) {
    return { success: false, error: await actionError('paymentUnavailable') };
  }
  if (!pkg || !user) {
    return { success: false, error: await actionError('somethingWrong') };
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      packageId: pkg.id,
      amount: pkg.price,
      currency: pkg.currency,
      provider: 'codepay',
      idempotencyKey: randomUUID(),
    },
  });

  const result = await createCodePayCheckout(config, {
    amount: Number(pkg.price),
    orderId: payment.id,
    customerName: user.name || user.email,
    customerEmail: user.email,
    redirectUrl: `${await siteBaseUrl()}/credits/payment-return?payment=${payment.id}`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: result.ok
      ? { metadata: { checkout: result.response } as Prisma.InputJsonObject }
      : { status: 'FAILED', metadata: { checkoutError: result.message, checkout: result.response ?? null } as Prisma.InputJsonObject },
  });

  if (!result.ok) {
    console.error('CodePay checkout failed:', result.message);
    return { success: false, error: await actionError('paymentStartFailed') };
  }
  return { success: true, paymentUrl: result.paymentUrl };
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('ADMIN_REQUIRED');
  }
  return session;
}

export async function listPayments(status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED') {
  await requireAdmin();
  const payments = await prisma.payment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
      package: { select: { name: true, credits: true } },
    },
  });
  return payments.map(p => ({ ...p, amount: p.amount.toString() }));
}

/** Mark a payment as paid and add its credits. Safe to click twice: only a PENDING payment is granted. */
export async function confirmPayment(paymentId: string) {
  const session = await requireAdmin();
  try {
    const granted = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { package: true } });
      if (!payment) return false;
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { status: 'COMPLETED', creditsGranted: payment.package.credits },
      });
      if (claimed.count === 0) return false;

      const credits = payment.package.credits;
      const balance = await tx.creditBalance.upsert({
        where: { userId: payment.userId },
        create: { userId: payment.userId, balance: credits },
        update: { balance: { increment: credits } },
      });
      await tx.creditLedger.create({
        data: {
          userId: payment.userId,
          type: 'PURCHASE',
          amount: credits,
          balanceBefore: balance.balance - credits,
          balanceAfter: balance.balance,
          paymentId: payment.id,
          note: `${payment.package.name} (CodePay)`,
        },
      });
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...((payment.metadata as Prisma.JsonObject | null) ?? {}),
            confirmedBy: session.user.id,
            confirmedAt: new Date().toISOString(),
          },
        },
      });
      return true;
    });
    revalidatePath('/admin/payments');
    return granted ? { success: true } : { success: false, error: 'এই পেমেন্টটি আর পেন্ডিং নেই' };
  } catch (error) {
    console.error('confirmPayment error:', error);
    return { success: false, error: 'পেমেন্ট নিশ্চিত করা যায়নি' };
  }
}

export async function markPaymentFailed(paymentId: string) {
  await requireAdmin();
  const updated = await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'FAILED' },
  });
  revalidatePath('/admin/payments');
  return updated.count ? { success: true } : { success: false, error: 'এই পেমেন্টটি আর পেন্ডিং নেই' };
}
