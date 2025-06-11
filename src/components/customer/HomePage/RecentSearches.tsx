"use client"

import React, { useEffect, useState } from 'react';
import { RecentSearchItem } from '../SearchForms/StaysSearchForm';
// Import the RecentSearchItem type if it's in a shared types file, or redefine if StaysSearchForm is not exporting it
// For this example, assuming StaysSearchForm exports it or it's defined in a shared types.ts

const RECENT_SEARCHES_KEY = 'recentStaysSearches'; // Must match the key used in StaysSearchForm

// Helper to format date like "11 Jun–12 Jun"
const formatRecentSearchDateRange = (checkInStr: string, checkOutStr: string): string => {
  // Dates are YYYY-MM-DD, parse them as local dates
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const startDate = parseLocalDate(checkInStr);
  const endDate = parseLocalDate(checkOutStr);

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  // Using en-GB for "DD Mon" format, adjust locale as needed
  const startFormatted = startDate.toLocaleDateString('en-GB', options);
  const endFormatted = endDate.toLocaleDateString('en-GB', options);

  if (startFormatted === endFormatted) return startFormatted;
  return `${startFormatted} – ${endFormatted}`; // Note the en dash for better typography
};

const RecentSearches: React.FC = () => {
  const [searches, setSearches] = useState<RecentSearchItem[]>([]);

  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (storedSearches) {
        setSearches(JSON.parse(storedSearches));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
      setSearches([]); 
    }
  }, []);

  const handleRecentSearchClick = (search: RecentSearchItem) => {
    // Update individual localStorage items for StaysSearchForm pre-fill
    // StaysSearchForm expects these in specific formats
    localStorage.setItem('title', search.title);
    localStorage.setItem('checkIn', search.checkIn); // Already YYYY-MM-DD
    localStorage.setItem('checkOut', search.checkOut); // Already YYYY-MM-DD
    localStorage.setItem('adults', search.adults.toString());
    localStorage.setItem('children', search.children.toString());
    localStorage.setItem('rooms', search.rooms.toString());
    localStorage.setItem('pets', search.pets.toString());

    // Construct URL and redirect
    const params = new URLSearchParams();
    if (search.title) params.set('title', search.title);
    params.set('checkIn', search.checkIn); 
    params.set('checkOut', search.checkOut);
    params.set('adults', search.adults.toString());
    params.set('children', search.children.toString());
    params.set('rooms', search.rooms.toString());
    if (search.pets) params.set('pets', 'true');

    window.location.href = `/customer/search?${params.toString()}`;
  };

  if (searches.length === 0) {
    return null; 
  }

  const formatTitle = (title: string | null | undefined): string => {
    if (!title || title.trim() === '') {
      return 'Anywhere';
    }
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  return (
    <div className="mt-20 px-4 mx-0 md:px-8"> {/* Added some padding for standalone view */}
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Your recent searches</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {searches.map((search) => {
        //   const isNewDelhi = search.title.toLowerCase().includes('delhi');
        //   // Example image URL for New Delhi. Replace with your actual image path.
        //   const delhiImageUrl = "https://images.unsplash.com/photo-1587474260584-13657452893b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYXl1bidzJTIwdG9tYnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=100&q=60";


          return (
            <div
              key={search.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-3.5 flex items-start space-x-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRecentSearchClick(search)}
            >
              <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
         
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-800 text-base leading-tight">
                  {formatTitle(search.title)}
                </h3>
                <div className='flex gap-2 justify-start items-center mt-3' >
                    <p className="text-[0.9rem] text-gray-500">
                    {formatRecentSearchDateRange(search.checkIn, search.checkOut)}
                    </p>
                    <p className="text-[0.9rem] text-gray-500">
                    {search.adults} adult{search.adults !== 1 ? 's' : ''}
                    {search.children > 0 && ` • ${search.children} child${search.children !== 1 ? 'ren' : ''}`}
                    </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentSearches;