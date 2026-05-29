import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Mountain } from '@/components/icons';

export default function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-2xl text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
            <Mountain size={48} className="text-on-surface-variant" />
          </div>
        </div>

        {/* Label */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Strona nie znaleziona</p>
          <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tighter text-on-surface mb-4">
            404
          </h1>
          <p className="text-xl text-on-surface-variant leading-relaxed font-medium">Strona nie istnieje</p>
        </div>

        {/* Message */}
        <p className="text-on-surface-variant font-medium max-w-md mx-auto">
          Szukana strona nie istnieje lub została przeniesiona. Sprawdź, czy adres URL jest poprawny, lub wróć do strony głównej.
        </p>

        {/* Action */}
        <div>
          <Button asChild variant="primary" size="lg">
            <Link href="/">Wróć do strony głównej</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
