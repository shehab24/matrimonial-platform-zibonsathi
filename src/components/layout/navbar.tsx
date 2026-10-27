'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Heart, Menu, X, User, LogOut, Settings, CreditCard, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const navLinks = [
    { href: '/', label: 'হোম' },
    { href: '/browse', label: 'প্রোফাইল খুঁজুন' },
    { href: '/favorites', label: 'পছন্দ' },
    { href: '/dashboard/profile', label: 'আমার প্রোফাইল' },
    { href: '/dashboard/connections', label: 'সংযোগ' },
    { href: '/dashboard/credits', label: 'ক্রেডিট' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-700 fill-green-700" />
            <span className="text-xl font-bold text-green-700">জীবনসাথী</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-green-700 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {status === 'authenticated' && navLinks.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-green-700 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-md" />
            ) : status === 'authenticated' && session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700">{session.user.name}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      আমার প্রোফাইল
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Star className="h-4 w-4" />
                      পছন্দ তালিকা
                    </Link>
                    <Link
                      href="/dashboard/credits"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <CreditCard className="h-4 w-4" />
                      ক্রেডিট
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        অ্যাডমিন
                      </Link>
                    )}
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      লগআউট
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">লগইন</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">নিবন্ধন করুন</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2 flex flex-col gap-2">
              {status === 'authenticated' ? (
                <Button
                  variant="outline"
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                >
                  লগআউট
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>লগইন</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={() => setMenuOpen(false)}>নিবন্ধন করুন</Link>
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
