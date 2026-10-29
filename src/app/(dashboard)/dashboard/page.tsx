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
  DRAFT: { icon: FileEdit, className: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100', cta: 'fill', href: '/profile' },
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
    { href: '/favorites', label: t('nav.favorites'), desc: t('favoritesDesc'), count: favorites, icon: Heart, className: 'bg-pink-50 text-pink-600 ring-pink-100' },
    { href: '/ignored', label: t('nav.ignored'), desc: t('ignoredDesc'), count: ignored, icon: Ban, className: 'bg-red-50 text-red-500 ring-red-100' },
    { href: '/credits', label: t('nav.purchases'), desc: t('purchasesDesc'), count: purchases, icon: ShoppingCart, className: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
    { href: '/connections/sent', label: t('nav.proposalsSent'), desc: t('sentDesc'), count: sent, icon: Send, className: 'bg-blue-50 text-blue-600 ring-blue-100' },
    { href: '/connections/received', label: t('nav.proposalsReceived'), desc: t('receivedDesc'), count: received, icon: Inbox, className: 'bg-teal-50 text-teal-600 ring-teal-100' },
  ];

  const card = 'rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]';
  const cardHover = 'transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_8px_24px_-8px_rgba(16,24,40,0.12)]';

  return (
    <div className="space-y-5">
      {/* Biodata status banner */}
      <div className={`${card} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${banner.className}`}>
          <BannerIcon className="h-5 w-5" />
        </span>
        <p className="flex-1 text-sm leading-relaxed text-gray-600">{t(`banner.${status}`, { id: profile?.oderId ?? '' })}</p>
        <Button asChild className="shrink-0 rounded-xl">
          <Link href={bannerHref}>
            {t(`banner.${banner.cta}`)} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 via-green-800 to-teal-900 p-6 text-white shadow-[0_10px_30px_-12px_rgba(21,128,61,0.55)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between">
            <p className="text-3xl font-bold tracking-tight">{t('connectionsCount', { count: balance })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><Coins className="h-5 w-5" /></span>
          </div>
          <p className="relative mt-4 font-semibold">{t('connectionsLabel')}</p>
          <p className="relative mt-1 text-xs leading-relaxed text-white/70">{t('connectionsHint')}</p>
          <span aria-hidden className="block min-h-5 flex-1" />
          <Button asChild variant="secondary" className="relative w-full rounded-xl bg-white text-green-800 hover:bg-white/90">
            <Link href="/credits"><ShoppingBag className="h-4 w-4" /> {t('buyConnections')}</Link>
          </Button>
        </div>

        <div className={`${card} flex flex-col p-6`}>
          <div className="flex items-start justify-between">
            <p className="text-3xl font-bold tracking-tight text-gray-900">{t('viewsCount', { count: views })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"><TrendingUp className="h-5 w-5" /></span>
          </div>
          <p className="mt-4 font-semibold text-gray-900">{t('viewsLabel')}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{t('viewsHint')}</p>
          <span aria-hidden className="block min-h-5 flex-1" />
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-50 p-1 text-center">
            {[[t('last30'), views30], [t('last7'), views7], [t('today'), viewsToday]].map(([label, value]) => (
              <div key={label as string} className="rounded-lg py-2 first:bg-white first:shadow-sm">
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{t('viewsCount', { count: value as number })}</p>
              </div>
            ))}
          </div>
        </div>

        <Link href="/liked-me" className={`${card} ${cardHover} group flex flex-col p-6 md:col-span-2 xl:col-span-1`}>
          <div className="flex items-start justify-between">
            <p className="text-3xl font-bold tracking-tight text-gray-900">{t('likedCount', { count: likedMe })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 ring-1 ring-amber-100"><Star className="h-5 w-5 fill-current" /></span>
          </div>
          <p className="mt-4 font-semibold text-gray-900">{t('likedLabel')}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{t('likedHint')}</p>
          <span aria-hidden className="block min-h-5 flex-1" />
          <span className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors group-hover:bg-amber-50 group-hover:text-amber-700">
            {t('viewList')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {quickLinks.map(({ href, label, desc, count, icon: Icon, className }) => (
          <Link key={href} href={href} className={`${card} ${cardHover} group flex flex-col p-4 last:col-span-2 lg:last:col-span-1`}>
            <span className="flex items-start justify-between">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${className}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold tracking-tight text-gray-900">{nf.format(count)}</span>
            </span>
            <span className="mt-4 block text-sm font-semibold text-gray-900">{label}</span>
            <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-gray-500">{desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
