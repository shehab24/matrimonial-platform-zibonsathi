'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, ClipboardCheck, FileText, Users, Flag, Package, LogOut, ShieldCheck } from 'lucide-react';

export function AdminSidebar({ email, pendingCount, openReports }: { email: string; pendingCount: number; openReports: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reviewing = pathname === '/admin/biodatas' && searchParams.get('status') === 'PENDING_APPROVAL';
  const links = [
    { href: '/admin/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { href: '/admin/biodatas?status=PENDING_APPROVAL', match: 'review', label: 'রিভিউয়ের অপেক্ষায়', icon: ClipboardCheck, count: pendingCount },
    { href: '/admin/biodatas', label: 'সকল বায়োডাটা', icon: FileText },
    { href: '/admin/users', label: 'ব্যবহারকারী', icon: Users },
    { href: '/admin/reports', label: 'রিপোর্ট', icon: Flag, count: openReports },
    { href: '/admin/packages', label: 'ক্রেডিট প্যাকেজ', icon: Package },
  ];

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-700 bg-green-50">
          <ShieldCheck className="h-8 w-8 text-green-700" />
        </div>
        <p className="mt-3 font-semibold text-gray-900">অ্যাডমিন প্যানেল</p>
        <p className="text-xs text-gray-500 truncate">{email}</p>
      </div>

      <nav className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="flex lg:flex-col overflow-x-auto lg:overflow-visible py-1 lg:py-2">
          {links.map(({ href, label, icon: Icon, count, match }) => {
            const path = href.split('?')[0];
            // The review queue and "all biodatas" share a path; the pending filter decides which is active
            const active = match === 'review'
              ? reviewing
              : !(path === '/admin/biodatas' && reviewing) &&
                (pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(`${path}/`)));
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className={`flex items-center gap-3 whitespace-nowrap px-5 py-3 text-sm transition-colors border-b-2 lg:border-b-0 lg:border-l-[3px] ${
                    active
                      ? 'border-green-700 bg-green-50 text-green-700 font-semibold'
                      : 'border-transparent text-gray-700 hover:bg-gray-50 hover:text-green-700'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {!!count && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      {count.toLocaleString('bn-BD')}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0 lg:mt-1 lg:border-t lg:border-gray-200 lg:pt-1">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-3 whitespace-nowrap px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors lg:border-l-[3px] lg:border-transparent"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              লগআউট
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
