'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
// import Link from 'next/link';

const fallbackTripVibes = [
  { 
    title: 'Beach Getaway', 
    domain : 'beach',
    image: '/images/quick1.avif',
    destinations: 'Goa, Andaman, Kovalam',
    tripId: 'beach-getaway'
  },
  { 
    title: 'Mountain Retreat', 
    domain : 'mountain',
    image: '/images/quick2.avif',
    destinations: 'Shimla, Manali, Darjeeling',
    tripId: 'mountain-retreat'
  },
  { 
    title: 'Cultural Experience', 
    domain : 'cultural',
    image: '/images/quick3.avif',
    destinations: 'Jaipur, Varanasi, Hampi',
    tripId: 'cultural-experience'
  },
  { 
    title: 'Wildlife Adventure', 
    domain : 'wildlife',
    image: '/images/quick4.avif',
    destinations: 'Ranthambore, Kaziranga, Jim Corbett',
    tripId: 'wildlife-adventure'
  },
  { 
    title: 'City Exploration', 
    domain : 'city',
    image: '/images/quick5.avif',
    destinations: 'Delhi, Mumbai, Bangalore',
    tripId: 'city-exploration'
  },
  { 
    title: 'Heritage Sites', 
    domain : 'heritage',
    image: '/images/quick6.avif',
    destinations: 'Agra, Khajuraho, Ajanta & Ellora',
    tripId: 'heritage-sites'
  }
];

export default function QuickTripPlanner() {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const handleVibeClick = (domain: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    if (domain) params.set('domain', domain);
    params.set('category', 'trip');
    router.push(`/customer/search?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('category', 'trip');
    router.push(`/customer/search?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-2 text-center">Quick and Easy Trip Planner</h2>
      <p className="text-xl text-gray-600 mb-8 text-center">Pick a vibe and explore the top destinations in India</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fallbackTripVibes.map((vibe) => (
          <div 
            key={vibe.title} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 group cursor-pointer"
            onClick={() => handleVibeClick(vibe.domain)}
          >
            <div className="relative h-52 overflow-hidden">
              <Image 
                src={vibe.image}
                alt={vibe.title}
                width={500}
                height={500}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-4 text-white">
                  <h3 className="text-xl font-bold">{vibe.title}</h3>
                  <p className="text-white/80">{vibe.destinations}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
            onClick={(e) => {
              e.stopPropagation();
              handleSearch();
            }}
          >
            Explore All Trips
          </button>
      </div>
    </div>
  );
}
