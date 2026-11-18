export const dynamic = 'force-dynamic';
import { adminBiodataHref } from '@/lib/biodata-url';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Gender, Prisma, ProfileStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { DeleteBiodataButton } from '@/components/admin/delete-biodata-button';
import { GENDER_LABELS, STATUS_LABELS, STATUS_STYLES, bnDate, bnNumber } from '@/lib/admin-labels';

const PAGE_SIZE = 20;
const TABS = ['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DRAFT'] as const;

type SearchParams = Promise<{ status?: string; gender?: string; q?: string; page?: string }>;

export default async function AdminBiodatasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = (Object.values(ProfileStatus) as string[]).includes(params.status ?? '') ? (params.status as ProfileStatus) : null;
  const gender = (Object.values(Gender) as string[]).includes(params.gender ?? '') ? (params.gender as Gender) : null;
  const q = params.q?.trim() ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1') || 1);

  const search: Prisma.ProfileWhereInput = q
    ? {
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { oderId: { contains: q, mode: 'insensitive' } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }
    : {};
  const where: Prisma.ProfileWhereInput = { ...search, ...(status && { status }), ...(gender && { gender }) };

  const [profiles, total, counts] = await Promise.all([
    prisma.profile.findMany({
      where,
      // Review queue: oldest submission first; everything else: most recently updated first
      orderBy: { updatedAt: status === ProfileStatus.PENDING_APPROVAL ? 'asc' : 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, oderId: true, displayName: true, gender: true, dateOfBirth: true, district: true, division: true,
        status: true, updatedAt: true, user: { select: { email: true, isSuspended: true } },
      },
    }),
    prisma.profile.count({ where }),
    prisma.profile.groupBy({ by: ['status'], where: { ...search, ...(gender && { gender }) }, _count: true }),
  ]);

  const countFor = (tab: (typeof TABS)[number]) =>
    tab === 'ALL' ? counts.reduce((sum, c) => sum + c._count, 0) : counts.find((c) => c.status === tab)?._count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (overrides: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    const merged = { status: status ?? null, gender: gender ?? null, q: q || null, page: null, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/admin/biodatas?${qs}` : '/admin/biodatas';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          {status === ProfileStatus.PENDING_APPROVAL ? 'রিভিউয়ের অপেক্ষায়' : 'সকল বায়োডাটা'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">মোট {bnNumber(total)} টি বায়োডাটা পাওয়া গেছে</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Status tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200">
          {TABS.map((tab) => {
            const active = (tab === 'ALL' && !status) || tab === status;
            return (
              <Link
                key={tab}
                href={href({ status: tab === 'ALL' ? null : tab })}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                  active ? 'border-green-700 text-green-700 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'ALL' ? 'সকল' : STATUS_LABELS[tab]}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{bnNumber(countFor(tab))}</span>
              </Link>
            );
          })}
        </div>

        {/* Search + gender filter (plain GET form, so filters live in the URL) */}
        <form action="/admin/biodatas" className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-200">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="নাম, বায়োডাটা নং বা ইমেইল দিয়ে খুঁজুন"
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <select name="gender" defaultValue={gender ?? ''} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900">
            <option value="">পাত্র ও পাত্রী</option>
            <option value="MALE">পাত্র</option>
            <option value="FEMALE">পাত্রী</option>
          </select>
          <Button type="submit">খুঁজুন</Button>
        </form>

        {/* List */}
        {profiles.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-500">কোনো বায়োডাটা পাওয়া যায়নি</p>
        ) : (
          <>
            {/* Desktop: table */}
            <table className="hidden md:table w-full table-fixed text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">বায়োডাটা</th>
                  <th className="w-[22%] px-4 py-3 font-medium">ধরন ও ঠিকানা</th>
                  <th className="w-[19%] px-4 py-3 font-medium">অবস্থা</th>
                  <th className="w-[13%] px-4 py-3 font-medium">আপডেট</th>
                  <th className="w-[150px] px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => {
                  const pending = p.status === ProfileStatus.PENDING_APPROVAL;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={p.displayName} gender={p.gender} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">
                              {p.displayName ?? <span className="text-gray-400">নাম নেই</span>}
                              <span className="ml-2 font-mono text-xs font-normal text-gray-500">{p.oderId ?? 'আইডি নেই'}</span>
                            </p>
                            <p className="truncate text-xs text-gray-500" title={p.user.email}>{p.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{p.gender ? GENDER_LABELS[p.gender] : '—'}</p>
                        <p className="truncate text-xs text-gray-500">{location(p)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadges status={p.status} suspended={p.user.isSuspended} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{bnDate(p.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant={pending ? 'default' : 'outline'} asChild>
                            <Link href={adminBiodataHref(p)}>{pending ? 'রিভিউ করুন' : 'দেখুন'}</Link>
                          </Button>
                          <DeleteBiodataButton profileId={p.id} label={p.oderId ?? p.displayName} size="sm" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile: cards */}
            <ul className="md:hidden divide-y divide-gray-100">
              {profiles.map((p) => {
                const pending = p.status === ProfileStatus.PENDING_APPROVAL;
                return (
                  <li key={p.id} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={p.displayName} gender={p.gender} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{p.displayName ?? 'নাম নেই'}</p>
                        <p className="font-mono text-xs text-gray-500">{p.oderId ?? 'আইডি নেই'}</p>
                        <p className="truncate text-xs text-gray-500">{p.user.email}</p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">{bnDate(p.updatedAt)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <StatusBadges status={p.status} suspended={p.user.isSuspended} />
                      <span>{p.gender ? GENDER_LABELS[p.gender] : '—'}</span>
                      <span className="text-gray-300">•</span>
                      <span>{location(p)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" variant={pending ? 'default' : 'outline'} asChild>
                        <Link href={adminBiodataHref(p)}>{pending ? 'রিভিউ করুন' : 'দেখুন'}</Link>
                      </Button>
                      <DeleteBiodataButton profileId={p.id} label={p.oderId ?? p.displayName} size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-gray-200 p-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={href({ page: String(page - 1) })} aria-disabled={page <= 1} className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-sm text-gray-600">পৃষ্ঠা {bnNumber(page)} / {bnNumber(totalPages)}</span>
            <Button variant="outline" size="sm" asChild>
              <Link href={href({ page: String(page + 1) })} aria-disabled={page >= totalPages} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const location = (p: { district: string | null; division: string | null }) =>
  [p.district, p.division].filter(Boolean).join(', ') || 'ঠিকানা নেই';

function Avatar({ name, gender }: { name: string | null; gender: Gender | null }) {
  const tone = gender === Gender.FEMALE ? 'bg-pink-100 text-pink-700' : gender === Gender.MALE ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500';
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone}`}>
      {name?.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

function StatusBadges({ status, suspended }: { status: ProfileStatus; suspended: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
      {suspended && <span className="whitespace-nowrap rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700">অ্যাকাউন্ট স্থগিত</span>}
    </div>
  );
}
