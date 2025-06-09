import { Suspense } from 'react';
import { Metadata } from 'next';
import ReservationForm from '@/components/booking/ReservationForm';

export const metadata: Metadata = {
  title: 'Complete Your Booking',
  description: 'Enter your details and confirm your payment to complete the reservation.',
};

// Add the 'async' keyword here
export default async function BookPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const param = await params; // Ensure params are awaited if they are async
    return (
        // Suspense boundary is good practice for pages with data fetching
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your reservation...</p>
                </div>
            </div>
        }>
            {/* This line now works correctly inside an async component */}
            <ReservationForm propertyId={param.id} />
        </Suspense>
    );
}