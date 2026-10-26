export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect } from 'react';
import { listPendingProfiles, approveProfile, rejectProfile } from '@/actions/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, User } from 'lucide-react';

interface Profile {
  id: string;
  displayName: string | null;
  gender: string | null;
  division: string | null;
  district: string | null;
  education: string | null;
  occupation: string | null;
  prayerHabit: string | null;
  createdAt: string;
  user?: { email: string; name: string | null };
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const load = async () => {
    setIsLoading(true);
    const result = await listPendingProfiles();
    if (result.success) setProfiles((result.profiles ?? []) as unknown as Profile[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    const result = await approveProfile(id);
    if (result.success) {
      toast({ variant: 'success', title: 'প্রোফাইল অনুমোদিত হয়েছে' });
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason[id] || 'প্রোফাইল অনুমোদিত হয়নি।';
    const result = await rejectProfile(id, reason);
    if (result.success) {
      toast({ variant: 'success', title: 'প্রোফাইল প্রত্যাখ্যাত হয়েছে' });
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  if (isLoading) return <div className="p-8 text-gray-500">লোড হচ্ছে...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">পর্যালোচনাধীন প্রোফাইল</h1>
        <p className="text-gray-500 mt-1">{profiles.length} টি প্রোফাইল অপেক্ষমান</p>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
          <p>সকল প্রোফাইল পর্যালোচনা সম্পন্ন হয়েছে।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map(profile => (
            <Card key={profile.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <h3 className="font-semibold text-gray-900">{profile.displayName ?? 'অজানা'}</h3>
                      <Badge variant="secondary">{profile.gender === 'MALE' ? 'পুরুষ' : profile.gender === 'FEMALE' ? 'মহিলা' : ''}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                      <span>📧 {profile.user?.email}</span>
                      <span>📍 {[profile.district, profile.division].filter(Boolean).join(', ') || 'অজানা'}</span>
                      <span>🎓 {profile.education ?? 'অজানা'}</span>
                      <span>💼 {profile.occupation ?? 'অজানা'}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button size="sm" onClick={() => handleApprove(profile.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> অনুমোদন
                      </Button>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="প্রত্যাখ্যানের কারণ (ঐচ্ছিক)"
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                          value={rejectReason[profile.id] || ''}
                          onChange={e => setRejectReason(prev => ({ ...prev, [profile.id]: e.target.value }))}
                        />
                        <Button size="sm" variant="destructive" onClick={() => handleReject(profile.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> প্রত্যাখ্যান
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
