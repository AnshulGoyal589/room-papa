import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BookingDetails } from '@/lib/mongodb/models/Booking';
import AppointmentsClientView from './AppointmentsClientView';

export const metadata: Metadata = {
  title: 'Manager Appointments | Room Papa',
  description: 'View and manage all your upcoming and past bookings for your listings.',
};

type PageProps = {
  // Typing searchParams as a promise as requested
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ITEMS_PER_PAGE = 10;

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
// Fetches both the paginated bookings and the total count in parallel.
async function fetchManagerBookings(userId: string, { type, searchTerm, page }: { type: string, searchTerm: string, page: number }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Build query params for the API
    const listParams = new URLSearchParams({
      ownerId: userId,
      limit: String(ITEMS_PER_PAGE),
      skip: String(skip),
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    if (type !== 'all') listParams.append('type', type);
    if (searchTerm) listParams.append('searchTerm', searchTerm);
    
    // The count params should mirror the list params to get an accurate total
    const countParams = new URLSearchParams(listParams);
    countParams.delete('limit');
    countParams.delete('skip');
    
    // Fetch bookings and total count in parallel
    const bookingsPromise = fetch(`${baseUrl}/api/bookings/manager?${listParams.toString()}`, { cache: 'no-store' });
    const countPromise = fetch(`${baseUrl}/api/bookings/manager/count?${countParams.toString()}`, { cache: 'no-store' });

    const [bookingsRes, countRes] = await Promise.all([bookingsPromise, countPromise]);

    if (!bookingsRes.ok) throw new Error('Failed to fetch bookings list');
    
    const bookings: BookingDetails[] = await bookingsRes.json();
    let totalPages = 1;
    if (countRes.ok) {
      const { count } = await countRes.json();
      totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    }
    
    return { bookings, totalPages };

  } catch (error) {
    console.error('Failed to fetch manager bookings on server:', error);
    return { bookings: [], totalPages: 1 };
  }
}


// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function ManagerAppointmentsPage({ searchParams }: PageProps ) {

  const { userId } = await auth();

  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const resolvedSearchParams = await searchParams;
  // 1. Read filter and pagination state from URL search params.
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const currentType = String(resolvedSearchParams.type || 'all');
  const currentSearch = String(resolvedSearchParams.search || '');

  // 2. Fetch the specific data needed for this page render.
  const { bookings, totalPages } = await fetchManagerBookings(userId, {
    page: currentPage,
    type: currentType,
    searchTerm: currentSearch,
  });
  
  // 3. Pass initial data and state to the Client Component for rendering.
  return (
    <AppointmentsClientView
      initialBookings={bookings}
      totalPages={totalPages}
      currentPage={currentPage}
      currentFilters={{ type: currentType, search: currentSearch }}
    />
  );
}