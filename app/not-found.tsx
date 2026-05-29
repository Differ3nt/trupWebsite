import Link from 'next/link';

// Global 404 for paths outside any valid locale prefix. Self-contained because
// the root layout (app/layout.tsx) is a passthrough — see that file. Localized
// 404s with full site chrome live at app/[locale]/not-found.tsx.
export default function GlobalNotFound() {
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
          <h1 style={{ fontSize: '4rem', margin: '0 0 0.5rem', letterSpacing: '-0.05em' }}>404</h1>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Strona nie istnieje.</p>
          <Link href="/pl" style={{ color: '#8ED081', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
            Wróć do strony głównej
          </Link>
        </div>
      </body>
    </html>
  );
}
