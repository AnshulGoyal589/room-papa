import React from 'react';
import HeroSection from '@/components/customer/HomePage/HeroSection';
import PopularDestinations from '@/components/customer/HomePage/PopularDestinations';
import WhyChooseUs from '@/components/customer/HomePage/WhyChooseUs';
import QuickTripPlanner from '@/components/customer/HomePage/QuickTripPlanner';
import UniqueProperties from '@/components/customer/HomePage/UniqueProperties';
import PropertyTypes from '@/components/customer/HomePage/PropertyTypes';
import WeekendDeals from '@/components/customer/HomePage/WeekendDeals';
import ExploreIndia from '@/components/customer/HomePage/ExploreIndia';
// import { currentUser } from '@clerk/nextjs/server'


export default async function Dashboard() {
  // const user = await currentUser();
  // console.log(user);
  return (
    <div className="min-h-screen bg-gray-50">
      
      <HeroSection />

      <QuickTripPlanner />
      
      <PopularDestinations />
      
      <UniqueProperties />
      
      <PropertyTypes />
      
      <WeekendDeals />
      
      <ExploreIndia />
      
      <WhyChooseUs />
      
    </div>
  );
}