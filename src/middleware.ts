import { auth } from '@/auth';

export default auth((req) => {
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    
    // Auto-detect protocol: if client connected via HTTP, redirect via HTTP.
    // If behind a proxy, check the standard X-Forwarded-Proto header first.
    const forwardedProto = req.headers.get('x-forwarded-proto');
    if (forwardedProto === 'http' || forwardedProto === 'https') {
      url.protocol = forwardedProto + ':';
    } else {
      // Direct access (no proxy) - match the protocol of the incoming request URL
      const isHttps = req.url.startsWith('https:');
      url.protocol = isHttps ? 'https:' : 'http:';
    }
    
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboard',
  ],
};
