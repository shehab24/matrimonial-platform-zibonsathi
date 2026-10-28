import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Clock, AlertCircle, FileEdit, Ban as BanIcon, Coins, TrendingUp, Star, Heart, Ban, ShoppingCart, Send, Inbox, ShoppingBag } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getDashboardStats, getMyProfileSummary } from '@/lib/dashboard-data';
import { Button } from '@/components/ui/button';
import { intlLocale } from '@/i18n/config';

export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

/** Start dates for the "viewed" breakdown: last 30 days, last 7 days, today */
function viewWindows() {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return { last30: new Date(now - 30 * DAY), last7: new Date(now - 7 * DAY), today };
}

const bannerStyle = {
  DRAFT: { icon: FileEdit, className: 'bg-gray-100 text-gray-600', cta: 'fill', href: '/profile' },
  PENDING_APPROVAL: { icon: Clock, className: 'bg-yellow-100 text-yellow-700', cta: 'edit', href: '/profile' },
  APPROVED: { icon: BadgeCheck, className: 'bg-green-100 text-green-700', cta: 'view', href: null },
  REJECTED: { icon: AlertCircle, className: 'bg-red-100 text-red-600', cta: 'edit', href: '/profile' },
  SUSPENDED: { icon: BanIcon, className: 'bg-gray-100 text-gray-600', cta: 'contact', href: '/contact' },
} as const;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const t = await getTranslations('dashboard');
  const nf = new Intl.NumberFormat(intlLocale(await getLocale()));

  // Profile (shared with the layout) and every counter in parallel: one database round trip
  const [profile, stats] = await Promise.all([getMyProfileSummary(userId), getDashboardStats(userId, viewWindows())]);
  const { balance, views, views30, views7, viewsToday, likedMe, favorites, ignored, purchases, sent, received } = stats;

  const status = profile?.status ?? 'DRAFT';
  const banner = bannerStyle[status];
  const BannerIcon = banner.icon;
  const bannerHref = banner.href ?? `/profile/${profile?.id}`;

  const quickLinks = [
    { href: '/favorites', label: t('nav.favorites'), desc: t('favoritesDesc'), count: favorites, icon: Heart, className: 'bg-pink-100 text-pink-700' },
    { href: '/ignored', label: t('nav.ignored'), desc: t('ignoredDesc'), count: ignored, icon: Ban, className: 'bg-red-100 text-red-600' },
    { href: '/credits', label: t('nav.purchases'), desc: t('purchasesDesc'), count: purchases, icon: ShoppingCart, className: 'bg-green-100 text-green-700' },
    { href: '/connections/sent', label: t('nav.proposalsSent'), desc: t('sentDesc'), count: sent, icon: Send, className: 'bg-blue-100 text-blue-700' },
    { href: '/connections/received', label: t('nav.proposalsReceived'), desc: t('receivedDesc'), count: received, icon: Inbox, className: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Biodata status banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${banner.className}`}>
          <BannerIcon className="h-5 w-5" />
        </span>
        <p className="flex-1 text-sm text-gray-700">{t(`banner.${status}`, { id: profile?.oderId ?? '' })}</p>
        <Button asChild className="shrink-0">
          <Link href={bannerHref}>
            {t(`banner.${banner.cta}`)} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-700 to-teal-800 p-6 text-white shadow-md">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <p className="text-3xl font-bold">{t('connectionsCount', { count: balance })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15"><Coins className="h-5 w-5" /></span>
          </div>
          <p className="relative mt-4 font-semibold">{t('connectionsLabel')}</p>
          <p className="relative mt-1 text-xs text-white/75">{t('connectionsHint')}</p>
          <Button asChild variant="secondary" className="relative mt-5 w-full bg-white text-green-800 hover:bg-white/90">
            <Link href="/credits"><ShoppingBag className="h-4 w-4" /> {t('buyConnections')}</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-3xl font-bold text-gray-900">{t('viewsCount', { count: views })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><TrendingUp className="h-5 w-5" /></span>
          </div>
          <p className="mt-4 font-semibold text-gray-900">{t('viewsLabel')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('viewsHint')}</p>
          <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-lg border border-gray-200 text-center">
            {[[t('last30'), views30], [t('last7'), views7], [t('today'), viewsToday]].map(([label, value]) => (
              <div key={label as string} className="py-2">
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{t('viewsCount', { count: value as number })}</p>
              </div>
            ))}
          </div>
        </div>

        <Link href="/liked-me" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-3xl font-bold text-gray-900">{t('likedCount', { count: likedMe })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700"><Star className="h-5 w-5 fill-current" /></span>
          </div>
          <p className="mt-4 font-semibold text-gray-900">{t('likedLabel')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('likedHint')}</p>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {quickLinks.map(({ href, label, desc, count, icon: Icon, className }) => (
          <Link key={href} href={href} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${className}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-gray-900">{label}</span>
              <span className="block line-clamp-2 text-xs text-gray-500">{desc}</span>
            </span>
            <span className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-lg font-bold ${className}`}>
              {nf.format(count)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
