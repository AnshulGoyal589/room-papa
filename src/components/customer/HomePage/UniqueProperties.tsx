"use client"

// import { PropertyType } from '@/types'; // Assuming PropertyType is still relevant for the actual data
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '@/lib/mongodb/models/Property';

// --- Icon Components ---
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);  


const NextArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// Mock data to match screenshot text for the first 4 properties
// Images will come from API, but text details below will override API's for these specific fields for display
// const screenshotMockDetails = [
//   {
//     name: "Ranczo w Dolinie", // To match with property.title if needed, or use for display
//     locationText: "Poland, Kiszkowo",
//     ratingScore: 9.6,
//     ratingText: "Exceptional",
//     reviewCount: 167,
//     priceText: "14,840"
//   },
//   {
//     name: "Agriturismo Cabrele",
//     locationText: "Italy, Santorso",
//     ratingScore: 9.5,
//     ratingText: "Exceptional",
//     reviewCount: 274,
//     priceText: "11,041"
//   },
//   {
//     name: "Mini Hotel Übernachten Im Gurkenfass",
//     locationText: "Germany, Lübbenau",
//     ratingScore: 7.7,
//     ratingText: "Good",
//     reviewCount: 189,
//     priceText: "7,817"
//   },
//   {
//     name: "Carinya Park",
//     locationText: "Australia, Gembrook",
//     ratingScore: 9.2,
//     ratingText: "Superb",
//     reviewCount: 32,
//     priceText: "15,077"
//   }
// ];


export default function UniqueProperties(): React.ReactElement {
  const router = useRouter();
  // const currentSearchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- LOGIC FROM ORIGINAL CODE - UNCHANGED ---
  const handleSearch = (id: string) => {
    router.push(`/customer/property/${id}`);
  };


  useEffect(() => {
    const fetchProperties = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties'); // ENSURE THIS API EXISTS AND RETURNS DATA
        
        if (!response.ok) {
          throw new Error(`Error fetching properties: ${response.status}`);
        }
        
        const data = await response.json();
        setProperties(data);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);
  // --- END OF UNCHANGED LOGIC ---

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-12 sm:py-16 px-4 text-center"> {/* Adjusted background and padding */}
        <div className="container mx-auto">
          <p className="text-gray-600">Loading unique properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-12 sm:py-16 px-4 text-center"> {/* Adjusted background and padding */}
        <div className="container mx-auto">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <p className="text-gray-600 mt-1">Unable to load properties at this time.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-white py-10 sm:py-4"> {/* Adjusted background and padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-800">Stay at our top unique properties</h2>
        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">From castles and villas to boats and igloos, we&apos;ve got it all</p>
        
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-4 pb-2 -mx-1 px-1 scrollbar-hide" // scrollbar-hide might need global CSS or a plugin
          >
            {properties.map((property) => (
              <div 
                key={property._id?.toString()} 
                className="flex-none w-[260px] sm:w-[280px] bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer group transition-shadow hover:shadow-md"
                onClick={() => property._id && handleSearch(property._id.toString())}
              >
                <div className="relative h-48 w-full">
                  {
                    property.bannerImage && 
                    <Image
                      src={property.bannerImage.url || '/placeholder-image.jpg'} // Fallback image
                      alt={property.title || 'Property image'} // Fallback for undefined title
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg group-hover:opacity-90 transition-opacity"
                    />
                  }
                  <button 
                    aria-label="Add to wishlist"
                    className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
                    onClick={(e) => { e.stopPropagation(); console.log('Wishlist clicked for', property._id);}} // Prevent card click
                  >
                    <HeartIcon />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-800 truncate mb-0.5">{property.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{property.location.city}, {property.location.state}, { property.location.country }</p>
                  
                  {property.propertyRating && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                        {property.propertyRating.toFixed(1)}
                      </span>
                      {/* <span className="text-xs text-gray-700 font-medium">{property.displayRatingText}</span>
                      <span className="text-xs text-gray-500">{property.displayReviewCount} reviews</span> */}
                    </div>
                  )}
                  
                  <div className="text-right flex items-center justify-end gap-2 ">
                    <p className="text-base text-gray-500">Starting from</p>
                    <p className="text-xl font-bold text-gray-800">
                      {property.costing?.currency} {property.costing?.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
             {properties.length === 0 && !loading && !error && (
              <p className="text-gray-600 w-full text-center py-8">No unique properties found at the moment.</p>
            )}
          </div>
          {properties.length > 3 && ( // Show arrow only if there's potential to scroll
            <button 
              onClick={scrollRight}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-1/2 sm:translate-x-0 sm:-mr-3 bg-white p-2.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-20 border border-gray-200"
            >
              <NextArrowIcon />
            </button>
          )}
        </div>
        
        {/* The "More Properties" button from original code, kept commented as it's not in the SS */}
        {/* 
        <div className="mt-8 text-center">
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
            onClick={(e) => {
              e.stopPropagation();
              handleProperties();
            }}
          >
          More Properties
         </button>
        </div> 
        */}
      </div>
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
*/