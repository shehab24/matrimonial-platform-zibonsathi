'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  Search, LayoutGrid, PenSquare, Heart, Ban, Star, ShoppingCart, Send, Inbox, Bell, LogOut, Eye, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SidebarProfile {
  id: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  gender: 'MALE' | 'FEMALE' | null;
}

const links = [
  { href: '/browse', label: 'searchBiodata', icon: Search },
  { href: '/dashboard', label: 'dashboard', icon: LayoutGrid },
  { href: '/profile', label: 'editBiodata', icon: PenSquare },
  { href: '/favorites', label: 'favorites', icon: Heart },
  { href: '/ignored', label: 'ignored', icon: Ban },
  { href: '/liked-me', label: 'likedMe', icon: Star },
  { href: '/credits', label: 'purchases', icon: ShoppingCart },
  { href: '/connections/sent', label: 'proposalsSent', icon: Send },
  { href: '/connections/received', label: 'proposalsReceived', icon: Inbox },
  { href: '/notifications', label: 'notifications', icon: Bell },
] as const;

const statusStyles: Record<SidebarProfile['status'], string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-700 text-white',
};

export function DashboardSidebar({ profile }: { profile: SidebarProfile | null }) {
  const t = useTranslations('dashboard');
  const ts = useTranslations('profileStatus');
  const pathname = usePathname();
  // Own biodata page is only public once approved; otherwise send the user to the editor
  const myBiodataHref = profile?.status === 'APPROVED' ? `/profile/${profile.id}` : '/profile';

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {/* Profile summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-700 bg-green-50">
          <User className="h-8 w-8 text-green-700" />
        </div>
        <p className="mt-3 text-xs text-gray-500">{t('biodataStatus')}</p>
        <span className={`mt-1 inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold ${profile ? statusStyles[profile.status] : statusStyles.DRAFT}`}>
          {profile ? ts(profile.status) : t('notCreated')}
        </span>
        <Button asChild className="mt-4 w-full">
          <Link href={myBiodataHref}>
            <Eye className="h-4 w-4" /> {t('myBiodata')}
          </Link>
        </Button>
      </div>

      {/* Navigation: horizontal scroller on mobile, vertical list on desktop */}
      <nav className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="flex lg:flex-col overflow-x-auto lg:overflow-visible py-1 lg:py-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/profile' && pathname.startsWith(`${href}/`));
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
                  {t(`nav.${label}`)}
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
              {t('nav.logout')}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
