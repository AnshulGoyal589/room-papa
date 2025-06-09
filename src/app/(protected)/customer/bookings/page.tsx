import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBookingRepository } from '@/lib/booking-db';
import BookingsList from '@/components/booking/BookingsList';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Bookings',
  description: 'View and manage all your past and upcoming bookings.',
};

// This is a Server Component, so we can use `async`
export default async function MyBookingsPage() {
    // 1. Authenticate the user on the server
    const { userId } = await auth();

    if (!userId) {
        // Redirect to sign-in page if not authenticated
        redirect('/customer/dashboard');
    }

    // 2. Fetch bookings for the current user using the repository
    const bookingRepository = await getBookingRepository();
    console.log('Fetching bookings for user:', userId);
    
    const userBookings = await bookingRepository.queryBookings({
        userId: userId,
        sortBy: 'bookingDetails.checkIn', // Sort by check-in date
        sortOrder: 'desc', // Show most recent first
    });
    
    // We need to serialize the data because `_id` and `Date` objects
    // cannot be passed directly from Server to Client Components.
    const serializedBookings = JSON.parse(JSON.stringify(userBookings));

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
                    <p className="text-md text-gray-600 mt-1">
                        Here you can find all your upcoming and past trips.
                    </p>
                </div>

                <Suspense fallback={<p>Loading your bookings...</p>}>
                   <BookingsList initialBookings={serializedBookings} />
                </Suspense>
            </div>
        </div>
    );
}