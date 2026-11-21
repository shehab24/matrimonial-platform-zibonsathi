'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { actionError } from '@/lib/action-error';
import { createCodePayCheckout, getCodePayConfig, siteBaseUrl } from '@/lib/codepay';
import { getManualPaymentConfig, manualProvider, type ManualMethod } from '@/lib/manual-payment';
import { grantPaymentCredits, verifyCodePayPayment } from '@/lib/payment-credits';
import { normalizePhone } from '@/lib/phone';

/**
 * Start a CodePay checkout for a credit package. Creates a PENDING payment (its id is the order_id
 * CodePay sees) and returns the hosted checkout URL to send the visitor to.
 *
 * Credits are never granted from the return URL (anyone can type it). They're granted once CodePay's status
 * endpoint says the payment is COMPLETED (verifyCodePayPayment: return page, webhook, credits page), or by an admin.
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

  const base = await siteBaseUrl();
  const result = await createCodePayCheckout(config, {
    amount: Number(pkg.price),
    orderId: payment.id,
    customerName: user.name || user.email,
    customerEmail: user.email,
    redirectUrl: `${base}/credits/payment-return?payment=${payment.id}`,
    // CodePay only accepts a public https webhook, and it's useless without the secret to check it with
    webhookUrl: config.webhookSecret && /^https:\/\//.test(base) ? `${base}/api/webhook/codepay` : undefined,
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

const MAX_PENDING_MANUAL = 3;

/**
 * Manual bKash/Nagad/Rocket payment: the member has already sent the money and submits the TrxID.
 * Creates a PENDING payment for an admin to check and confirm; no credits are added here.
 * A TrxID can only be used once (stored as providerRef, which is unique).
 */
export async function submitManualPayment(data: { packageId: string; method: string; senderNumber: string; trxId: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: await actionError('loginRequired') };
  }

  const [config, pkg] = await Promise.all([
    getManualPaymentConfig(),
    prisma.creditPackage.findFirst({ where: { id: data.packageId, isActive: true } }),
  ]);
  const account = config?.accounts.find((a) => a.method === data.method);
  if (!config || !account) {
    return { success: false, error: await actionError('paymentUnavailable') };
  }
  if (!pkg) {
    return { success: false, error: await actionError('somethingWrong') };
  }

  const senderNumber = normalizePhone(data.senderNumber);
  if (!senderNumber) {
    return { success: false, error: await actionError('phoneInvalid') };
  }
  const trxId = data.trxId.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,20}$/.test(trxId)) {
    return { success: false, error: await actionError('trxIdInvalid') };
  }

  const method = account.method as ManualMethod;
  try {
    const pending = await prisma.payment.count({
      where: { userId: session.user.id, status: 'PENDING', provider: { startsWith: 'manual_' } },
    });
    if (pending >= MAX_PENDING_MANUAL) {
      return { success: false, error: await actionError('tooManyPendingPayments') };
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        packageId: pkg.id,
        amount: pkg.price,
        currency: pkg.currency,
        provider: manualProvider(method),
        providerRef: `${method}:${trxId}`,
        idempotencyKey: randomUUID(),
        metadata: { manual: { method, trxId, senderNumber, paidTo: account.number } },
      },
    });
    revalidatePath('/credits');
    revalidatePath('/admin/payments');
    return { success: true, paymentId: payment.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: await actionError('trxIdUsed') };
    }
    console.error('submitManualPayment error:', error);
    return { success: false, error: await actionError('somethingWrong') };
  }
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
    const granted = await grantPaymentCredits(paymentId, {
      metadata: { confirmedBy: session.user.id, confirmedAt: new Date().toISOString() },
    });
    revalidatePath('/admin/payments');
    return granted ? { success: true } : { success: false, error: 'এই পেমেন্টটি আর পেন্ডিং নেই' };
  } catch (error) {
    console.error('confirmPayment error:', error);
    return { success: false, error: 'পেমেন্ট নিশ্চিত করা যায়নি' };
  }
}

/** Admin: ask CodePay for this payment's status now and settle it (credits added only if CodePay says paid) */
export async function recheckCodePayPayment(paymentId: string) {
  await requireAdmin();
  try {
    const result = await verifyCodePayPayment(paymentId);
    revalidatePath('/admin/payments');
    return { success: true, result };
  } catch (error) {
    console.error('recheckCodePayPayment error:', error);
    return { success: false, error: 'CodePay থেকে যাচাই করা যায়নি' };
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
