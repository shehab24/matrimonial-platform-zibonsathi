'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { getFavorites, toggleFavorite } from '@/actions/favorite';
import { BiodataCard, type BiodataSummary } from '@/components/dashboard/biodata-card';
import { DashboardEmptyState, DashboardListSkeleton, DashboardPageHeader } from '@/components/dashboard/page-parts';

interface FavoriteItem {
  id: string;
  profile: { id: string; profile: BiodataSummary | null };
}

export default function FavoritesPage() {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getFavorites();
    if (result.success) setItems(result.favorites as unknown as FavoriteItem[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const remove = async (item: FavoriteItem, profileId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await toggleFavorite(profileId);
  };

  const visible = items.filter((i) => i.profile.profile);

  return (
    <>
      <DashboardPageHeader
        icon={Heart}
        iconClassName="bg-pink-100 text-pink-700"
        title={t('nav.favorites')}
        summary={isLoading ? undefined : t('lists.favorites.summary', { count: visible.length })}
      />
      {isLoading ? (
        <DashboardListSkeleton />
      ) : visible.length === 0 ? (
        <DashboardEmptyState icon={Heart} title={t('lists.favorites.empty')} hint={t('lists.favorites.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visible.map((item) => {
            const profile = item.profile.profile!;
            return (
              <BiodataCard
                key={item.id}
                profile={profile}
                action={
                  <button
                    onClick={() => remove(item, profile.id)}
                    title={t('removeFavorite')}
                    aria-label={t('removeFavorite')}
                    className="shrink-0 rounded-full p-1 text-pink-600 hover:bg-pink-100"
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </button>
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}
