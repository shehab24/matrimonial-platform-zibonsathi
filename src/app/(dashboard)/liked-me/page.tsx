'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { getWhoLikedMe } from '@/actions/favorite';
import { BiodataCard, type BiodataSummary } from '@/components/dashboard/biodata-card';
import { DashboardEmptyState, DashboardListSkeleton, DashboardPageHeader } from '@/components/dashboard/page-parts';

interface LikedByItem {
  id: string;
  user: { id: string; profile: BiodataSummary | null };
}

export default function LikedMePage() {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<LikedByItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getWhoLikedMe();
    if (result.success) setItems(result.likedBy as unknown as LikedByItem[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  // Count everyone who liked me, but only show cards for members with a biodata
  const withProfile = items.filter((i) => i.user.profile);

  return (
    <>
      <DashboardPageHeader
        icon={Star}
        iconClassName="bg-yellow-100 text-yellow-700"
        title={t('nav.likedMe')}
        summary={isLoading ? undefined : t('lists.likedMe.summary', { count: items.length })}
      />
      {isLoading ? (
        <DashboardListSkeleton />
      ) : withProfile.length === 0 ? (
        <DashboardEmptyState icon={Star} title={t('lists.likedMe.empty')} hint={t('lists.likedMe.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {withProfile.map((item) => (
            <BiodataCard key={item.id} profile={item.user.profile!} />
          ))}
        </div>
      )}
    </>
  );
}
