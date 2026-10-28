'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DIVISIONS } from '@/lib/constants';


const selectClass =
  'h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600';

export function QuickSearch() {
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const router = useRouter();
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [division, setDivision] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (gender) params.set('gender', gender);
    if (maritalStatus) params.set('maritalStatus', maritalStatus);
    if (division) params.set('division', division);
    const query = params.toString();
    router.push(query ? `/browse?${query}` : '/browse');
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-xl p-4 md:p-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700">{t('lookingFor')}</span>
          <select className={selectClass} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">{t('both')}</option>
            <option value="MALE">{t('groomBiodata')}</option>
            <option value="FEMALE">{t('brideBiodata')}</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700">{t('maritalStatus')}</span>
          <select className={selectClass} value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
            <option value="">{tc('all')}</option>
            <option value="NEVER_MARRIED">{tm('NEVER_MARRIED')}</option>
            <option value="DIVORCED">{tm('DIVORCED')}</option>
            <option value="WIDOWED">{tm('WIDOWED')}</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700">{t('permanentAddress')}</span>
          <select className={selectClass} value={division} onChange={(e) => setDivision(e.target.value)}>
            <option value="">{t('allDivisions')}</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{td(d)}</option>
            ))}
          </select>
        </label>
        <Button type="submit" size="lg" className="h-11 w-full">
          <Search className="mr-2 h-4 w-4" /> {tc('search')}
        </Button>
      </div>
      <div className="mt-3 text-right">
        <Link href="/browse" className="text-sm text-green-700 hover:underline">{t('allFilters')}</Link>
      </div>
    </form>
  );
}
