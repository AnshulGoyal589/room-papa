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
// import FlightsSearchForm from './SearchForms/FlightsSearchForm';
// import TripsSearchForm from './SearchForms/TripsSearchForm';
import { usePathname } from 'next/navigation';
import { Header } from '../layout/Header';

// --- NO LOGIC CHANGES IN THIS SECTION ---

export type TabId = 'property' | 'travelling' | 'flight+hotel' | 'car-rentals' | 'attractions' | 'airport-taxis';
const VALID_TABS: TabId[] = ['property', 'travelling', 'flight+hotel', 'car-rentals', 'attractions', 'airport-taxis'];
export type CategoryType = 'property' | 'trip' | 'travelling';

const getInitialTab = (): TabId => {
  if (typeof window === 'undefined') return 'property';
  try {
    const savedTab = localStorage.getItem('activeSearchTab') as TabId;
    if (savedTab && VALID_TABS.includes(savedTab)) return savedTab;
  } catch (error) {
    console.error('Could not read from localStorage:', error);
  }
  return 'property';
};

export default function SearchHeader() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  // Cleaner check: only show the main heading on the homepage.
  const showHeading = pathname === '/'; 
  
  const getCategory = (tabId: TabId): CategoryType => {
    switch (tabId) {
      case 'property': return 'property';
      case 'flight+hotel': case 'attractions': return 'trip';
      case 'travelling': case 'car-rentals': case 'airport-taxis': return 'travelling';
      default: return 'property';
    }
  };

  const tabs = [
    { id: 'property', label: 'Hotels & Homes', icon: Building },
    { id: 'flight+hotel', label: 'Vacation Packages', icon: Hotel },
    { id: 'car-rentals', label: 'Car Rentals', icon: Car },
    { id: 'attractions', label: 'Things to Do', icon: Landmark },
    { id: 'airport-taxis', label: 'Airport Transfers', icon: Car },
    { id: 'travelling', label: 'Flights', icon: Plane },
  ];

  const getHeading = () => {
    switch (activeTab) {
      case 'property': return { title: 'Book Hotels, Apartments & Vacation Rentals', subtitle: 'Find exclusive deals on millions of rooms worldwide.' };
      case 'travelling': return { title: 'Search & Compare Cheap Flights', subtitle: 'Book the best deals on airline tickets worldwide.' };
      case 'flight+hotel': return { title: 'Save Big with Flight + Hotel Deals', subtitle: 'Bundle your trip and unlock exclusive savings.' };
      case 'car-rentals': return { title: 'Find the Perfect Car Rental', subtitle: 'Compare cheap car hire deals from top providers.' };
      case 'attractions': return { title: 'Book Tours, Attractions & Things to Do', subtitle: 'Discover unforgettable experiences with free cancellation.' };
      case 'airport-taxis': return { title: 'Reliable Airport Taxis & Transfers', subtitle: 'Pre-book a hassle-free ride to or from the airport.' };
      default: return { title: 'Book Hotels, Apartments & Vacation Rentals', subtitle: 'Find exclusive deals on millions of rooms worldwide.' };
    }
  };

  const renderSearchForm = () => {
    const category = getCategory(activeTab);
    // if (category === 'trip') return <TripsSearchForm />;
    if (category === 'trip') return <StaysSearchForm />;
    // if (category === 'travelling') return <FlightsSearchForm />;
    if (category === 'travelling') return <StaysSearchForm />;
    if (category === 'property') return <StaysSearchForm />;
    return null;
  };

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

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  const { title, subtitle } = getHeading();

  // --- UI & STYLING LOGIC ONLY BELOW THIS LINE ---

  return (
    <div className="relative bg-[url('/images/background-hero.jpg')] bg-cover bg-center bg-no-repeat text-white min-h-[400px]"> {/* Added min-h for visibility if image is tall */}
      {/* Overlay to darken image and improve text readability */}
      <div className="absolute inset-0 bg-black opacity-40"></div> 
      <Header />
      {/* Blue background section with padding */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pt-6 w-full max-w-7xl">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/20 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabId)}
                className={`flex items-center gap-2.5 px-4 py-3 whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-t-lg ${
                  isActive 
                    ? 'font-semibold border-b-2 border-white' 
                    : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Heading Section */}
        {showHeading && (
          <div className="mt-10 md:mt-14 mb-6 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h1>
            <p className="text-lg md:text-xl text-gray-200 mt-3 max-w-3xl mx-auto lg:mx-0">{subtitle}</p>
          </div>
        )}
      </div>

      {/* Search Form Wrapper - Positioned absolutely to overlap */}
      {/* <div className=""> */}
        <div className="relative z-10 container mx-auto px-4 lg:p-8 w-full max-w-7xl">
          {renderSearchForm()}
        </div>
      {/* </div/> */}
    </div>
  );
}