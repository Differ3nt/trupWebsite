import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

const generateNonce = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

const buildCsp = (nonce: string) =>
  [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.tile.openstreetmap.org`,
    `connect-src 'self'`,
    `frame-src 'self' https://*.mapy.cz https://frame.mapy.cz`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

export default auth((req) => {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
});

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
};
