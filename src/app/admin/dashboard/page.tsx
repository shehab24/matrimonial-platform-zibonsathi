export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Users, FileText, ClipboardCheck, BadgeCheck, Flag, Link2, User, UserRound, ArrowRight } from 'lucide-react';
import { ConnectionStatus, Gender, ProfileStatus, ReportStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { GENDER_LABELS, bnDate, bnNumber } from '@/lib/admin-labels';

/** Start of the day six days ago, i.e. the last 7 days including today */
function lastWeekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d;
}

export default async function AdminDashboardPage() {
  const approved = { status: ProfileStatus.APPROVED };
  const [users, biodatas, pending, approvedCount, male, female, openReports, connections, newUsers, queue] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.profile.count(),
    prisma.profile.count({ where: { status: ProfileStatus.PENDING_APPROVAL } }),
    prisma.profile.count({ where: approved }),
    prisma.profile.count({ where: { ...approved, gender: Gender.MALE } }),
    prisma.profile.count({ where: { ...approved, gender: Gender.FEMALE } }),
    prisma.report.count({ where: { status: ReportStatus.OPEN } }),
    prisma.connection.count({ where: { status: ConnectionStatus.ACCEPTED } }),
    prisma.user.count({ where: { role: Role.USER, createdAt: { gte: lastWeekStart() } } }),
    prisma.profile.findMany({
      where: { status: ProfileStatus.PENDING_APPROVAL },
      orderBy: { updatedAt: 'asc' },
      take: 6,
      select: { id: true, displayName: true, gender: true, district: true, updatedAt: true, user: { select: { email: true } } },
    }),
  ]);

  const stats = [
    { label: 'মোট ব্যবহারকারী', value: users, hint: `শেষ ৭ দিনে নতুন ${bnNumber(newUsers)} জন`, icon: Users, className: 'bg-blue-100 text-blue-700', href: '/admin/users' },
    { label: 'মোট বায়োডাটা', value: biodatas, hint: 'খসড়া সহ সকল', icon: FileText, className: 'bg-green-100 text-green-700', href: '/admin/biodatas' },
    { label: 'রিভিউয়ের অপেক্ষায়', value: pending, hint: 'অনুমোদন বা প্রত্যাখ্যান করুন', icon: ClipboardCheck, className: 'bg-yellow-100 text-yellow-700', href: '/admin/biodatas?status=PENDING_APPROVAL' },
    { label: 'অনুমোদিত বায়োডাটা', value: approvedCount, hint: 'ব্রাউজে প্রকাশিত', icon: BadgeCheck, className: 'bg-green-100 text-green-700', href: '/admin/biodatas?status=APPROVED' },
    { label: 'পাত্রের বায়োডাটা', value: male, hint: 'অনুমোদিত', icon: User, className: 'bg-blue-100 text-blue-700', href: '/admin/biodatas?status=APPROVED&gender=MALE' },
    { label: 'পাত্রীর বায়োডাটা', value: female, hint: 'অনুমোদিত', icon: UserRound, className: 'bg-pink-100 text-pink-700', href: '/admin/biodatas?status=APPROVED&gender=FEMALE' },
    { label: 'খোলা রিপোর্ট', value: openReports, hint: 'সমাধানের অপেক্ষায়', icon: Flag, className: 'bg-red-100 text-red-600', href: '/admin/reports' },
    { label: 'সফল সংযোগ', value: connections, hint: 'গৃহীত যোগাযোগের অনুরোধ', icon: Link2, className: 'bg-green-100 text-green-700', href: null },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">অ্যাডমিন ড্যাশবোর্ড</h1>
        <p className="text-sm text-gray-500 mt-0.5">সার্বিক পরিসংখ্যান ও রিভিউয়ের অপেক্ষায় থাকা বায়োডাটা</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, hint, icon: Icon, className, href }) => {
          const body = (
            <>
              <div className="flex items-start justify-between">
                <p className="text-3xl font-bold text-gray-900">{bnNumber(value)}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${className}`}><Icon className="h-5 w-5" /></span>
              </div>
              <p className="mt-3 font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{hint}</p>
            </>
          );
          const cls = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
          return href ? (
            <Link key={label} href={href} className={`${cls} hover:shadow-md transition-shadow`}>{body}</Link>
          ) : (
            <div key={label} className={cls}>{body}</div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">রিভিউয়ের অপেক্ষায় (পুরাতন আগে)</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/biodatas?status=PENDING_APPROVAL">সকল দেখুন</Link>
          </Button>
        </div>
        {queue.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">রিভিউয়ের অপেক্ষায় কোনো বায়োডাটা নেই 🎉</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queue.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{p.displayName ?? 'নাম নেই'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.user.email} · {p.gender ? GENDER_LABELS[p.gender] : '—'} · {p.district ?? '—'} · জমা: {bnDate(p.updatedAt)}
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/admin/biodatas/${p.id}`}>রিভিউ করুন <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
