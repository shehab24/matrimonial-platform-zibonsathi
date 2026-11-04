import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Settings, User, Mail, Phone, VenusAndMars } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardPageHeader } from '@/components/dashboard/page-parts';
import { PasswordForm } from '@/components/settings/password-form';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const t = await getTranslations('settings');
  const tc = await getTranslations('common');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, passwordHash: true, profile: { select: { gender: true, phoneNumber: true } } },
  });
  if (!user) redirect('/login');

  const gender = user.profile?.gender;
  const rows = [
    { icon: User, label: t('name'), value: user.name },
    { icon: VenusAndMars, label: t('gender'), value: gender === 'MALE' ? tc('male') : gender === 'FEMALE' ? tc('female') : null },
    { icon: Mail, label: t('email'), value: user.email },
    { icon: Phone, label: t('mobile'), value: user.profile?.phoneNumber },
  ];

  return (
    <div>
      <DashboardPageHeader icon={Settings} iconClassName="bg-green-50 text-green-700" title={t('title')} summary={t('summary')} />

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm">
        <dl className="divide-y divide-gray-100">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="truncate font-semibold text-gray-900">{value || <span className="font-normal text-gray-400">{t('notSet')}</span>}</dd>
              </div>
            </div>
          ))}
          <PasswordForm hasPassword={!!user.passwordHash} />
        </dl>
        <p className="border-t border-gray-100 py-4 text-xs text-gray-500">{t('lockedNote')}</p>
      </div>
    </div>
  );
}
