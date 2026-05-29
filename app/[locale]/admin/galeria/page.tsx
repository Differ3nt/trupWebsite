import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminGalleryClient } from './AdminGalleryClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function AdminGalleryPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');

  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader title={t('galeryPageTitle')} category={t('galeryPageCategory')} />
      <AdminGalleryClient />
    </div>
  );
}
