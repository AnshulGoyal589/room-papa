
// import HeroSection from '@/components/customer/HomePage/HeroSection';
// import PopularDestinations from '@/components/customer/HomePage/PopularDestinations';
import WhyChooseUs from '@/components/customer/HomePage/WhyChooseUs';
import QuickTripPlanner from '@/components/customer/HomePage/QuickTripPlanner';
import UniqueProperties from '@/components/customer/HomePage/UniqueProperties';
import PropertyTypes from '@/components/customer/HomePage/PropertyTypes';
// import WeekendDeals from '@/components/customer/HomePage/WeekendDeals';
import ExploreIndia from '@/components/customer/HomePage/ExploreIndia';
import BookingOffers from './BookingOffers';
import RecentSearches from './RecentSearches';


export default async function InitialRender() {

  
  return (
      <div className='max-w-7xl mx-auto' >
        <RecentSearches/>
        <BookingOffers/>
        <QuickTripPlanner />
        <ExploreIndia /> 
        <PropertyTypes />
        {/* <PopularDestinations /> */}
        <UniqueProperties />
        <WhyChooseUs />
      </div>
  );
}