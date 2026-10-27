import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes - no auth required
  // /browse and /profile/[id] are public for discovery
  if (pathname.startsWith('/browse') || pathname.match(/^\/profile\/[^/]+$/)) {
    return NextResponse.next();
  }

  // Protect user dashboard pages - must be logged in
  if ((pathname.startsWith('/dashboard') || 
       pathname.startsWith('/connections') || pathname.startsWith('/messages') || 
       pathname.startsWith('/credits') || pathname.startsWith('/favorites') ||
       pathname.startsWith('/settings')) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect /admin/* - must be logged in AND have role ADMIN
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/browse/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/connections/:path*',
    '/messages/:path*',
    '/credits/:path*',
    '/favorites/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
