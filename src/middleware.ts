import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Logged-in users have no reason to see login/register - send them to the dashboard
  if ((pathname === '/login' || pathname === '/register') && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Public routes - no auth required
  // /browse and /profile/[id] are public for discovery (/biodata/[no] is outside the matcher, so public too)
  if (pathname.startsWith('/browse') || pathname.match(/^\/profile\/[^/]+$/)) {
    return NextResponse.next();
  }

  // Protect user dashboard pages - must be logged in
  if ((pathname === '/profile' ||
       pathname.startsWith('/connections') || pathname.startsWith('/dashboard') ||
       pathname.startsWith('/ignored') || pathname.startsWith('/liked-me') || pathname.startsWith('/messages') || 
       pathname.startsWith('/credits') || pathname.startsWith('/favorites') ||
       pathname.startsWith('/notifications') || pathname.startsWith('/settings') ||
       pathname.startsWith('/delete-biodata') || pathname.startsWith('/complete-account')) && !isLoggedIn) {
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
    '/login',
    '/register',
    '/browse/:path*',
    '/profile/:path*',
    '/connections/:path*',
    '/messages/:path*',
    '/credits/:path*',
    '/favorites/:path*',
    '/dashboard/:path*',
    '/ignored/:path*',
    '/liked-me/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/delete-biodata/:path*',
    '/complete-account/:path*',
    '/admin/:path*',
  ],
};
