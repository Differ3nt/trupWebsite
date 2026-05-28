'use client';
import { useSession, signIn } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface AuthGateProps {
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function AuthGate({ children, message = 'Zaloguj się, aby zobaczyć pełne informacje', className }: AuthGateProps) {
  const { status } = useSession();

  if (status === 'authenticated') return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className={cn('min-h-[400px] flex items-center justify-center', className)}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden min-h-[400px] flex flex-col', className)}>
      <div className="flex-1 filter blur-[8px] grayscale pointer-events-none select-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10 p-6 text-center">
        <div className="bg-surface-container-low border border-outline-variant/30 p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
              <Lock size={32} className="text-primary" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Dostęp Ograniczony</p>
          <h3 className="font-display font-black text-2xl uppercase tracking-tighter mb-4 text-on-surface">
            Tylko dla członków
          </h3>
          <p className="text-xs text-on-surface-variant mb-8 leading-relaxed font-medium">{message}</p>
          <Button onClick={() => signIn('google')} fullWidth>
            Zaloguj się przez Google
          </Button>
        </div>
      </div>
    </div>
  );
}
