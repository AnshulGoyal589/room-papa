// src/app/(protected)/admin/addProperty/page.tsx

"use client";

import { useForm, FormProvider } from 'react-hook-form';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExtendedProperty } from '@/lib/mongodb/models/Components';
import { PropertyType } from '@/types/property';
import PropertyForm from '@/components/AddItem/Property/PropertyForm';

const initialPropertyData: ExtendedProperty = {
  title: '',
  description: '',
  type: 'Hotel' as PropertyType,
  location: { address: '', city: '', state: '', country: '' },
  costing: { price: 0, discountedPrice: 0, currency: 'INR' },
  rooms: 0,
  categoryRooms: [],
  amenities: [],
  accessibility: [],
  roomAccessibility: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [],
  facilities: [],
  bedPreference: [],
  offers: [],
  reservationPolicy: [],
  brands: [],
  roomFacilities: [],
  propertyRating: 0,
  priority: 1000,
  googleMaps: '',
  houseRules: {
    checkInTime: '',
    checkOutTime: '',
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
    additionalRules: [],
  },
};

export default function AddPropertyPage() {
  const { user } = useUser();
  const router = useRouter();

  const methods = useForm<ExtendedProperty>({
    defaultValues: initialPropertyData,
  });

  const { formState: { isSubmitting } } = methods;

  const onSubmit = async (data: ExtendedProperty) => {
    if (!user?.id) {
        alert('User authentication is required to submit.');
        return;
    }

    try {
      const newItem = {
        ...data,
        userId: user.id,
      };
      
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save property');
      }
      
      router.push('/admin/dashboard');

    } catch (error) {
      console.error('Error submitting property form:', error);
      alert(`There was an error submitting the property: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10 overflow-y-auto p-1 pr-4">
        
        <div className="pt-6 mt-8 ml-16 flex justify-start items-center gap-4">
          <Link href="/manager/dashboard">
            <Button type="button" variant="outline" className="px-8 py-2 text-lg">
              Go Back To Dashboard
            </Button>
          </Link>
        </div>

        <PropertyForm />

         <div className="pt-6 m-8 flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !user}
            className="px-8 py-2 text-lg"
          >
            {isSubmitting ? 'Saving Property...' : 'Save Property Details'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}