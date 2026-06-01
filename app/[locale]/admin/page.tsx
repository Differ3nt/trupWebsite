import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminClient } from './AdminClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { prisma } from '@/lib/prisma';

export default async function AdminPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');

  const session = await getSession();
  if (!session) redirect('/');

  // Admins always get in. A non-admin is only allowed through when no admin
  // exists yet, so the first user can self-bootstrap via the banner. Once an
  // admin exists, regular members are redirected (don't expose the admin shell).
  if (session.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) redirect('/');
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader title={t('pageTitle')} category={t('pageCategory')} />
      <AdminClient />
    </div>
  );
}
