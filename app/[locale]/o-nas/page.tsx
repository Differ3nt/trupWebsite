import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Mountain } from '@/components/icons';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const values = [
    t('value1'),
    t('value2'),
    t('value3'),
    t('value4'),
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        category={t('pageCategory')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        {/* Left Column: Text and Values */}
        <div className="space-y-6">
          <p className="text-on-surface-variant leading-relaxed font-medium">
            {t('introText1')}
          </p>

          <p className="text-on-surface-variant leading-relaxed font-medium">
            {t('introText2')}
          </p>

          {/* Values Section */}
          <div className="border-l-4 border-primary pl-6 mt-8">
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-on-surface mb-4">
              {t('valuesHeading')}
            </h3>
            <ul className="space-y-3">
              {values.map((value) => (
                <li key={value} className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Image Placeholder */}
        <div className="flex items-center justify-center">
          <div className="w-full h-[400px] bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
            <Mountain size={80} className="text-on-surface-variant/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
