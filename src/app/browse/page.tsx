'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DIVISIONS } from '@/lib/constants';
import Link from 'next/link';
import { browseProfiles } from '@/actions/browse';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, GraduationCap, Briefcase, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface Profile {
  id: string;
  oderId: string | null;
  displayName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  division: string | null;
  district: string | null;
  education: string | null;
  occupation: string | null;
  maritalStatus: string | null;
  photos: { url: string }[];
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  const age = today.getFullYear() - birth.getFullYear();
  return age;
}

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
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  const opt = (value: string | null) => (value && to.has(value) ? to(value) : value);
  const formatAge = (dob: string | null) => {
    const age = calcAge(dob);
    return age === null ? '' : tc('years', { age });
  };
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  // Start in the loading state so the empty "no profiles" message doesn't flash before the first fetch
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') ?? '',
    ageMin: '',
    ageMax: '',
    division: searchParams.get('division') ?? '',
    district: '',
    education: '',
    maritalStatus: searchParams.get('maritalStatus') ?? '',
    page: 1,
  });

  const load = useCallback(async (f: typeof filters) => {
    setIsLoading(true);
    const result = await browseProfiles({
      gender: f.gender || undefined,
      ageMin: f.ageMin ? parseInt(f.ageMin) : undefined,
      ageMax: f.ageMax ? parseInt(f.ageMax) : undefined,
      division: f.division || undefined,
      district: f.district || undefined,
      education: f.education || undefined,
      maritalStatus: f.maritalStatus || undefined,
      page: f.page,
    });
    if (result.success) {
      setProfiles(result.profiles as unknown as Profile[]);
      setPagination(result.pagination as Pagination);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(filters); }, []);

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, page: 1 };
    setFilters(newFilters);
    load(newFilters);
  };

  const changePage = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    load(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{isLoading ? '\u00a0' : t('found', { total: pagination.total })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-gray-900 mb-4">{t('filterTitle')}</h2>
              <form onSubmit={handleFilter} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('gender')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">{tc('all')}</option>
                    <option value="MALE">{tc('male')}</option>
                    <option value="FEMALE">{tc('female')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{t('ageRange')}</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder={t('min')} min="18" max="80" value={filters.ageMin} onChange={e => setFilters(f => ({ ...f, ageMin: e.target.value }))} />
                    <Input type="number" placeholder={t('max')} min="18" max="80" value={filters.ageMax} onChange={e => setFilters(f => ({ ...f, ageMax: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('division')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={filters.division} onChange={e => setFilters(f => ({ ...f, division: e.target.value }))}>
                    <option value="">{t('allDivisions')}</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{td(d)}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{t('district')}</Label>
                  <Input placeholder={t('districtPlaceholder')} value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>{t('maritalStatus')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={filters.maritalStatus} onChange={e => setFilters(f => ({ ...f, maritalStatus: e.target.value }))}>
                    <option value="">{tc('all')}</option>
                    <option value="NEVER_MARRIED">{tm('NEVER_MARRIED')}</option>
                    <option value="DIVORCED">{tm('DIVORCED')}</option>
                    <option value="WIDOWED">{tm('WIDOWED')}</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">{t('apply')}</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => {
                  setFilters({ gender: '', ageMin: '', ageMax: '', division: '', district: '', education: '', maritalStatus: '', page: 1 });
                  load({ gender: '', ageMin: '', ageMax: '', division: '', district: '', education: '', maritalStatus: '', page: 1 });
                }}>{t('reset')}</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Profiles Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {profiles.map((profile) => (
                  <Link key={profile.id} href={`/profile/${profile.id}`}>
                    <Card className="hover:shadow-md transition-all cursor-pointer hover:border-green-200">
                      <CardContent className="p-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {profile.photos?.[0] ? (
                              <img src={profile.photos[0].url} alt="profile" className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-7 w-7 text-green-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{profile.displayName || tc('unknown')}</p>
                            {profile.oderId && (
                              <p className="text-xs text-green-600 font-medium">{profile.oderId}</p>
                            )}
                            <p className="text-sm text-gray-500">{formatAge(profile.dateOfBirth)}{profile.gender === 'MALE' ? ` • ${tc('male')}` : profile.gender === 'FEMALE' ? ` • ${tc('female')}` : ''}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {(profile.division || profile.district) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span>{[profile.district, profile.division].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          {profile.education && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate">{opt(profile.education)}</span>
                            </div>
                          )}
                          {profile.occupation && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate">{opt(profile.occupation)}</span>
                            </div>
                          )}
                        </div>
                        {profile.maritalStatus && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {tm(profile.maritalStatus)}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
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
