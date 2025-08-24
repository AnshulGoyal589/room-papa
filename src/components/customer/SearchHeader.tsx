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
// useSearchParams is no longer needed
import { usePathname } from 'next/navigation';

// Define visible tab IDs and a validator array
export type TabId = 'property' | 'travelling' | 'flight+hotel' | 'car-rentals' | 'attractions' | 'airport-taxis';
const VALID_TABS: TabId[] = ['property', 'travelling', 'flight+hotel', 'car-rentals', 'attractions', 'airport-taxis'];

// Define backend categories
export type CategoryType = 'property' | 'trip' | 'travelling';

// Safely gets the initial tab from localStorage on the client-side
const getInitialTab = (): TabId => {
  // Return default for server-side rendering
  if (typeof window === 'undefined') {
    return 'property';
  }
  try {
    const savedTab = localStorage.getItem('activeSearchTab') as TabId;
    // Validate that the saved value is a real TabId before using it
    if (savedTab && VALID_TABS.includes(savedTab)) {
      return savedTab;
    }
  } catch (error) {
    // Handle potential errors, e.g., in private browsing mode
    console.error('Could not read from localStorage:', error);
  }
  // Return default if nothing is found or an error occurs
  return 'property';
};

export default function SearchHeader() {
  const pathname = usePathname();
  
  // Initialize state by calling a function that reads from localStorage.
  // This runs only once on the initial client-side render.
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  const showHeading = pathname ? pathname.includes('/') : false; 
  
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
    const category = getCategory(activeTab);

    if (category === 'trip') {
      return <TripsSearchForm />;
    }
    
    if (category === 'travelling') {
      return <FlightsSearchForm />;
    }
    
    if (category === 'property') {
      return <StaysSearchForm />;
    }

    return null;
  };

  // This useEffect now saves the active tab and category to localStorage
  // whenever the activeTab state changes.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeSearchTab', activeTab);
        localStorage.setItem('activeSearchCategory', getCategory(activeTab));
      } catch (error) {
        console.error('Could not write to localStorage:', error);
      }
    }
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  const { title, subtitle } = getHeading();

  return (
    <div className="bg-[#003b95] text-white">
      <div className="container mx-auto px-8 pb-4 md:pb-8 lg:pb-0 w-full lg:w-7xl">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar mb-6 lg:mb-0 pb-2 lg:pb-0">
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
        {showHeading && 
          <div className="mt-12 mb-12 lg:mb-4 flex flex-col gap-4">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">{title}</h1>
            <p className="text-base md:text-xl">{subtitle}</p>
          </div>
        }

        {/* Search Form */}
        <div className="relative z-10 lg:top-8">
          {renderSearchForm()}
        </div>
      </div>
    </div>
  );
}