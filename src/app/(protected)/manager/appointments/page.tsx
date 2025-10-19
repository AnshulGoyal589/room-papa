import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AppointmentsClientView from './AppointmentsClientView';
import { fetchManagerBookings } from '@/lib/data/booking';
import { userRole } from '@/lib/data/auth';

export const metadata: Metadata = {
  title: 'Manager Appointments | Room Papa',
  description: 'View and manage all your upcoming and past bookings for your listings.',
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


async function ManagerBookings(userId: string, type: string, searchTerm: string) {
  try {

    const managerBookings = await fetchManagerBookings(userId, type, searchTerm );
    if (!managerBookings) {
      return [];
    }

    return managerBookings;
  } catch (error) {
    console.error('Failed to fetch manager bookings:', error);
    return [];
  }
}


export default async function ManagerAppointmentsPage({ searchParams }: PageProps ) {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'manager') {
    redirect('/');
  }
  
  const resolvedSearchParams = await searchParams;
  
  const currentType = String(resolvedSearchParams.type || 'all');
  const currentSearch = String(resolvedSearchParams.search || '');

  const bookings = await ManagerBookings(userId ?? '', currentType, currentSearch);

  return (
    <AppointmentsClientView
      initialBookings={bookings}
      currentFilters={{ type: currentType, search: currentSearch }}
    />
  );
}