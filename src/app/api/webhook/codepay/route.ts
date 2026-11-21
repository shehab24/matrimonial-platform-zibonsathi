import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCodePayConfig } from '@/lib/codepay';
import { verifyCodePayPayment } from '@/lib/payment-credits';

export const dynamic = 'force-dynamic';

// Signatures older (or further in the future) than this are refused, so a captured call can't be replayed later
const MAX_SKEW_SECONDS = 300;

/**
 * CodePay webhook: POSTed when a payment becomes COMPLETED, FAILED, CANCELLED or EXPIRED.
 * Signed with X-CodePay-Signature = hex HMAC-SHA256("{X-CodePay-Timestamp}.{raw body}", webhook secret).
 *
 * Even a correctly signed body isn't used for crediting: it only says which order to look at, and
 * verifyCodePayPayment asks CodePay's status endpoint itself. Deliveries can repeat; that's harmless.
 * Replying non-2xx makes CodePay retry (1m … 12h), so we only do that when we couldn't reach CodePay.
 */
export async function POST(request: Request) {
  const config = await getCodePayConfig();
  if (!config?.webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get('x-codepay-timestamp') ?? '';
  const signature = (request.headers.get('x-codepay-signature') ?? '').trim().toLowerCase();

  const ts = Number(timestamp);
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SECONDS) {
    return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 });
  }
  const expected = createHmac('sha256', config.webhookSecret).update(`${timestamp}.${rawBody}`).digest('hex');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: { event?: unknown; id?: unknown; order_id?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof event.order_id !== 'string' || !event.order_id) {
    return NextResponse.json({ received: true });
  }

  // Not one of our CodePay orders (or already settled): acknowledge so CodePay stops retrying
  const payment = await prisma.payment.findUnique({ where: { id: event.order_id }, select: { id: true, provider: true } });
  if (!payment || payment.provider !== 'codepay') {
    return NextResponse.json({ received: true });
  }

  try {
    const result = await verifyCodePayPayment(payment.id);
    if (result === 'unavailable') {
      // CodePay's status endpoint didn't answer: ask for a retry
      return NextResponse.json({ error: 'Status check failed, retry' }, { status: 503 });
    }
    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error('CodePay webhook error:', event.id, error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
