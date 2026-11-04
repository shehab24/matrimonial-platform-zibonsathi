import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

// CodePay sends the member back here. Nothing it appends to the URL is trusted for crediting:
// the parameters are only stored so an admin can see them while confirming the payment.
export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const t = await getTranslations('credits');
  const params = await searchParams;
  const paymentId = typeof params.payment === 'string' ? params.payment : null;

  const payment = paymentId
    ? await prisma.payment.findFirst({ where: { id: paymentId, userId: session.user.id }, include: { package: true } })
    : null;

  if (payment?.status === 'PENDING') {
    const returnParams = Object.fromEntries(
      Object.entries(params)
        .filter(([k, v]) => k !== 'payment' && typeof v === 'string')
        .map(([k, v]) => [k.slice(0, 50), String(v).slice(0, 200)])
    );
    if (Object.keys(returnParams).length > 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { metadata: { ...((payment.metadata as Prisma.JsonObject | null) ?? {}), returnParams } },
      });
    }
  }

  const state = !payment ? 'missing' : payment.status === 'COMPLETED' ? 'done' : payment.status === 'PENDING' ? 'pending' : 'failed';
  const Icon = state === 'done' ? CheckCircle2 : state === 'pending' ? Clock : XCircle;
  const iconClass = state === 'done' ? 'bg-green-50 text-green-700' : state === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-50 text-red-600';

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
        <Icon className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-gray-900">{t(`return.${state}Title`)}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {payment ? t(`return.${state}Body`, { credits: payment.package.credits }) : t('return.missingBody')}
      </p>
      {payment && (
        <p className="mt-3 text-xs text-gray-400">{t('return.orderId', { id: payment.id })}</p>
      )}
      <Button asChild className="mt-6">
        <Link href="/credits">{t('return.back')}</Link>
      </Button>
    </div>
  );
}
