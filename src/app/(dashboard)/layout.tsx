import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMyProfileSummary } from '@/lib/dashboard-data';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  // Admins don't have a member biodata; their home is the admin panel
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard');

  const profile = await getMyProfileSummary(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
      <DashboardSidebar profile={profile} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
