import type { NextConfig } from 'next';

const securityHeaders = [
  // Only send via HTTPS; include subdomains; preload-eligible.
  // max-age = 2 years (recommended minimum for preload lists).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Prevent the site from being embedded in an iframe on other origins.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Disable MIME-type sniffing — browser must honour the declared Content-Type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send the full URL only to same-origin requests; only the origin to cross-origin HTTPS.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features that TRUP does not use.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
  },
  // Defense-in-depth: tell browsers not to perform XSS filtering (modern browsers ignore
  // X-XSS-Protection anyway; CSP is the real protection via middleware.ts).
  { key: 'X-XSS-Protection', value: '0' },
];

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default config;
