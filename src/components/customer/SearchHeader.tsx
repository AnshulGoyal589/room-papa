'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plane, 
  Hotel, 
  Car, 
  Landmark, 
} from 'lucide-react';
import StaysSearchForm from './SearchForms/StaysSearchForm';
import FlightsSearchForm from './SearchForms/FlightsSearchForm';
import TripsSearchForm from './SearchForms/TripsSearchForm';
import { useSearchParams } from 'next/navigation';

// Define visible tab IDs
export type TabId = 'property' | 'travelling' | 'flight+hotel' | 'car-rentals' | 'attractions' | 'airport-taxis';

// Define backend categories
export type CategoryType = 'property' | 'trip' | 'travelling';

export default function SearchHeader() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams?.get('tab') as TabId) || 'property'
  );

  // Map tabs to categories
  const getCategory = (tabId: TabId): CategoryType => {
    switch (tabId) {
      case 'property':
        return 'property';
      case 'flight+hotel':
      case 'attractions':
        return 'trip';
      case 'travelling':
      case 'car-rentals':
      case 'airport-taxis':
        return 'travelling';
      default:
        return 'property';
    }
  };

  useEffect(() => {
    // Get the tab from URL parameters when component mounts
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as TabId;
      if (tabParam) setActiveTab(tabParam);
    }
  }, []);

  // Define tab configurations with icons and labels
  const tabs = [
    { id: 'property', label: 'Stays', icon: Building },
    { id: 'travelling', label: 'Flights', icon: Plane },
    { id: 'flight+hotel', label: 'Flight + Hotel', icon: Hotel },
    { id: 'car-rentals', label: 'Car Rentals', icon: Car },
    { id: 'attractions', label: 'Attractions', icon: Landmark },
    { id: 'airport-taxis', label: 'Airport Taxis', icon: Car },
  ];

  // Dynamic heading and subheading based on active tab
  const getHeading = () => {
    switch (activeTab) {
      case 'property':
        return {
          title: 'Find your next stay',
          subtitle: 'Search low prices on hotels, homes and much more...'
        };
      case 'travelling':
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
    // Get the category for the current tab
    const category = getCategory(activeTab);

    // For trip category, use specific forms based on the active tab
    if (category === 'trip') {
      return <TripsSearchForm />;
    }
    
    // For travelling category, use specific forms based on the active tab
    if (category === 'travelling') {
        return <FlightsSearchForm />;
    }
    
    // For property category
    if (category === 'property') {
      return <StaysSearchForm />;
    }

    return null;
  };

  // Update URL when activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      url.searchParams.set('category', getCategory(activeTab));
      window.history.pushState({}, '', url);
    }
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  const { title, subtitle } = getHeading();

  return (
    <div className="bg-[#003b95] text-white">
      <div className="container mx-auto px-4 pt-2 pb-8 md:pt-4 lg:pt-8 md:pb-12 lg:pb-16 w-full lg:w-[70vw]">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar mb-6 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabId)}
                className={`flex items-center px-4 py-2 mr-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#0071c2] text-white font-medium shadow-md' 
                    : 'bg-opacity-20 hover:bg-opacity-30 text-white'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Heading */}
        <div className="my-12 flex flex-col gap-4">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">{title}</h1>
          <p className="text-base md:text-xl">{subtitle}</p>
        </div>

        {/* Search Form */}
        <div className="relative z-10">
          {renderSearchForm()}
        </div>
      </div>
    </div>
  );
}