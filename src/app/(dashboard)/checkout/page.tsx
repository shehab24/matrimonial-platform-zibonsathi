import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const RECENT_MS = 3 * 60 * 60 * 1000;

/**
 * CodePay sends the buyer to <site>/checkout when a payment fails or is cancelled (successful payments use
 * our redirect_url, /credits/payment-return). As with that page, nothing in the URL is trusted for crediting:
 * we only find the member's order, store the parameters for the admin, and say the payment didn't go through.
 */
export default async function CheckoutReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const t = await getTranslations('credits');

  const params = Object.fromEntries(
    Object.entries(await searchParams)
      .filter(([, v]) => typeof v === 'string')
      .map(([k, v]) => [k.slice(0, 50), String(v).slice(0, 200)])
  ) as Record<string, string>;

  // Our order id (sent to CodePay as order_id), or CodePay's own payment id stored from the checkout response
  const orderId = params.order_id ?? params.orderId ?? params.payment ?? params.invoice_id ?? null;
  const gatewayId = params.payment_id ?? params.paymentId ?? params.transaction_id ?? null;

  const payment =
    (orderId && (await prisma.payment.findFirst({ where: { id: orderId, userId } }))) ||
    (gatewayId &&
      (await prisma.payment.findFirst({ where: { userId, metadata: { path: ['checkout', 'payment_id'], equals: gatewayId } } }))) ||
    // No usable id in the URL: the member's latest unfinished CodePay order from the last few hours
    (await prisma.payment.findFirst({
      where: { userId, provider: 'codepay', status: 'PENDING', createdAt: { gte: new Date(Date.now() - RECENT_MS) } },
      orderBy: { createdAt: 'desc' },
    }));

  if (payment?.status === 'PENDING') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...((payment.metadata as Prisma.JsonObject | null) ?? {}),
          failedReturn: { at: new Date().toISOString(), params },
        },
      },
    });
  }

  const done = payment?.status === 'COMPLETED';
  const Icon = done ? CheckCircle2 : XCircle;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${done ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
        <Icon className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-gray-900">{t(done ? 'return.doneTitle' : 'return.failedTitle')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {done ? t('return.doneBody', { credits: payment.creditsGranted }) : t('return.failedBody')}
      </p>
      {payment && <p className="mt-3 text-xs text-gray-400">{t('return.orderId', { id: payment.id })}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!done && (
          <Button asChild>
            <Link href="/credits">{t('return.tryAgain')}</Link>
          </Button>
        )}
        <Button asChild variant={done ? 'default' : 'outline'}>
          <Link href={done ? '/credits' : '/contact'}>{done ? t('return.back') : t('return.support')}</Link>
        </Button>
      </div>
    </div>
  );
}
