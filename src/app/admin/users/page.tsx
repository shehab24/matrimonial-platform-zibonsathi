'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { listAllUsers, suspendUser, restoreUser } from '@/actions/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { GrantCreditsButton } from '@/components/admin/grant-credits-button';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isSuspended: boolean;
  emailVerified: string | null;
  createdAt: string;
  profile?: { status: string; displayName: string | null; oderId: string | null } | null;
  creditBalance?: { balance: number } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = q
    ? users.filter((u) =>
        [u.name, u.email, u.profile?.displayName, u.profile?.oderId].some((v) => v?.toLowerCase().includes(q)))
    : users;

  const setBalance = (userId: string, balance: number) =>
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, creditBalance: { balance } } : u)));

  const show = (result: Awaited<ReturnType<typeof listAllUsers>>) => {
    if (result.success) setUsers((result.users ?? []) as unknown as User[]);
    setIsLoading(false);
  };

  // Refreshes in place after an action; isLoading only covers the first load
  const load = async () => show(await listAllUsers());

  useEffect(() => { listAllUsers().then(show); }, []);

  const handleToggle = async (userId: string, isSuspended: boolean) => {
    const result = isSuspended ? await restoreUser(userId) : await suspendUser(userId);
    if (result.success) {
      toast({ variant: 'success', title: isSuspended ? 'অ্যাকাউন্ট পুনরুদ্ধার হয়েছে' : 'অ্যাকাউন্ট স্থগিত হয়েছে' });
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500">লোড হচ্ছে...</div>;

  return (
    <div>
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">ব্যবহারকারী</h1>
        <p className="text-gray-500 mt-1">মোট {users.length.toLocaleString('bn-BD')} জন ব্যবহারকারী</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নাম, ইমেইল বা বায়োডাটা নং দিয়ে খুঁজুন"
          className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">নাম / ইমেইল</th>
                  <th className="px-4 py-3 text-left text-gray-600">ভূমিকা</th>
                  <th className="px-4 py-3 text-left text-gray-600">প্রোফাইল অবস্থা</th>
                  <th className="px-4 py-3 text-left text-gray-600">অ্যাকাউন্ট</th>
                  <th className="px-4 py-3 text-left text-gray-600">সংযোগ ব্যালেন্স</th>
                  <th className="px-4 py-3 text-left text-gray-600">নিবন্ধন তারিখ</th>
                  <th className="px-4 py-3 text-left text-gray-600">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">কোনো ব্যবহারকারী পাওয়া যায়নি</td></tr>
                )}
                {visible.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.name ?? 'অজানা'}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                      {user.profile?.oderId && <p className="font-mono text-xs text-gray-400">{user.profile.oderId}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' ? 'অ্যাডমিন' : 'ব্যবহারকারী'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.profile ? (
                        <Badge variant={
                          user.profile.status === 'APPROVED' ? 'success' :
                          user.profile.status === 'PENDING_APPROVAL' ? 'warning' :
                          user.profile.status === 'REJECTED' ? 'destructive' : 'secondary'
                        }>
                          {user.profile.status === 'APPROVED' ? 'অনুমোদিত' :
                           user.profile.status === 'PENDING_APPROVAL' ? 'পর্যালোচনাধীন' :
                           user.profile.status === 'REJECTED' ? 'প্রত্যাখ্যাত' : 'খসড়া'}
                        </Badge>
                      ) : <span className="text-gray-400">নেই</span>}
                    </td>
                    <td className="px-4 py-3">
                      {user.isSuspended ? (
                        <Badge variant="destructive">স্থগিত</Badge>
                      ) : user.emailVerified ? (
                        <Badge variant="success">সক্রিয়</Badge>
                      ) : (
                        <Badge variant="secondary">যাচাই বাকি</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {(user.creditBalance?.balance ?? 0).toLocaleString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                      <GrantCreditsButton
                        userId={user.id}
                        userLabel={user.profile?.displayName ?? user.name ?? user.email}
                        onGranted={(balance) => setBalance(user.id, balance)}
                      />
                      {user.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant={user.isSuspended ? 'outline' : 'destructive'}
                          onClick={() => handleToggle(user.id, user.isSuspended)}
                        >
                          {user.isSuspended ? 'পুনরুদ্ধার' : 'স্থগিত'}
                        </Button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
