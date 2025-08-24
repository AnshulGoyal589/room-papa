"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function TrendingDestinations() { // Renamed component for clarity

  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // Using your existing destinations, adding flags, and taking the first 5 for the layout
  const destinationsData = [
    {
      name: 'Delhi', // Corresponds to "New Delhi" visual slot
      originalName: 'Delhi', // Keep original name if needed for search query
      location: 'delhi',
      image: '/images/explore1.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Mumbai', // Corresponds to "Bengaluru" visual slot
      originalName: 'Mumbai',
      location: 'mumbai',
      image: '/images/explore2.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Jaipur', // Corresponds to "Mumbai" visual slot in SS
      originalName: 'Jaipur',
      location: 'jaipur',
      image: '/images/explore3.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Goa',    // Corresponds to "Chennai" visual slot in SS
      originalName: 'Goa',
      location: 'goa',
      image: '/images/explore4.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Shimla', // Corresponds to "Varanasi" visual slot in SS
      originalName: 'Shimla',
      location: 'shimla',
      image: '/images/explore5.avif',
      flag: '🇮🇳'
    }
  ];

  // If you want to use the exact names from screenshot (New Delhi, Bengaluru etc.) for display
  // but search by your 'location' values, you can adjust the `name` field above.
  // For this example, I'm using your original names for display.

  const handleSearch = (location: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    if (location) params.set('destination', location); // Changed 'location' to 'destination' to be more standard
    // params.set('category', 'trip'); // You can set category if your search page needs it
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="py-10 px-4"> {/* Adjusted padding slightly */}
      <div className='container mx-auto'>
        <h2 className="text-2xl lg:text-[1.5vw] font-bold mb-1 text-gray-800">Trending destinations</h2>
        <p className="text-sm text-gray-600 mb-6">Most popular choices for travellers from India</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          {destinationsData.map((destination, index) => {
            const isFirstRow = index < 2;
            // Adjust height classes for desired aspect ratio and visual appeal
            // For wider cells (first row), a less tall image might look more panoramic
            // For narrower cells (second row), a taller image can fill the space well
            const imageContainerHeightClass = isFirstRow ? "h-52 sm:h-60" : "h-64 sm:h-72";
            const colSpanClass = isFirstRow ? "md:col-span-3" : "md:col-span-2";
            return (
              <div
                key={destination.name + index} // Use index if names can repeat, though ideally names are unique
                className={`group ${colSpanClass} rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
                onClick={() => handleSearch(destination.location)}
              >
                <div className={`relative w-full ${imageContainerHeightClass}`}>
                  <Image
                    fill // Replaces width and height for responsive fill
                    src={destination.image}
                    alt={destination.name}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" // Example sizes, adjust as needed
                    priority={index < 2} // Prioritize loading images in the first row
                  />
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                      {destination.name}
                      <span className="ml-2 text-sm sm:text-base">{destination.flag}</span>
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}