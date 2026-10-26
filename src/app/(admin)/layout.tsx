export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Flag, Package } from 'lucide-react';

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { href: '/admin/profiles', label: 'প্রোফাইল', icon: FileText },
  { href: '/admin/users', label: 'ব্যবহারকারী', icon: Users },
  { href: '/admin/reports', label: 'রিপোর্ট', icon: Flag },
  { href: '/admin/packages', label: 'ক্রেডিট প্যাকেজ', icon: Package },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold text-green-400">অ্যাডমিন প্যানেল</h1>
          <p className="text-gray-400 text-xs mt-1">জীবনসাথী</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
