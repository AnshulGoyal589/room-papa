"use client"

import Image from 'next/image';
import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '@/lib/mongodb/models/Property';

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

interface UniquePropertiesProps {
  initialProperties: Property[];
}

export default function UniqueProperties({ initialProperties }: UniquePropertiesProps): React.ReactElement {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
// console.log("Initial Properties in UniqueProperties component:", initialProperties);
  const handleSearch = (id: string) => {
    router.push(`/property/${id}`);
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  console.log("Rendering UniqueProperties with properties:", initialProperties);


 return (
    <div className="bg-white py-10 sm:py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
<h2 className="text-3xl font-bold mb-2 text-charcoal-text">
  Extraordinary Stays, Curated for You
</h2>
<p className="text-lg text-gray-600 mb-8">
  Move beyond the standard hotel
</p>
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-4 pb-2 -mx-1 px-1 scrollbar-hide"
          >
            {initialProperties.map((property) => (
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
                  <p className="text-xs text-gray-500 mb-2">{property?.location?.city}, {property?.location?.state}, {property?.location?.country}</p>
                  
                  {property.propertyRating && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-[#003c95] text-white text-xs font-bold px-2 py-0.5 rounded">
                        {property.propertyRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-right flex items-center justify-end gap-2 ">
                    <p className="text-base text-gray-500">Starting from</p>
                    <p className="text-xl font-bold text-gray-800">
                      {property.costing?.currency} { property?.costing?.discountedPrice }
                    </p>
                  </div>
                </div>

              </div> 
            ))}

            {initialProperties.length === 0 && (
              <p className="text-gray-600 w-full text-center py-8">No unique properties found at the moment.</p>
            )}

          </div>
          {initialProperties.length > 3 && (
            <button 
              onClick={scrollRight}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-1/2 sm:translate-x-0 sm:-mr-3 bg-white p-2.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-20 border border-gray-200"
            >
              <NextArrowIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}