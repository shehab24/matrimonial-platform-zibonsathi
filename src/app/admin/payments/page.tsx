import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { listPayments } from '@/actions/payment';
import { PaymentActions } from '@/components/admin/payment-actions';
import { MANUAL_METHOD_LABELS, type ManualMethod } from '@/lib/manual-payment';

export const dynamic = 'force-dynamic';

const STATUS_TABS = [
  { value: 'PENDING', label: 'পেন্ডিং' },
  { value: 'COMPLETED', label: 'সম্পন্ন' },
  { value: 'FAILED', label: 'ব্যর্থ' },
  { value: '', label: 'সকল' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

const bn = (n: number | string) => Number(n).toLocaleString('bn-BD');
const bnDateTime = (d: Date) => d.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = raw === undefined ? 'PENDING' : raw;
  const payments = await listPayments(
    status === 'PENDING' || status === 'COMPLETED' || status === 'FAILED' ? status : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">পেমেন্ট</h1>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-900">
        <p>
          <strong>CodePay:</strong> প্রতিটি পেন্ডিং পেমেন্ট CodePay ড্যাশবোর্ডে মিলিয়ে দেখুন (অর্ডার আইডি ও টাকার পরিমাণ)।
        </p>
        <p className="mt-1">
          <strong>বিকাশ / নগদ / রকেট:</strong> আপনার অ্যাপে ট্রানজেকশন আইডি (TrxID), প্রেরকের নম্বর ও টাকার পরিমাণ মিলিয়ে দেখুন।
        </p>
        <p className="mt-1">মিললে &quot;নিশ্চিত করুন&quot; চাপুন, তখনই সদস্যের অ্যাকাউন্টে ক্রেডিট যোগ হবে। না মিললে ব্যর্থ করুন।</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/payments?status=${tab.value}` : '/admin/payments?status='}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === tab.value ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {payments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">কোনো পেমেন্ট নেই</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">সময়</th>
                <th className="px-4 py-3">সদস্য</th>
                <th className="px-4 py-3">প্যাকেজ</th>
                <th className="px-4 py-3 text-right">টাকা</th>
                <th className="px-4 py-3">পেমেন্ট বিবরণ</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => {
                const meta = (p.metadata ?? {}) as Record<string, unknown>;
                const returned = meta.returnParams as Record<string, string> | undefined;
                const codepay = meta.codepay as { status: string; paid_amount: number | null; method: string | null; trx_id: string | null; sender_number: string | null } | undefined;
                const manual = meta.manual as { method: ManualMethod; trxId: string; senderNumber: string; paidTo: string } | undefined;
                return (
                  <tr key={p.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{bnDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.user.name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{p.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.package.name} · {bn(p.package.credits)} ক্রেডিট</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">৳ {bn(p.amount)}</td>
                    <td className="px-4 py-3">
                      {manual ? (
                        <div className="space-y-0.5 text-xs">
                          <span className="inline-block rounded bg-pink-100 px-1.5 py-0.5 font-semibold text-pink-700">
                            {MANUAL_METHOD_LABELS[manual.method] ?? manual.method}
                          </span>
                          <p>TrxID: <code className="font-bold text-gray-900">{manual.trxId}</code></p>
                          <p className="text-gray-600">প্রেরক: <span className="font-mono">{manual.senderNumber}</span></p>
                          <p className="text-gray-500">প্রাপক: <span className="font-mono">{manual.paidTo}</span></p>
                        </div>
                      ) : (
                        <>
                          <span className="mb-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">CodePay</span>
                          <br />
                          <code className="text-xs text-gray-700">{p.id}</code>
                          {codepay && (
                            <div className="mt-1 space-y-0.5 text-xs">
                              {codepay.trx_id && <p>TrxID: <code className="font-bold text-gray-900">{codepay.trx_id}</code>{codepay.method ? ` · ${codepay.method}` : ''}</p>}
                              {codepay.sender_number && <p className="text-gray-600">প্রেরক: <span className="font-mono">{codepay.sender_number}</span></p>}
                              <p className="text-gray-500">CodePay: {codepay.status}{codepay.paid_amount != null ? ` · ৳ ${bn(codepay.paid_amount)} পরিশোধিত` : ''}</p>
                              {!!meta.autoVerified && <p className="font-semibold text-green-700">স্বয়ংক্রিয়ভাবে যাচাই হয়েছে</p>}
                            </div>
                          )}
                          {!!meta.amountMismatch && (
                            <p className="mt-1 text-xs font-semibold text-red-600">টাকার পরিমাণ মেলেনি, নিজে দেখে নিশ্চিত করুন</p>
                          )}
                        </>
                      )}
                      {returned && (
                        <p className="mt-1 max-w-[260px] break-words text-xs text-gray-500">
                          ফেরত: {Object.entries(returned).map(([k, v]) => `${k}=${v}`).join(', ')}
                        </p>
                      )}
                      {!!meta.failedReturn && (
                        <p className="mt-1 max-w-[260px] break-words text-xs text-red-600">
                          গেটওয়ে থেকে ব্যর্থ/বাতিল হয়ে ফিরেছে
                          {Object.keys((meta.failedReturn as { params?: Record<string, string> }).params ?? {}).length > 0 &&
                            `: ${Object.entries((meta.failedReturn as { params: Record<string, string> }).params).map(([k, v]) => `${k}=${v}`).join(', ')}`}
                        </p>
                      )}
                      {typeof meta.checkoutError === 'string' && (
                        <p className="mt-1 text-xs text-red-600">ত্রুটি: {meta.checkoutError}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">{p.status === 'PENDING' && <PaymentActions paymentId={p.id} isCodePay={p.provider === 'codepay'} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
