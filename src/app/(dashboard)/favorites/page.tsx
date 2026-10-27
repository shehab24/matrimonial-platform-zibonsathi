'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, Heart, User, MapPin, GraduationCap, 
  Trash2, Ban, Loader2, X
} from 'lucide-react';
import { getFavorites, getWhoLikedMe, toggleFavorite } from '@/actions/favorite';
import { getIgnoredProfiles, removeFromIgnored } from '@/actions/ignore';

interface ProfileData {
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

interface FavoriteItem {
  id: string;
  createdAt: string;
  profile: {
    id: string;
    profile: ProfileData | null;
  };
}

interface LikedByItem {
  id: string;
  createdAt: string;
  user: {
    id: string;
    profile: ProfileData | null;
  };
}

interface IgnoredItem {
  id: string;
  createdAt: string;
  profile: {
    id: string;
    profile: ProfileData | null;
  };
}

function calcAge(dob: string | null): string {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  const age = today.getFullYear() - birth.getFullYear();
  return `${age} বছর`;
}

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [likedBy, setLikedBy] = useState<LikedByItem[]>([]);
  const [ignored, setIgnored] = useState<IgnoredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [favResult, likedResult, ignoredResult] = await Promise.all([
      getFavorites(),
      getWhoLikedMe(),
      getIgnoredProfiles(),
    ]);
    
    if (favResult.success) setFavorites(favResult.favorites as unknown as FavoriteItem[]);
    if (likedResult.success) setLikedBy(likedResult.likedBy as unknown as LikedByItem[]);
    if (ignoredResult.success) setIgnored(ignoredResult.ignored as unknown as IgnoredItem[]);
    setLoading(false);
  }

  const handleRemoveFavorite = async (profileId: string, favoriteId: string) => {
    setActionLoading(favoriteId);
    const result = await toggleFavorite(profileId);
    if (result.success) {
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    }
    setActionLoading(null);
  };

  const handleRemoveIgnored = async (targetUserId: string, ignoredId: string) => {
    setActionLoading(ignoredId);
    const result = await removeFromIgnored(targetUserId);
    if (result.success) {
      setIgnored(prev => prev.filter(i => i.id !== ignoredId));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
        <p className="mt-4 text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">পছন্দ ও তালিকা</h1>
        <p className="text-gray-500 mt-1">আপনার পছন্দের প্রোফাইল এবং উপেক্ষা তালিকা</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">পছন্দ</span> ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="likedMe" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">আমাকে পছন্দ</span> ({likedBy.length})
          </TabsTrigger>
          <TabsTrigger value="ignored" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            <span className="hidden sm:inline">উপেক্ষিত</span> ({ignored.length})
          </TabsTrigger>
        </TabsList>

        {/* Favorites Tab */}
        <TabsContent value="favorites">
          {favorites.length === 0 ? (
            <EmptyState 
              icon={<Star className="h-12 w-12 text-gray-300" />}
              title="কোনো পছন্দ নেই"
              description="প্রোফাইল ব্রাউজ করুন এবং পছন্দে যোগ করুন"
              actionHref="/browse"
              actionLabel="প্রোফাইল খুঁজুন"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((fav) => {
                const profile = fav.profile?.profile;
                if (!profile) return null;
                return (
                  <ProfileCard 
                    key={fav.id}
                    profile={profile}
                    actionLoading={actionLoading === fav.id}
                    onRemove={() => handleRemoveFavorite(profile.id, fav.id)}
                    removeLabel="পছন্দ থেকে সরান"
                    removeIcon={<Trash2 className="h-4 w-4" />}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Who Liked Me Tab */}
        <TabsContent value="likedMe">
          {likedBy.length === 0 ? (
            <EmptyState 
              icon={<Heart className="h-12 w-12 text-gray-300" />}
              title="কেউ এখনো পছন্দ করেনি"
              description="আপনার প্রোফাইল সম্পূর্ণ করুন এবং অপেক্ষা করুন"
              actionHref="/dashboard/profile"
              actionLabel="প্রোফাইল সম্পাদনা"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {likedBy.map((item) => {
                const profile = item.user?.profile;
                if (!profile) return null;
                return (
                  <ProfileCard 
                    key={item.id}
                    profile={profile}
                    showBadge
                    badgeText="আপনাকে পছন্দ করেছে"
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Ignored Tab */}
        <TabsContent value="ignored">
          {ignored.length === 0 ? (
            <EmptyState 
              icon={<Ban className="h-12 w-12 text-gray-300" />}
              title="উপেক্ষা তালিকা খালি"
              description="উপেক্ষিত প্রোফাইল ব্রাউজে দেখা যাবে না"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ignored.map((item) => {
                const profile = item.profile?.profile;
                const targetUserId = item.profile?.id;
                if (!profile || !targetUserId) return null;
                return (
                  <ProfileCard 
                    key={item.id}
                    profile={profile}
                    actionLoading={actionLoading === item.id}
                    onRemove={() => handleRemoveIgnored(targetUserId, item.id)}
                    removeLabel="উপেক্ষা থেকে সরান"
                    removeIcon={<X className="h-4 w-4" />}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  actionHref, 
  actionLabel 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="mx-auto mb-4">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        {actionHref && actionLabel && (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileCard({
  profile,
  actionLoading,
  onRemove,
  removeLabel,
  removeIcon,
  showBadge,
  badgeText,
}: {
  profile: ProfileData;
  actionLoading?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  removeIcon?: React.ReactNode;
  showBadge?: boolean;
  badgeText?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/profile/${profile.id}`}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all">
              {profile.photos?.[0] ? (
                <img src={profile.photos[0].url} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-green-700" />
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${profile.id}`} className="hover:underline">
              <p className="font-semibold text-gray-900 truncate">{profile.displayName || 'অজানা'}</p>
            </Link>
            {profile.oderId && (
              <p className="text-xs text-green-600 font-medium">{profile.oderId}</p>
            )}
            <p className="text-sm text-gray-500">
              {calcAge(profile.dateOfBirth)}
              {profile.gender === 'MALE' ? ' • পুরুষ' : profile.gender === 'FEMALE' ? ' • মহিলা' : ''}
            </p>
            
            <div className="mt-2 space-y-1">
              {(profile.division || profile.district) && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span>{[profile.district, profile.division].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {profile.education && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <GraduationCap className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{profile.education}</span>
                </div>
              )}
            </div>

            {showBadge && badgeText && (
              <Badge variant="secondary" className="mt-2 text-xs bg-pink-100 text-pink-700">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                {badgeText}
              </Badge>
            )}
          </div>
        </div>

        {/* Remove Button */}
        {onRemove && (
          <div className="mt-3 pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={onRemove}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                removeIcon
              )}
              <span className="ml-2">{removeLabel}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
