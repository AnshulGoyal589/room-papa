
'use client';

import React, { useState, useEffect } from 'react';
// import TravelTypeSelector from './TravelTypeSelector';
import SearchForm from './SearchForm';
import { ChevronRight } from 'lucide-react';

// type SearchFormProps = {
//   defaultCategory: 'property' | 'trip' | 'travelling';
// };

export default function HeroSection() {
  // const [searchType, setSearchType] = useState<SearchFormProps['defaultCategory']>('property');
  const [currentBackground, setCurrentBackground] = useState(0);
  
  const backgrounds = [
    "bg-[url('/api/placeholder/1600/800?text=Beach+Resort')]",
    "bg-[url('/api/placeholder/1600/800?text=Mountain+View')]",
    "bg-[url('/api/placeholder/1600/800?text=City+Skyline')]",
  ];
  
  // Background image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % backgrounds.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [ backgrounds.length ]);

  // Offer data
  const specialOffers = [
    { text: "Summer Special: Up to 30% off", highlight: true },
    { text: "Free cancellation on most hotels", highlight: false },
    { text: "Instant savings with member prices", highlight: false },
  ];

  return (
    <div className={`relative min-h-[600px] ${backgrounds[currentBackground]} bg-cover bg-center`}>
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-600/75"></div>
      
      {/* Main content */}
      <div className="relative container mx-auto px-4 py-24 flex flex-col justify-center min-h-[600px]">
        <div className="max-w-3xl">
          {/* Hero tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {specialOffers.map((offer, index) => (
              <span 
                key={index} 
                className={`rounded-full text-sm px-4 py-1 font-medium ${
                  offer.highlight 
                    ? 'bg-yellow-400 text-blue-900' 
                    : 'bg-white/20 text-white backdrop-blur-sm'
                }`}
              >
                {offer.text}
              </span>
            ))}
          </div>
          
          {/* Main heading with animated highlight */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white leading-tight">
            Discover <span className="text-yellow-400">Unforgettable</span> Travel Experiences
          </h1>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl">
            Find and book your dream getaway with ease. Exclusive deals on hotels, flights, and experiences around the world.
          </p>
          
          {/* Travel type selector with enhanced styling */}
          {/* <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl inline-block mb-8">
            <TravelTypeSelector searchType={searchType} setSearchType={setSearchType} />
          </div> */}
        </div>
        
        {/* Search form with glass effect */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl">
          <SearchForm/>
        </div>
        
        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-6 mt-8 text-white/80">
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium">Trusted by 5M+ travelers</span>
          </div>
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium">Secure payments</span>
          </div>
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Best price guarantee</span>
          </div>
        </div>
      </div>
      
      {/* Bottom wave effect */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
        <svg className="absolute bottom-0 w-full h-24 text-gray-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="currentColor" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
        </svg>
      </div>
      
      {/* Popular search overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg hidden md:block">
        <p className="text-xs text-gray-500 mb-1">Popular right now:</p>
        <div className="flex space-x-2">
          {["Goa", "Maldives", "Dubai", "Bangkok"].map((place) => (
            <button 
              key={place}
              className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition flex items-center"
            >
              {place} <ChevronRight className="h-3 w-3 ml-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}