'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { browseProfiles } from '@/actions/browse';
import { Button } from '@/components/ui/button';
import { AGE_MAX, AGE_MIN, BiodataFilters, EMPTY_FILTERS, countActiveFilters, filtersFromParams, filtersToParams, type BrowseFilterState } from '@/components/browse/biodata-filters';
import { BiodataListCard, type BrowseProfile } from '@/components/browse/biodata-list-card';
import { User, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

// Columns keep each card at roughly 360px+ wide; the sidebar takes 320px from lg up
const GRID = 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 min-[94rem]:grid-cols-3';

const SORTS = ['default', 'newest', 'oldest'] as const;

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('browse');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  const opt = (value: string | null) => (value && to.has(value) ? to(value) : value);
  const router = useRouter();
  const [profiles, setProfiles] = useState<BrowseProfile[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  // Start in the loading state so the empty "no profiles" message doesn't flash before the first fetch
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // The URL is the source of truth for applied filters; `draft` holds edits until "Search" is pressed
  const query = searchParams.toString();
  const applied = filtersFromParams(searchParams);
  const sort = SORTS.find(s => s === searchParams.get('sort')) ?? 'default';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
  const [draft, setDraft] = useState<BrowseFilterState>(applied);

  // When the URL changes (apply, chip removal, Back), reset the draft and show the loading state
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (syncedQuery !== query) {
    setSyncedQuery(query);
    setDraft(applied);
    setIsLoading(true);
  }

  useEffect(() => {
    const f = filtersFromParams(new URLSearchParams(query));
    let cancelled = false;
    let ageMin = f.ageMin ? parseInt(f.ageMin) : undefined;
    let ageMax = f.ageMax ? parseInt(f.ageMax) : undefined;
    if (ageMin && ageMax && ageMin > ageMax) [ageMin, ageMax] = [ageMax, ageMin];
    browseProfiles({
      gender: f.gender || undefined,
      ageMin,
      ageMax,
      division: f.division,
      district: f.district || undefined,
      education: f.education,
      occupation: f.occupation,
      maritalStatus: f.maritalStatus,
      mazhab: f.mazhab,
      familyStatus: f.familyStatus,
      biodataNo: f.biodataNo || undefined,
      sort,
      page,
    }).then(result => {
      if (cancelled) return;
      if (result.success) {
        setProfiles(result.profiles as unknown as BrowseProfile[]);
        setPagination(result.pagination as Pagination);
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps -- sort/page are derived from query

  const navigate = (f: BrowseFilterState, extra: { sort?: string; page?: number } = {}) => {
    const params = filtersToParams(f);
    const nextSort = extra.sort ?? sort;
    if (nextSort !== 'default') params.set('sort', nextSort);
    if (extra.page && extra.page > 1) params.set('page', String(extra.page));
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : '/browse', { scroll: false });
  };

  const applyDraft = () => {
    setMobileOpen(false);
    navigate(draft);
  };

  const resetAll = () => {
    setDraft(EMPTY_FILTERS);
    setMobileOpen(false);
    navigate(EMPTY_FILTERS, { sort: 'default' });
  };

  const changePage = (p: number) => {
    navigate(applied, { page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // One removable chip per applied value, shown above the results
  const activeChips: { key: string; label: string; remove: BrowseFilterState }[] = [];
  if (applied.biodataNo) activeChips.push({ key: 'no', label: t('chipBiodataNo', { no: applied.biodataNo }), remove: { ...applied, biodataNo: '' } });
  if (applied.gender) activeChips.push({ key: 'g', label: applied.gender === 'MALE' ? t('groomBiodata') : t('brideBiodata'), remove: { ...applied, gender: '' } });
  if (applied.ageMin || applied.ageMax) activeChips.push({
    key: 'age',
    label: t('chipAge', { min: Number(applied.ageMin) || AGE_MIN, max: Number(applied.ageMax) || AGE_MAX }),
    remove: { ...applied, ageMin: '', ageMax: '' },
  });
  if (applied.district) activeChips.push({ key: 'd', label: applied.district, remove: { ...applied, district: '' } });
  const listChip = (key: 'maritalStatus' | 'division' | 'education' | 'occupation' | 'mazhab' | 'familyStatus', label: (v: string) => string) =>
    applied[key].forEach(v => activeChips.push({ key: `${key}:${v}`, label: label(v), remove: { ...applied, [key]: applied[key].filter(x => x !== v) } }));
  listChip('maritalStatus', v => (tm.has(v) ? tm(v) : v));
  listChip('division', v => (td.has(v) ? td(v) : v));
  listChip('education', v => opt(v) ?? v);
  listChip('occupation', v => opt(v) ?? v);
  listChip('mazhab', v => opt(v) ?? v);
  listChip('familyStatus', v => opt(v) ?? v);
  const activeCount = countActiveFilters(applied);

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Filter Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex h-[calc(100vh-7.5rem)] max-h-[860px] flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-sm shadow-gray-900/5">
            <BiodataFilters value={draft} onChange={setDraft} onApply={applyDraft} onReset={resetAll} className="min-h-0 flex-1" />
          </div>
        </aside>

        {/* Filter bottom sheet (mobile) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden />
            <div role="dialog" aria-modal="true" className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-2xl">
              <BiodataFilters value={draft} onChange={setDraft} onApply={applyDraft} onReset={resetAll} onClose={() => setMobileOpen(false)} className="min-h-0 flex-1" />
            </div>
          </div>
        )}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 lg:hidden">
          <Button type="button" className="w-full h-12" onClick={() => setMobileOpen(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t('allFilters')}
            {activeCount > 0 && <span className="ml-2 rounded-md bg-white/25 px-2 text-xs font-bold">{activeCount}</span>}
          </Button>
        </div>

        {/* Profiles Grid */}
        <div className="pb-20 lg:pb-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
          <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-600">{isLoading ? '\u00a0' : t('found', { total: pagination.total })}</p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              {t('sortLabel')}
              <select
                className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                value={sort}
                onChange={e => navigate(applied, { sort: e.target.value })}
              >
                {SORTS.map(s => <option key={s} value={s}>{t(`sort_${s}`)}</option>)}
              </select>
            </label>
          </div>

          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeChips.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => navigate(c.remove)}
                  aria-label={t('removeFilter', { label: c.label })}
                  className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                >
                  {c.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button type="button" onClick={resetAll} className="text-xs font-medium text-red-600 hover:underline">
                {t('clearAll')}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className={GRID}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[196px] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('noResults')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('noResultsHint')}</p>
            </div>
          ) : (
            <>
              <div className={GRID}>
                {profiles.map(profile => <BiodataListCard key={profile.id} profile={profile} />)}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {t('pageOf', { page: pagination.page, total: pagination.totalPages })}
                  </span>
                  <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => changePage(pagination.page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
