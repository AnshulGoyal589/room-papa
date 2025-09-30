'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Plane,
  Hotel,
  Car,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import StaysSearchForm from './SearchForms/StaysSearchForm';
import { usePathname } from 'next/navigation';

export type TabId = 'property' | 'travelling' | 'flight+hotel' | 'car-rentals' | 'attractions' | 'airport-taxis';
const VALID_TABS: TabId[] = ['property', 'travelling', 'flight+hotel', 'car-rentals', 'attractions', 'airport-taxis'];
export type CategoryType = 'property' | 'trip' | 'travelling';

const getInitialTab = (): TabId => {
  if (typeof window === 'undefined') return 'property';
  try {
    const savedTab = localStorage.getItem('activeSearchTab') as TabId;
    if (savedTab && VALID_TABS.includes(savedTab)) return savedTab;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
  }
  return 'property';
};

export default function SearchHeader() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  const showHeading = pathname === '/';

  const getCategory = useMemo(() => (tabId: TabId): CategoryType => {
    switch (tabId) {
      case 'property': return 'property';
      case 'flight+hotel': case 'attractions': return 'trip';
      case 'travelling': case 'car-rentals': case 'airport-taxis': return 'travelling';
      default: return 'property';
    }
  }, []);

  const tabs = useMemo(() => [
    { id: 'property', label: 'Hotels & Homes', icon: Building, description: 'Find exclusive deals on millions of rooms worldwide.' },
    { id: 'flight+hotel', label: 'Vacation Packages', icon: Hotel, description: 'Bundle your trip and unlock exclusive savings.' },
    { id: 'car-rentals', label: 'Car Rentals', icon: Car, description: 'Compare cheap car hire deals from top providers.' },
    { id: 'attractions', label: 'Things to Do', icon: Landmark, description: 'Discover unforgettable experiences with free cancellation.' },
    { id: 'airport-taxis', label: 'Airport Transfers', icon: ShieldCheck, description: 'Pre-book a hassle-free ride to or from the airport.' },
    { id: 'travelling', label: 'Flights', icon: Plane, description: 'Book the best deals on airline tickets worldwide.' },
  ], []);

  const { title, subtitle } = useMemo(() => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab) {
      let dynamicTitle = '';
      switch (currentTab.id) {
        case 'property': dynamicTitle = 'Book Hotels, Apartments & Vacation Rentals'; break;
        case 'travelling': dynamicTitle = 'Search & Compare Cheap Flights'; break;
        case 'flight+hotel': dynamicTitle = 'Save Big with Flight + Hotel Deals'; break;
        case 'car-rentals': dynamicTitle = 'Find the Perfect Car Rental'; break;
        case 'attractions': dynamicTitle = 'Book Tours, Attractions & Things to Do'; break;
        case 'airport-taxis': dynamicTitle = 'Reliable Airport Taxis & Transfers'; break;
      }
      return { title: dynamicTitle, subtitle: currentTab.description };
    }
    return { title: 'Book Hotels, Apartments & Vacation Rentals', subtitle: 'Find exclusive deals on millions of rooms worldwide.' };
  }, [activeTab, tabs]);

  const renderSearchForm = useMemo(() => {
    // const category = getCategory(activeTab);
    // if (category === 'trip') return <TripsSearchForm />;
    // if (category === 'travelling') return <FlightsSearchForm />;
    return <StaysSearchForm />;
  }, [activeTab, getCategory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeSearchTab', activeTab);
        localStorage.setItem('activeSearchCategory', getCategory(activeTab));
      } catch (error) {
        console.error('Failed to write to localStorage:', error);
      }
    }
  }, [activeTab, getCategory]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  return (
      <div className="relative bg-[#003c95] text-white max-h-[450px] md:max-h-[500px] lg:max-h-[450px] flex flex-col justify-between ">

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:max-w-7xl pb-8 pt-4 flex flex-col flex-grow">
          
          <div className="flex overflow-x-auto no-scrollbar scrollbar-hidden pb-2 mb-8 -mx-4 sm:mx-0 sm:justify-center lg:justify-start">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabId)}
                  className={`flex items-center px-4 py-2.5 mx-1 first:ml-4 sm:first:ml-1 last:mr-4 sm:last:mr-1 rounded-full whitespace-nowrap transition-all duration-300 ease-in-out
                    ${isActive
                      ? 'bg-white/10 text-white font-semibold shadow-lg scale-105'
                      : 'bg-[#003c95] hover:bg-white/10 text-white font-medium hover:scale-105'
                    }`
                  }
                >
                  <Icon size={18} className="mr-2.5 min-w-[18px]" /> 
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {showHeading &&
            <div className="mt-4 mb-8 text-center lg:text-left flex flex-col gap-3 max-w-3xl mx-auto lg:mx-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                {title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl font-light opacity-90 drop-shadow-sm">
                {subtitle}
              </p>
            </div>
          }

          <div className="relative z-20 mt-auto pt-6 lg:pt-0 -mb-16">
            {renderSearchForm}
          </div>

        </div>
      </div>
  );
}