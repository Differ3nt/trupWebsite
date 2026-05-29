import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { authConfig } from '@/lib/auth.config';
import { routing } from '@/i18n/routing';

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

const generateNonce = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

const buildCsp = (nonce: string) =>
  [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.tile.openstreetmap.org`,
    `connect-src 'self'`,
    `frame-src 'self' https://www.google.com https://*.mapy.cz https://frame.mapy.cz`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

// Composition: NextAuth wrapper (keeps req.auth available for future route
// protection) -> next-intl locale routing -> CSP nonce. NOTE: forwarding the
// nonce into the rendered request for next-intl rewrites needs runtime
// verification at Phase 0 deployment (see REBUILD_PLAN §6.13 / Phase 0 CSP).
export default auth((req) => {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // next-intl resolves locale routing first (e.g. '/' -> '/pl', cookie handling).
  const intlResponse = handleI18nRouting(req);

  // If next-intl issued a redirect or rewrite, keep it and just attach the CSP.
  const isRedirect = intlResponse.headers.has('location');
  const isRewrite = intlResponse.headers.has('x-middleware-rewrite');
  if (isRedirect || isRewrite) {
    intlResponse.headers.set('Content-Security-Policy', csp);
    return intlResponse;
  }

  // Pass-through: re-issue forwarding the nonce on the request headers so
  // Next.js can stamp its own <script> tags (required by 'strict-dynamic'),
  // and carry over any cookie next-intl set (the NEXT_LOCALE cookie).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  const setCookie = intlResponse.headers.get('set-cookie');
  if (setCookie) response.headers.set('set-cookie', setCookie);
  return response;
});

export const config = {
  // Skip API, Next internals, static files and uploads. Everything else is localized.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)'],
};
