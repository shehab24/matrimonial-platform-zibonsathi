export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { ProfileStatus, ReportStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const [pendingCount, openReports] = await Promise.all([
    prisma.profile.count({ where: { status: ProfileStatus.PENDING_APPROVAL } }),
    prisma.report.count({ where: { status: ReportStatus.OPEN } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
      <AdminSidebar email={session.user.email ?? ''} pendingCount={pendingCount} openReports={openReports} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
