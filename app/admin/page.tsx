import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AdminClient } from './AdminClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader title="Panel Admina" category="Zarządzanie" />
      <AdminClient />
    </div>
  );
}
