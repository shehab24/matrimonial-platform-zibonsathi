import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Trash2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardEmptyState, DashboardPageHeader } from '@/components/dashboard/page-parts';
import { DeleteBiodataPanel } from '@/components/settings/delete-biodata-panel';

export default async function DeleteBiodataPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const t = await getTranslations('deleteBiodata');

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { oderId: true, hadiaPledge: true, status: true, dateOfBirth: true, maritalStatus: true, education: true },
  });
  // Every member has a profile row (it holds gender and mobile); a biodata exists once it has been filled in or submitted
  const hasBiodata = !!profile && (profile.status !== 'DRAFT' || !!profile.dateOfBirth || !!profile.maritalStatus || !!profile.education);

  return (
    <div>
      <DashboardPageHeader icon={Trash2} iconClassName="bg-red-50 text-red-600" title={t('title')} summary={t('summary')} />
      {profile && hasBiodata ? (
        <DeleteBiodataPanel oderId={profile.oderId} hadiaPledge={profile.hadiaPledge} />
      ) : (
        <DashboardEmptyState icon={Trash2} title={t('noBiodata')} hint={t('noBiodataHint')} />
      )}
    </div>
  );
}
