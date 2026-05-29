import type { ReactNode } from 'react';

// The real <html>/<body> shell lives in app/[locale]/layout.tsx so the lang
// attribute and the i18n provider are locale-aware. Next.js still requires a
// root layout, so this is an intentional passthrough — the locale layout owns
// the document.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
