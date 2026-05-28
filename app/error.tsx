'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from '@/components/icons';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-2xl text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
            <AlertTriangle size={48} className="text-on-surface-variant" />
          </div>
        </div>

        {/* Label */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Błąd aplikacji</p>
          <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tighter text-on-surface mb-4">
            Coś poszło nie tak
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed font-medium">
            Napotkaliśmy nieoczekiwany problem. Spróbuj ponownie lub wróć do strony głównej.
          </p>
        </div>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-surface-container-highest border border-outline-variant/30 p-6 text-left">
            <p className="text-xs font-mono text-on-surface-variant break-words">{error.message}</p>
            {error.digest && <p className="text-xs font-mono text-on-surface-variant/60 mt-2">Digest: {error.digest}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="primary" size="lg">
            Spróbuj ponownie
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Wróć do strony głównej</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
