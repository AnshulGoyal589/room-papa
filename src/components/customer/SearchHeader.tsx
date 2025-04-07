'use client';

import React, { useState } from 'react';
import { 
  Building, 
  Plane, 
  Hotel, 
  Car, 
  Landmark, 
} from 'lucide-react';
import StaysSearchForm from './SearchForms/StaysSearchForm';
import FlightsSearchForm from './SearchForms/FlightsSearchForm';
// import FlightHotelSearchForm from './SearchForms/FlightHotelSearchForm';
// import CarRentalsSearchForm from './SearchForms/CarRentalsSearchForm';
// import AttractionsSearchForm from './SearchForms/AttractionsSearchForm';
// import AirportTaxisSearchForm from './SearchForms/AirportTaxisSearchForm';

export type SearchHeaderProps = 'stays' | 'flights' | 'flight+hotel' | 'car-rentals' | 'attractions' | 'airport-taxis';

export default function SearchHeader() {
  const [activeTab, setActiveTab] = useState<SearchHeaderProps>('stays');

  // Define tab configurations with icons and labels
  const tabs = [
    { id: 'stays', label: 'Stays', icon: Building },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'flight+hotel', label: 'Flight + Hotel', icon: Hotel },
    { id: 'car-rentals', label: 'Car Rentals', icon: Car },
    { id: 'attractions', label: 'Attractions', icon: Landmark },
    { id: 'airport-taxis', label: 'Airport Taxis', icon: Car },
  ];

  // Dynamic heading and subheading based on active tab
  const getHeading = () => {
    switch (activeTab) {
      case 'stays':
        return {
          title: 'Find your next stay',
          subtitle: 'Search low prices on hotels, homes and much more...'
        };
      case 'flights':
        return {
          title: 'Find flights to anywhere',
          subtitle: 'Compare and book flights with ease'
        };
      case 'flight+hotel':
        return {
          title: 'Book flights and hotels together',
          subtitle: 'Save when you bundle your travel'
        };
      case 'car-rentals':
        return {
          title: 'Car rentals for any kind of trip',
          subtitle: 'Great deals at great prices'
        };
      case 'attractions':
        return {
          title: 'Discover attractions nearby',
          subtitle: 'Book tickets and tours for top attractions'
        };
      case 'airport-taxis':
        return {
          title: 'Airport taxis & transfers',
          subtitle: 'Reliable transportation for your journey'
        };
      default:
        return {
          title: 'Find your next stay',
          subtitle: 'Search low prices on hotels, homes and much more...'
        };
    }
  };

  const renderSearchForm = () => {
    switch (activeTab) {
      case 'stays':
        return <StaysSearchForm />;
      case 'flights':
        return <FlightsSearchForm />;
      case 'flight+hotel':
        // return <FlightHotelSearchForm />;
        return <div className="bg-white rounded-lg p-6 shadow-lg text-gray-700">Flight + Hotel search form coming soon</div>;
      case 'car-rentals':
        // return <CarRentalsSearchForm />;
        return <div className="bg-white rounded-lg p-6 shadow-lg text-gray-700">Car Rentals search form coming soon</div>;
      case 'attractions':
        // return <AttractionsSearchForm />;
        return <div className="bg-white rounded-lg p-6 shadow-lg text-gray-700">Attractions search form coming soon</div>;
      case 'airport-taxis':
        // return <AirportTaxisSearchForm />;
        return <div className="bg-white rounded-lg p-6 shadow-lg text-gray-700">Airport Taxis search form coming soon</div>;
      default:
        return null;
    }
  };

  const { title, subtitle } = getHeading();

  return (
    <div className="bg-[#003580] text-white  ">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 w-[70vw] ">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar mb-6 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SearchHeaderProps)}
                className={`flex items-center px-4 py-2 mr-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#0071c2] text-white font-medium shadow-md' 
                    : ' bg-opacity-20 hover:bg-opacity-30 text-white'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main heading */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{title}</h1>
          <p className="text-lg text-white text-opacity-90">{subtitle}</p>
        </div>

        {/* Search Form */}
        <div className="relative z-10">
          {renderSearchForm()}
        </div>
        
        {/* Optional: Additional promotional content */}
        {/* {activeTab === 'stays' && (
          <div className="mt-8 bg-[#00224f] bg-opacity-40 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-[#0071c2] rounded-full mr-3">
                <Building size={20} />
              </div>
              <div>
                <p className="font-medium">Genius loyalty program</p>
                <p className="text-sm text-white text-opacity-80">Get rewarded for your travels – unlock instant savings of 10% or more</p>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}