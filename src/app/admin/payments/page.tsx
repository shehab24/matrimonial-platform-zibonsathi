import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { listPayments } from '@/actions/payment';
import { PaymentActions } from '@/components/admin/payment-actions';

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
        CodePay থেকে স্বয়ংক্রিয় নিশ্চিতকরণ এখনো যুক্ত হয়নি। প্রতিটি পেন্ডিং পেমেন্ট CodePay ড্যাশবোর্ডে মিলিয়ে দেখুন (অর্ডার আইডি ও টাকার পরিমাণ),
        তারপর &quot;নিশ্চিত করুন&quot; চাপুন। তখনই সদস্যের অ্যাকাউন্টে ক্রেডিট যোগ হবে।
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
                <th className="px-4 py-3">অর্ডার আইডি</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => {
                const meta = (p.metadata ?? {}) as Record<string, unknown>;
                const returned = meta.returnParams as Record<string, string> | undefined;
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
                      <code className="text-xs text-gray-700">{p.id}</code>
                      {returned && (
                        <p className="mt-1 max-w-[260px] break-words text-xs text-gray-500">
                          ফেরত: {Object.entries(returned).map(([k, v]) => `${k}=${v}`).join(', ')}
                        </p>
                      )}
                      {typeof meta.checkoutError === 'string' && (
                        <p className="mt-1 text-xs text-red-600">ত্রুটি: {meta.checkoutError}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">{p.status === 'PENDING' && <PaymentActions paymentId={p.id} />}</td>
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
