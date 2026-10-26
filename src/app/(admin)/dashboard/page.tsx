export const dynamic = 'force-dynamic';
import { getAdminStats, listPendingProfiles } from '@/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Flag, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  const [statsResult, profilesResult] = await Promise.all([
    getAdminStats(),
    listPendingProfiles(),
  ]);

  const stats = statsResult.success ? statsResult.stats : { totalUsers: 0, pendingProfiles: 0, openReports: 0 };
  const pendingProfiles = profilesResult.success ? (profilesResult.profiles ?? []) : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ড্যাশবোর্ড</h1>
        <p className="text-gray-500 mt-1">সার্বিক পরিসংখ্যান ও সাম্প্রতিক কার্যক্রম</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">মোট ব্যবহারকারী</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">পর্যালোচনাধীন প্রোফাইল</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.pendingProfiles ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Flag className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">খোলা রিপোর্ট</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.openReports ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Profiles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>পর্যালোচনাধীন প্রোফাইল</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/profiles">সকল দেখুন</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendingProfiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">কোনো পর্যালোচনাধীন প্রোফাইল নেই।</p>
          ) : (
            <div className="space-y-3">
              {pendingProfiles.slice(0, 5).map((profile) => (
                <div key={profile.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{profile.displayName ?? 'অজানা'}</p>
                    <p className="text-sm text-gray-500">{(profile as { user?: { email: string } }).user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">পর্যালোচনাধীন</Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/profiles?id=${profile.id}`}>দেখুন</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
