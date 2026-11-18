import { redirect } from 'next/navigation';
import { Mail, User, UserCog } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PasswordForm } from '@/components/settings/password-form';

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, passwordHash: true },
  });
  if (!user) redirect('/login');

  const rows = [
    { icon: User, label: 'নাম', value: user.name },
    { icon: Mail, label: 'ইমেইল', value: user.email },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-700">
          <UserCog className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">আমার অ্যাকাউন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">অ্যাডমিন অ্যাকাউন্টের তথ্য ও পাসওয়ার্ড পরিবর্তন</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm">
        <dl className="divide-y divide-gray-100">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="truncate font-semibold text-gray-900">{value || <span className="font-normal text-gray-400">দেওয়া হয়নি</span>}</dd>
              </div>
            </div>
          ))}
          <PasswordForm hasPassword={!!user.passwordHash} />
        </dl>
      </div>
    </div>
  );
}
