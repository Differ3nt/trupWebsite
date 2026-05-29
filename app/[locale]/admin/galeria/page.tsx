import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AdminGalleryClient } from './AdminGalleryClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function AdminGalleryPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader title="Galeria Admin" category="Zarządzanie mediami" />
      <AdminGalleryClient />
    </div>
  );
}
