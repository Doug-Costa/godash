import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  if (!req.auth) {
    const rawForwardedProto = req.headers.get('x-forwarded-proto');
    const forwardedProto = rawForwardedProto
      ? rawForwardedProto.split(',')[0].trim()
      : (req.url.startsWith('https:') ? 'https' : 'http');

    const rawForwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const forwardedHost = rawForwardedHost ? rawForwardedHost.split(',')[0].trim() : null;

    if (forwardedHost) {
      const redirectUrl = new URL('/login', `${forwardedProto}://${forwardedHost}`);
      return NextResponse.redirect(redirectUrl);
    }

    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.protocol = forwardedProto + ':';
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboard',
  ],
};
