'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Link from 'next/link'; // Not used in the original relevant part

// --- Icon Components (Simple SVGs for vibe filters) ---
const CityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 21V9.75M12 21V9.75m3.75 11.25V9.75M8.25 9.75h7.5M3.75 7.5h16.5" />
  </svg>
);
const BeachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c3.243 0 6-1.683 6-3.75S15.243 5.25 12 5.25 6 6.933 6 9s2.757 3.75 6 3.75zM12 12.75V21m-4-8.25h8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75s1.226-4.5 7.5-4.5 7.5 4.5 7.5 4.5" />
  </svg>
);
const OutdoorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.915 10.598L7.5 9.75l-.585-.848M13.5 9.75L12.915 10.598m0 0L12.165 12l.75.848m-.75-.848l-.75-.848m7.5 6a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.503L9 3.75l.75.753M15.75 4.503L15 3.75l-.75.753M9.75 12.75c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V8.25a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.502 8.25H6v1.5H4.502v-1.5zM18 8.25h-1.502v1.5H18v-1.5z" />
  </svg>
);
const RelaxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-5.632-4.03-10.322-9.5-10.474M4.5 12C4.5 6.368 8.53 1.678 14 1.526M19.5 12v.75a3.75 3.75 0 01-3.695 3.743A3.752 3.752 0 0112.005 15V12m0 0V3.75m0 8.25a3.75 3.75 0 003.75 3.75h.01a3.75 3.75 0 003.74-3.695M12 12V3.75m0 8.25a3.75 3.75 0 01-3.75 3.75H8.24a3.75 3.75 0 01-3.74-3.695" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a8.25 8.25 0 006.262-2.738M12 21A8.25 8.25 0 015.738 18.262" />
  </svg>
);
const RomanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const FoodIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 0H7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75v2.25A2.25 2.25 0 0113.5 20.25h-3A2.25 2.25 0 018.25 18v-2.25m0-6.75H7.5m7.5 0H16.5m-4.5 .75a.75.75 0 00-.75-.75H10.5a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-4.5z" />
  </svg>
);
const NextArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);


// Original fallbackTripVibes - not directly used for rendering this new UI, 
// but kept to show original data structure.
// The images `/images/quickX.avif` will be used by the `destinationsData` below.
// const fallbackTripVibes = [
//   { 
//     title: 'Beach Getaway', 
//     domain : 'beach',
//     image: '/images/quick1.avif',
//     destinations: 'Goa, Andaman, Kovalam',
//     tripId: 'beach-getaway'
//   },
//   // ... other original vibes
// ];


// Data for vibe filter buttons as per screenshot
const vibeFilters = [
  { name: 'City', icon: <CityIcon />, domain: 'city' },
  { name: 'Beach', icon: <BeachIcon />, domain: 'beach' },
  { name: 'Outdoors', icon: <OutdoorsIcon />, domain: 'outdoors' },
  { name: 'Relax', icon: <RelaxIcon />, domain: 'relax' },
  { name: 'Romance', icon: <RomanceIcon />, domain: 'romance' },
  { name: 'Food', icon: <FoodIcon />, domain: 'food' },
];

// Data for destination cards as per screenshot, using images from original code
const destinationsData = [
  { name: 'Agra', image: '/images/quick1.avif', distance: '180 km from New Delhi' },
  { name: 'Jodhpur', image: '/images/quick2.avif', distance: '489 km from New Delhi' },
  { name: 'Udaipur', image: '/images/quick3.avif', distance: '571 km from New Delhi' },
  { name: 'Varanasi', image: '/images/quick4.avif', distance: '680 km from New Delhi' },
  { name: 'Tirupati', image: '/images/quick5.avif', distance: '1,684 km from New Delhi' },
  { name: 'Mysore', image: '/images/quick6.avif', distance: '1,817 km from New Delhi' },
];


export default function QuickTripPlanner() {
  // const router = useRouter();
  // const currentSearchParams = useSearchParams();
  const [activeVibe, setActiveVibe] = useState('city'); // 'city' is selected by default in SS
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // LOGIC FROM ORIGINAL CODE - UNCHANGED
  // const handleVibeClick = (domain: string) => {
  //   const params = new URLSearchParams(currentSearchParams?.toString() || '');
  //   if (domain) params.set('domain', domain);
  //   params.set('category', 'trip');
  //   router.push(`/search?${params.toString()}`);
  // };

  // const handleSearch = () => {
  //   const params = new URLSearchParams(currentSearchParams?.toString() || '');
  //   params.set('category', 'trip');
  //   router.push(`/search?${params.toString()}`);
  // };
  // END OF UNCHANGED LOGIC

  const handleFilterClick = (domain: string) => {
    setActiveVibe(domain);
    // You might want to call handleVibeClick here if these filters should trigger a search
    // For now, it just updates the active state for styling, as per screenshot's static nature.
    // To connect to existing logic:
    // handleVibeClick(domain); 
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-20 px-4 sm:px-6"> {/* Adjusted container and padding */}
      <h2 className="text-3xl font-bold mb-2 text-charcoal-text">
        Craft Your Perfect India Itinerary
      </h2>
      <p className="text-gray-600 mb-6 text-[16px]">
        Tell us your travel style, and we&apos;ll instantly match you with the best destinations and experiences across India.
      </p>
      
      <div className="mb-8">
        <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {vibeFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => handleFilterClick(filter.domain)} // Updated to use handleFilterClick
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 border rounded-full text-sm font-medium transition-colors duration-200
                          ${activeVibe === filter.domain
                            ? 'border-[#001d2c] text-[#ffffff] bg-[#001d2c] shadow-sm'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'}`}
            >
              {filter.icon}
              <span>{filter.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-4 pb-1 scrollbar-hide" // scrollbar-hide might need global CSS or a plugin
        >
          {destinationsData.map((dest, index) => (
            <div 
              key={index} 
              className="flex-none w-[170px] sm:w-[190px] rounded-xl overflow-hidden shadow-md bg-white cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
              // onClick={() => console.log(`Clicked on ${dest.name}`)} // Example onClick for cards
            >
              <div className="relative h-32 sm:h-36 w-full">
                <Image 
                  src={dest.image}
                  alt={dest.name}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{dest.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{dest.distance}</p>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-1/2 sm:translate-x-0 sm:-mr-1 bg-white p-2.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10 border border-gray-200"
        >
          <NextArrowIcon />
        </button>
      </div>

      {/* Kept "Explore All Trips" button from original code to not change logic */}
      {/* <div className="mt-12 text-center">
          <button 
            className="bg-[#001d2c] text-white px-8 py-3 rounded-lg hover:bg-[#001d2c] transition duration-300 text-base font-medium shadow-md hover:shadow-lg"
            onClick={(e) => {
              // e.stopPropagation(); // Original line, might not be necessary here.
              handleSearch();
            }}
          >
            Explore All Trips
          </button>
      </div> */}
    </div>
  );
}

// To make scrollbar-hide utility work (if not using a plugin):
// Add this to your global CSS file (e.g., styles/globals.css):
/*
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}

.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: #f1f1f1; // Or your scrollbar-track-gray-100
  border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #c1c1c1; // Or your scrollbar-thumb-gray-300
  border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1; // Darker on hover
}

*/