'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Global error boundary — catches errors thrown in the root layout itself, where
// the normal app/[locale]/error.tsx boundary cannot run. It must render its own
// <html>/<body> and is intentionally self-contained (no i18n provider, no
// design tokens) because it sits above the locale layout.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#37392E',
          color: '#f9f9f8',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem', letterSpacing: '-0.04em' }}>
            Błąd aplikacji
          </h1>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
            Coś poszło nie tak. Spróbuj ponownie za chwilę.
          </p>
          <a
            href="/pl"
            style={{
              color: '#8ED081',
              textDecoration: 'underline',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.85rem',
            }}
          >
            Wróć do strony głównej
          </a>
        </div>
      </body>
    </html>
  );
}
