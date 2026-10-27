import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Protect user pages - must be logged in
  if ((pathname.startsWith('/profile') || pathname.startsWith('/browse') || 
       pathname.startsWith('/connections') || pathname.startsWith('/messages') || 
       pathname.startsWith('/credits')) && !isLoggedIn) {
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
    '/profile/:path*',
    '/browse/:path*',
    '/connections/:path*',
    '/messages/:path*',
    '/credits/:path*',
    '/admin/:path*',
  ],
};
