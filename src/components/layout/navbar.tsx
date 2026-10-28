'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Heart, Menu, X, User, LogOut, CreditCard, Star, Link2, MessageCircle, ChevronDown, LayoutGrid, ClipboardCheck, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageToggle } from '@/components/theme/language-toggle';
import { NotificationBell } from '@/components/notifications/notification-bell';

const navLinks = [
  { href: '/', label: 'home' },
  { href: '/browse', label: 'biodatas' },
  { href: '/about', label: 'about' },
  { href: '/faq', label: 'faq' },
  { href: '/guide', label: 'guide' },
  { href: '/contact', label: 'contact' },
] as const;

const accountLinks = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutGrid },
  { href: '/profile', label: 'myBiodata', icon: User },
  { href: '/favorites', label: 'favorites', icon: Star },
  { href: '/connections/received', label: 'connections', icon: Link2 },
  { href: '/messages', label: 'messages', icon: MessageCircle },
  { href: '/credits', label: 'credits', icon: CreditCard },
] as const;

// Admins have no member biodata, so they get admin shortcuts instead
const adminLinks = [
  { href: '/admin/dashboard', label: 'adminDashboard', icon: LayoutGrid },
  { href: '/admin/biodatas?status=PENDING_APPROVAL', label: 'reviewQueue', icon: ClipboardCheck },
  { href: '/admin/biodatas', label: 'allBiodatas', icon: FileText },
  { href: '/admin/users', label: 'users', icon: Users },
] as const;

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close menus whenever the route changes
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  // Close the account dropdown on outside click
  React.useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [dropdownOpen]);

  const user = status === 'authenticated' ? session?.user : null;
  const menuLinks = user?.role === 'ADMIN' ? adminLinks : accountLinks;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-700 fill-green-700" />
            <span className="text-xl font-bold text-green-700">{tc('brand')}</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(pathname, link.href)
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-600 hover:text-green-700'
                }`}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center gap-2 min-w-[180px] justify-end">
            <ThemeToggle />
            <LanguageToggle />
            {user && <NotificationBell />}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700 max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    {menuLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Icon className="h-4 w-4" />
                        {t(label)}
                      </Link>
                    ))}
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : status === 'loading' ? null : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">{t('createBiodata')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: toggles + hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
            {user && <NotificationBell />}
            <button
              className="p-2 rounded-md text-gray-600 hover:text-green-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t('menu')}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 text-sm rounded-md ${
                  isActive(pathname, link.href)
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {t(link.label)}
              </Link>
            ))}
            {user && (
              <>
                <hr className="my-2 border-gray-200" />
                {menuLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md"
                  >
                    <Icon className="h-4 w-4" />
                    {t(label)}
                  </Link>
                ))}
              </>
            )}
            <div className="px-4 pt-2 flex flex-col gap-2">
              {user ? (
                <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
                  {t('logout')}
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">{t('login')}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">{t('createBiodata')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
