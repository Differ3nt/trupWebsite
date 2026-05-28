import { headers } from 'next/headers';
import { Bebas_Neue, Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') || '';

  return (
    <html lang="pl" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
