import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AppointmentsClientView from './AppointmentsClientView';
import { fetchAdminBookings } from '@/lib/data/booking';
import { userRole } from '@/lib/data/auth';

export const metadata: Metadata = {
  title: 'Admin Appointments | Room Papa',
  description: 'View and manage all your upcoming and past bookings for your listings.',
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


async function AdminBookings(type: string, searchTerm: string) {
  try {

    const adminBookings = await fetchAdminBookings(type, searchTerm );
    if (!adminBookings) {
      return [];
    }

    return adminBookings;
  } catch (error) {
    console.error('Failed to fetch admin bookings:', error);
    return [];
  }
}


export default async function AdminAppointmentsPage({ searchParams }: PageProps ) {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'admin') {
    redirect('/');
  }
  
  const resolvedSearchParams = await searchParams;
  
  const currentType = String(resolvedSearchParams.type || 'all');
  const currentSearch = String(resolvedSearchParams.search || '');

  const bookings = await AdminBookings(currentType, currentSearch);

  return (
    <AppointmentsClientView
      initialBookings={bookings}
      currentFilters={{ type: currentType, search: currentSearch }}
    />
  );
}