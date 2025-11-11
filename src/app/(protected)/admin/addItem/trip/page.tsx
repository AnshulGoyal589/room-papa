"use client"; // This is crucial for using hooks

import { useForm, FormProvider } from 'react-hook-form';
import { Trip } from '@/lib/mongodb/models/Trip';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TripForm from '@/components/AddItem/Trip/TripForm';

// Your initial data remains the same
const initialTripData: Trip = {
  title: '',
  description: '',
  type: 'Domestic',
  destination: { city: '', state: '', country: '' },
  costing: { price: 0, discountedPrice: 0, currency: 'INR' },
  daysCount: 0,
  pickupService: false,
  activities: [],
  itinerary: [],
  hotels: [],
  amenities: [],
  accessibility: [],
  brands: [],
  facilities: [],
  funThingsToDo: [],
  meals: [],
  popularFilters: [],
  reservationPolicy: [],
  availability: [],
  review: [],
  totalRating: 0,
};

export default function AddTripPage() {
  const { user } = useUser();
  const router = useRouter();

  // 1. Initialize React Hook Form here
  const methods = useForm<Trip>({
    defaultValues: initialTripData,
  });

  // Get formState for disabling the button while submitting
  const { formState: { isSubmitting } } = methods;

  // 2. Your submission logic is moved here
  const onSubmit = async (data: Trip) => {
    if (!user?.id) {
        alert('User authentication is required to submit.');
        return;
    }

    try {
      // The `data` argument is the complete, validated form data from React Hook Form
      const newItem = {
        ...data,
        userId: user.id,
      };
      
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save item');
      }
      
      // On success, redirect
      router.push('/admin/dashboard');

    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`There was an error submitting the form: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  return (
    // 3. Wrap your entire form in the FormProvider
    <FormProvider {...methods}>
      {/* 4. Use the RHF handleSubmit method, which handles validation */}
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10 overflow-y-auto p-1 pr-4">
        
        {/* TripForm is now a clean child component */}
        <TripForm />

        {/* 5. The submit button is now part of the parent form */}
        <div className="pt-6 mt-8 flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !user}
            className="px-8 py-2 text-lg"
          >
            {isSubmitting ? 'Saving Package...' : 'Save Trip Package'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}