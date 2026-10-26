import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CreditsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [creditBalance, ledger, packages] = await Promise.all([
    prisma.creditBalance.findUnique({ where: { userId: session.user.id } }),
    prisma.creditLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.creditPackage.findMany({ where: { isActive: true }, orderBy: { credits: 'asc' } }),
  ]);

  const balance = creditBalance?.balance ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">ক্রেডিট</h1>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-green-700 to-teal-700 text-white mb-8">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">বর্তমান ব্যালেন্স</p>
              <p className="text-5xl font-bold">{balance}</p>
              <p className="text-green-200 mt-1">ক্রেডিট</p>
            </div>
            <CreditCard className="h-16 w-16 text-white/30" />
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">ক্রেডিট প্যাকেজ</h2>
      {packages.length === 0 ? (
        <p className="text-gray-500 mb-8">কোনো প্যাকেজ পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="hover:shadow-md transition-shadow border-2 hover:border-green-300">
              <CardHeader>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.description && <p className="text-sm text-gray-500">{pkg.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold text-green-700">{pkg.credits}</span>
                  <span className="text-gray-500 mb-1">ক্রেডিট</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold">৳{Number(pkg.price).toLocaleString('bn-BD')}</span>
                  <Badge variant="secondary">{pkg.currency}</Badge>
                </div>
                <Button className="w-full mt-4">ক্রয় করুন</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ledger History */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" /> ক্রেডিট ইতিহাস
      </h2>
      {ledger.length === 0 ? (
        <p className="text-gray-500 text-center py-8">কোনো লেনদেন নেই।</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600">তারিখ</th>
                    <th className="px-4 py-3 text-left text-gray-600">ধরন</th>
                    <th className="px-4 py-3 text-right text-gray-600">পরিমাণ</th>
                    <th className="px-4 py-3 text-right text-gray-600">ব্যালেন্স</th>
                    <th className="px-4 py-3 text-left text-gray-600">নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(entry.createdAt).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.type === 'PURCHASE' ? 'success' : entry.type === 'DEDUCTION' ? 'destructive' : 'secondary'}>
                          {entry.type === 'PURCHASE' ? 'ক্রয়' : entry.type === 'DEDUCTION' ? 'কর্তন' : entry.type === 'REFUND' ? 'ফেরত' : 'সমন্বয়'}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${entry.amount > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {entry.amount > 0 ? '+' : ''}{entry.amount}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{entry.balanceAfter}</td>
                      <td className="px-4 py-3 text-gray-500">{entry.note ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
