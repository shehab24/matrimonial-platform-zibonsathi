'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Ban, X } from 'lucide-react';
import { getIgnoredProfiles, removeFromIgnored } from '@/actions/ignore';
import { BiodataCard, type BiodataSummary } from '@/components/dashboard/biodata-card';
import { DashboardEmptyState, DashboardListSkeleton, DashboardPageHeader } from '@/components/dashboard/page-parts';

interface IgnoredItem {
  id: string;
  profile: { id: string; profile: BiodataSummary | null };
}

export default function IgnoredPage() {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<IgnoredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getIgnoredProfiles();
    if (result.success) setItems(result.ignored as unknown as IgnoredItem[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const remove = async (item: IgnoredItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await removeFromIgnored(item.profile.id);
  };

  const visible = items.filter((i) => i.profile.profile);

  return (
    <>
      <DashboardPageHeader
        icon={Ban}
        iconClassName="bg-red-100 text-red-600"
        title={t('nav.ignored')}
        summary={isLoading ? undefined : t('lists.ignored.summary', { count: visible.length })}
      />
      {isLoading ? (
        <DashboardListSkeleton />
      ) : visible.length === 0 ? (
        <DashboardEmptyState icon={Ban} title={t('lists.ignored.empty')} hint={t('lists.ignored.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visible.map((item) => (
            <BiodataCard
              key={item.id}
              profile={item.profile.profile!}
              action={
                <button
                  onClick={() => remove(item)}
                  title={t('removeIgnored')}
                  aria-label={t('removeIgnored')}
                  className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
