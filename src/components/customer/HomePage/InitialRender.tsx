
// import HeroSection from '@/components/customer/HomePage/HeroSection';
import PopularDestinations from '@/components/customer/HomePage/PopularDestinations';
import WhyChooseUs from '@/components/customer/HomePage/WhyChooseUs';
import QuickTripPlanner from '@/components/customer/HomePage/QuickTripPlanner';
import UniqueProperties from '@/components/customer/HomePage/UniqueProperties';
import PropertyTypes from '@/components/customer/HomePage/PropertyTypes';
// import WeekendDeals from '@/components/customer/HomePage/WeekendDeals';
import ExploreIndia from '@/components/customer/HomePage/ExploreIndia';


export default async function InitialRender() {

  
  return (
      <>
        <QuickTripPlanner />
        <PopularDestinations />
        <UniqueProperties />
        <PropertyTypes />
        <ExploreIndia /> 
        <WhyChooseUs />
      </>
  );
}