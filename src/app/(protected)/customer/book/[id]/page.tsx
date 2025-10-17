import { Suspense } from 'react';
import { Metadata } from 'next';
import ReservationForm from '@/components/booking/ReservationForm';
import { getPropertyById } from '@/lib/mongodb/models/Property';
// import { useRouter } from 'next/router';

export const metadata: Metadata = {
  title: 'Complete Your Booking',
  description: 'Enter your details and confirm your payment to complete the reservation.',
};

export default async function BookPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const param = await params;
    // const router = useRouter();
    const property = await getPropertyById(param.id);
    if(!property) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Property not found</h2>
                    {/* <button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-[#003c95] text-white rounded-md hover:bg-[#003c95]">Find Properties</button> */}
                </div>
            </div>
        );
    }
    const plainProperty = JSON.parse(JSON.stringify(property));
    // console.log("Booking Property:", plainProperty);
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003c95] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your reservation...</p>
                </div>
            </div>
        }>
            <ReservationForm property={plainProperty} />
        </Suspense>
    );
}