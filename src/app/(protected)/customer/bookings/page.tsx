import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBookingRepository } from '@/lib/booking-db';
import BookingsList from '@/components/booking/BookingsList';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import BookingsListSkeleton from '@/components/booking/BookingsListSkeleton';
export const metadata: Metadata = {
  title: 'My Bookings',
  description: 'View and manage all your past and upcoming bookings.',
};

async function fetchUserBookings(userId: string) {
    try {
        const bookingRepository = await getBookingRepository();
        const userBookings = await bookingRepository.queryBookings({
            userId: userId,
            sortBy: 'bookingDetails.checkIn',
            sortOrder: 'desc',
        });
        
        return JSON.parse(JSON.stringify(userBookings));
    } catch (error) {
        console.error("Failed to fetch user bookings:", error);
        return [];
    }
}

export default async function MyBookingsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const serializedBookings = await fetchUserBookings(userId);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Bookings</h1>
                    <p className="text-md text-gray-600 dark:text-gray-400 mt-1">
                        Here you can find all your upcoming and past trips.
                    </p>
                </div>

                {/* --- IMPROVEMENT: Handle the Empty State --- */}
                {serializedBookings.length === 0 ? (
                    <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-12 shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No Bookings Found</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            You haven&apos;t made any bookings yet. Let&apos;s find your next adventure!
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/">Explore Stays</Link>
                        </Button>
                    </div>
                ) : (
                    /* --- IMPROVEMENT: Use a Skeleton Loader in Suspense --- */
                    <Suspense fallback={<BookingsListSkeleton />}>
                       <BookingsList initialBookings={serializedBookings} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}