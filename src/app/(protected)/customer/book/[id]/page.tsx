import { Suspense } from 'react';
import { Metadata } from 'next';
import ReservationForm from '@/components/booking/ReservationForm';

export const metadata: Metadata = {
  title: 'Complete Your Booking',
  description: 'Enter your details and confirm your payment to complete the reservation.',
};

export default async function BookPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const param = await params;
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003c95] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your reservation...</p>
                </div>
            </div>
        }>
            <ReservationForm propertyId={param.id} />
        </Suspense>
    );
}