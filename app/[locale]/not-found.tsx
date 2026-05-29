import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Mountain } from '@/components/icons';

// NOTE: not-found.tsx does NOT receive `params` from Next.js, so we cannot read
// the locale from props (doing so throws "Cannot destructure 'locale'"). We let
// getTranslations resolve the locale from request context (falls back to the
// default locale during static prerender).
export default async function NotFoundPage() {
  const t = await getTranslations('errors');

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">{t('notFoundLabel')}</p>
          <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tighter text-on-surface mb-4">
            {t('notFoundTitle')}
          </h1>
          <p className="text-xl text-on-surface-variant leading-relaxed font-medium">{t('notFoundHeading')}</p>
        </div>

        {/* Message */}
        <p className="text-on-surface-variant font-medium max-w-md mx-auto">
          {t('notFoundDescription')}
        </p>

        {/* Action */}
        <div>
          <Button asChild variant="primary" size="lg">
            <Link href="/">{t('backHomeButton')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
