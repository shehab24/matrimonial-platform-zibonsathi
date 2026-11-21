// Server-only. Deliberately NOT a 'use server' file: these functions have no auth check, so they must never
// become server actions the browser could call. Callers (admin action, return page, webhook) do their own checks.
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { getCodePayConfig, getCodePayPayment, type CodePayPayment } from './codepay';
import { MANUAL_METHOD_LABELS, type ManualMethod } from './manual-payment';

/** Ledger note for a purchase, e.g. "স্ট্যান্ডার্ড (বিকাশ)" */
function purchaseNote(packageName: string, provider: string) {
  const method = provider.replace(/^manual_/, '') as ManualMethod;
  return `${packageName} (${provider.startsWith('manual_') ? MANUAL_METHOD_LABELS[method] ?? provider : 'CodePay'})`;
}

/**
 * Mark a payment COMPLETED and add its credits, in one transaction. Only a PENDING payment is claimed, so
 * calling it twice (admin click + webhook + return page racing) grants the credits once. Returns whether
 * this call granted them.
 */
export async function grantPaymentCredits(
  paymentId: string,
  opts: { metadata?: Record<string, unknown>; providerRef?: string } = {}
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { package: true } });
    if (!payment) return false;
    const credits = payment.package.credits;
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        creditsGranted: credits,
        ...(opts.providerRef ? { providerRef: opts.providerRef } : {}),
        metadata: { ...((payment.metadata as Prisma.JsonObject | null) ?? {}), ...(opts.metadata ?? {}) } as Prisma.InputJsonObject,
      },
    });
    if (claimed.count === 0) return false;

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
        note: purchaseNote(payment.package.name, payment.provider),
      },
    });
    return true;
  });
}

export type CodePayVerifyResult = 'completed' | 'pending' | 'failed' | 'unavailable';

const sameAmount = (a: number | null | undefined, b: number) => typeof a === 'number' && Math.abs(a - b) < 0.005;

/**
 * Check one of our CodePay payments against CodePay's status endpoint and settle it:
 * - COMPLETED, our order id, and the full amount paid → credits added
 * - CANCELLED / EXPIRED / FAILED → marked FAILED (no credits)
 * - anything else (still pending, amount mismatch, CodePay unreachable) → left PENDING for an admin
 * Safe to call any number of times, from anywhere.
 */
export async function verifyCodePayPayment(paymentId: string): Promise<CodePayVerifyResult> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.provider !== 'codepay') return 'unavailable';
  if (payment.status === 'COMPLETED') return 'completed';
  if (payment.status !== 'PENDING') return 'failed';

  const config = await getCodePayConfig();
  if (!config) return 'unavailable';

  const lookup = await getCodePayPayment(config, payment.id);
  if (!lookup.ok) {
    if (!lookup.notFound) console.error('CodePay status check failed:', payment.id, lookup.message);
    return lookup.notFound ? 'pending' : 'unavailable';
  }
  const cp: CodePayPayment = lookup.payment;
  const expected = Number(payment.amount);
  const codepay = {
    payment_id: cp.payment_id,
    status: cp.status,
    amount: cp.amount,
    paid_amount: cp.paid_amount,
    method: cp.method,
    trx_id: cp.trx_id,
    sender_number: cp.sender_number,
    paid_at: cp.paid_at,
    checkedAt: new Date().toISOString(),
  };

  // Never trust a reply for some other order
  if (cp.order_id !== payment.id) {
    console.error('CodePay order mismatch:', payment.id, cp.order_id);
    return 'pending';
  }

  if (cp.status === 'COMPLETED') {
    if (!sameAmount(cp.amount, expected) || !sameAmount(cp.paid_amount, expected) || (cp.currency && cp.currency !== payment.currency)) {
      // Paid, but not the right amount: leave it for an admin to look at, with what CodePay reported
      await savePendingNote(payment.id, payment.metadata, { codepay, amountMismatch: true });
      console.error('CodePay amount mismatch:', payment.id, { expected, amount: cp.amount, paid: cp.paid_amount });
      return 'pending';
    }
    try {
      await grantPaymentCredits(payment.id, {
        // Unique, so one CodePay payment can never pay for two orders
        providerRef: `codepay:${cp.payment_id}`,
        metadata: { codepay, autoVerified: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        console.error('CodePay payment already used for another order:', payment.id, cp.payment_id);
        return 'pending';
      }
      throw error;
    }
    return 'completed';
  }

  if (cp.status === 'CANCELLED' || cp.status === 'EXPIRED' || cp.status === 'FAILED') {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'FAILED', metadata: { ...((payment.metadata as Prisma.JsonObject | null) ?? {}), codepay } as Prisma.InputJsonObject },
    });
    return 'failed';
  }

  return 'pending';
}

/**
 * Check a member's recent CodePay payments that are still pending (they closed the tab before returning, or
 * the webhook was missed). Recent ones only; anything older is left for an admin. Never throws.
 */
export async function settleRecentCodePayPayments(userId: string): Promise<void> {
  const unsettled = await prisma.payment.findMany({
    where: {
      userId,
      provider: 'codepay',
      status: 'PENDING',
      createdAt: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true },
  });
  await Promise.all(unsettled.map(p => verifyCodePayPayment(p.id).catch(error => console.error('CodePay settle error:', p.id, error))));
}

async function savePendingNote(id: string, current: Prisma.JsonValue, extra: Record<string, unknown>) {
  await prisma.payment.updateMany({
    where: { id, status: 'PENDING' },
    data: { metadata: { ...((current as Prisma.JsonObject | null) ?? {}), ...extra } as Prisma.InputJsonObject },
  });
}
