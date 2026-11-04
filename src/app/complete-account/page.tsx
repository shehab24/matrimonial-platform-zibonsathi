import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMyProfileSummary } from '@/lib/dashboard-data';
import { CompleteAccountForm } from '@/components/auth/complete-account-form';

// Members land here from the dashboard until their account has a gender and a mobile number
export default async function CompleteAccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard');

  const profile = await getMyProfileSummary(session.user.id);
  if (profile?.gender && profile.phoneNumber) redirect('/dashboard');

  return <CompleteAccountForm hasGender={!!profile?.gender} />;
}
