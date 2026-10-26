'use client';

import { useState, useEffect, useCallback } from 'react';
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

function calcAge(dob: string | null): string {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  const age = today.getFullYear() - birth.getFullYear();
  return `${age} বছর`;
}

const maritalLabels: Record<string, string> = {
  NEVER_MARRIED: 'অবিবাহিত',
  DIVORCED: 'তালাকপ্রাপ্ত',
  WIDOWED: 'বিধবা/বিপত্নীক',
};

export default function BrowsePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    ageMin: '',
    ageMax: '',
    division: '',
    district: '',
    education: '',
    maritalStatus: '',
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
        <h1 className="text-2xl font-bold text-gray-900">প্রোফাইল খুঁজুন</h1>
        <p className="text-gray-500 mt-1">মোট {pagination.total} টি প্রোফাইল পাওয়া গেছে</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-gray-900 mb-4">ফিল্টার করুন</h2>
              <form onSubmit={handleFilter} className="space-y-4">
                <div className="space-y-2">
                  <Label>লিঙ্গ</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">সকল</option>
                    <option value="MALE">পুরুষ</option>
                    <option value="FEMALE">মহিলা</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>বয়স সীমা</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="কম" min="18" max="80" value={filters.ageMin} onChange={e => setFilters(f => ({ ...f, ageMin: e.target.value }))} />
                    <Input type="number" placeholder="বেশি" min="18" max="80" value={filters.ageMax} onChange={e => setFilters(f => ({ ...f, ageMax: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>বিভাগ</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={filters.division} onChange={e => setFilters(f => ({ ...f, division: e.target.value }))}>
                    <option value="">সকল বিভাগ</option>
                    {['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>জেলা</Label>
                  <Input placeholder="জেলার নাম" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>বৈবাহিক অবস্থা</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={filters.maritalStatus} onChange={e => setFilters(f => ({ ...f, maritalStatus: e.target.value }))}>
                    <option value="">সকল</option>
                    <option value="NEVER_MARRIED">অবিবাহিত</option>
                    <option value="DIVORCED">তালাকপ্রাপ্ত</option>
                    <option value="WIDOWED">বিধবা/বিপত্নীক</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">অনুসন্ধান করুন</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => {
                  setFilters({ gender: '', ageMin: '', ageMax: '', division: '', district: '', education: '', maritalStatus: '', page: 1 });
                  load({ gender: '', ageMin: '', ageMax: '', division: '', district: '', education: '', maritalStatus: '', page: 1 });
                }}>রিসেট</Button>
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
              <p className="text-gray-500 text-lg">কোনো প্রোফাইল পাওয়া যায়নি</p>
              <p className="text-gray-400 text-sm mt-1">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {profiles.map((profile) => (
                  <Link key={profile.id} href={`/dashboard/profile/${profile.id}`}>
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
                            <p className="font-semibold text-gray-900 truncate">{profile.displayName || 'অজানা'}</p>
                            <p className="text-sm text-gray-500">{calcAge(profile.dateOfBirth)}{profile.gender === 'MALE' ? ' • পুরুষ' : profile.gender === 'FEMALE' ? ' • মহিলা' : ''}</p>
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
                              <span className="truncate">{profile.education}</span>
                            </div>
                          )}
                          {profile.occupation && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate">{profile.occupation}</span>
                            </div>
                          )}
                        </div>
                        {profile.maritalStatus && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {maritalLabels[profile.maritalStatus] || profile.maritalStatus}
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
                    পৃষ্ঠা {pagination.page} / {pagination.totalPages}
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
