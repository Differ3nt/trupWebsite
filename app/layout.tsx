import '@/lib/env'; // validate env vars at startup — throws with a clear message if anything is missing
import { Bebas_Neue, Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

const bebasNeue = Bebas_Neue({
  variable: '--font-display',
  weight: '400',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TRUP',
  description: 'Robimy to czego innym się nie chce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="pl" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body className="flex flex-col min-h-screen selection:bg-primary selection:text-surface">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16 md:pt-20">
            {children}
          </main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface-container-low)',
                color: 'var(--color-on-surface)',
                border: '1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent)',
                borderRadius: '0px',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                fontSize: '10px',
                letterSpacing: '0.1em',
                fontWeight: 'bold',
              },
            }}
          />
          <ConfirmationModal />
        </Providers>
      </body>
    </html>
  );
}
