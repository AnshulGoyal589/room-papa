// FILE: components/customer/HomePage/InitialRender.tsx
// ROLE: A server component that organizes homepage sections and passes props down.

import WhyChooseUs from '@/components/customer/HomePage/WhyChooseUs';
import QuickTripPlanner from '@/components/customer/HomePage/QuickTripPlanner';
import UniqueProperties from '@/components/customer/HomePage/UniqueProperties';
import PropertyTypes from '@/components/customer/HomePage/PropertyTypes';
import ExploreIndia from '@/components/customer/HomePage/ExploreIndia';
import BookingOffers from './BookingOffers';
import RecentSearches from './RecentSearches';
import { Property } from '@/lib/mongodb/models/Property'; // Import your Property type

// Define the props it will receive from page.tsx
interface InitialRenderProps {
  initialUniqueProperties: Property[];
}

// NOTE: This component no longer needs to be `async` as it's not fetching data itself.
export default function InitialRender({ initialUniqueProperties }: InitialRenderProps) {
  return (
    <div className='max-w-7xl mx-auto'>
      <RecentSearches />
      <BookingOffers />
      <QuickTripPlanner />
      <ExploreIndia />
      <PropertyTypes />

      {/* Pass the properties data down to the component that needs it */}
      <UniqueProperties initialProperties={initialUniqueProperties} />
      
      <WhyChooseUs />
    </div>
  );
}