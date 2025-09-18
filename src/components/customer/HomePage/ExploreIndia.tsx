"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react'; // For a nice hover effect

export default function TrendingDestinations() {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // --- ENRICHED DATA FOR A MORE COMPELLING UI ---
  // Added description and country for a richer user experience
  const destinationsData = [
    {
      name: 'Jaipur',
      location: 'jaipur',
      description: 'The Pink City of Palaces',
      country: 'India',
      image: '/images/explore3.avif', // Using your existing images
      flag: '🇮🇳'
    },
    {
      name: 'Delhi',
      location: 'delhi',
      description: 'A Tapestry of History & Modernity',
      country: 'India',
      image: '/images/explore1.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Goa',
      location: 'goa',
      description: 'Sun-kissed Beaches & Vibrant Nights',
      country: 'India',
      image: '/images/explore4.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Mumbai',
      location: 'mumbai',
      description: 'The City of Dreams',
      country: 'India',
      image: '/images/explore2.avif',
      flag: '🇮🇳'
    },
    {
      name: 'Shimla',
      location: 'shimla',
      description: 'The Queen of Hill Stations',
      country: 'India',
      image: '/images/explore5.avif',
      flag: '🇮🇳'
    }
  ];

  const handleSearch = (location: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('destination', location);
    router.push(`/search?${params.toString()}`);
  };

  // --- NEW, UNIQUE & PROFESSIONAL JSX STRUCTURE ---
  return (
    <div className="bg-[#001d2c]/15 py-16 sm:py-20"> {/* Using a soft background color from your palette */}
      <div className='container mx-auto px-4'>
        
        {/* Step 1: More evocative and unique headings */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#2D3748] mb-2">
            Find Your Next Getaway
          </h2>
          <p className="text-md text-gray-600">
            Curated destinations that travellers are loving right now.
          </p>
        </div>

        {/* Step 2: A modern horizontal scrolling container */}
        <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
          {destinationsData.map((destination, index) => (
            <div
              key={destination.location}
              className="group flex-shrink-0 w-72 sm:w-80 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
              onClick={() => handleSearch(destination.location)}
            >
              {/* Image Container */}
              <div className="relative w-full h-48">
                <Image
                  fill
                  src={destination.image}
                  alt={destination.name}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 70vw, 20vw"
                  priority={index < 3} // Prioritize the first few images
                />
                {/* A subtle arrow appears on hover for better affordance */}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="h-5 w-5 text-[#2D3748]" />
                </div>
              </div>

              {/* Content Container */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#2D3748]">
                  {destination.name}
                </h3>
                <p className="text-gray-500 mt-1 mb-3">
                  {destination.description}
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <span>{destination.flag}</span>
                  <span className="ml-2">{destination.country}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}