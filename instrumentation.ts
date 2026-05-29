import * as Sentry from '@sentry/nextjs';

// Next.js instrumentation hook — the modern, recommended place to initialise the
// Sentry SDK on the server and edge runtimes (replaces importing
// sentry.server.config.ts / sentry.edge.config.ts directly).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture React Server Component / Route Handler render errors in Sentry.
export const onRequestError = Sentry.captureRequestError;
