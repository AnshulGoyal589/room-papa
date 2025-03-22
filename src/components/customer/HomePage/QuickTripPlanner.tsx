'use client'; // Add this if using Next.js App Router

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Image as mongoImg } from '@/lib/mongodb/models/Image';

interface TripVibe {
  bannerImage: mongoImg;
  tripId: string;
  destinations: string;
  userId: string;
  title: string;
  description: string;
  visibility: string;
}

export default function QuickTripPlanner() {
  const [tripVibes, setTripVibes] = useState<TripVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback trip vibes in case of error or during loading
  const fallbackTripVibes = [
    { 
      name: 'Beach Getaway', 
      image: '/images/quick1.avif',
      destinations: 'Goa, Andaman, Kovalam',
      trips: []
    },
    { 
      name: 'Mountain Retreat', 
      image: '/images/quick2.avif',
      destinations: 'Shimla, Manali, Darjeeling',
      trips: []
    },
    { 
      title: 'Cultural Experience', 
      image: '/images/quick3.avif',
      destinations: 'Jaipur, Varanasi, Hampi',
      trips: []
    },
    { 
      title: 'Wildlife Adventure', 
      image: '/images/quick4.avif',
      destinations: 'Ranthambore, Kaziranga, Jim Corbett',
      trips: []
    },
    { 
      title: 'City Exploration', 
      image: '/images/quick5.avif',
      destinations: 'Delhi, Mumbai, Bangalore',
      trips: []
    },
    { 
      title: 'Heritage Sites', 
      image: '/images/quick6.avif',
      destinations: 'Agra, Khajuraho, Ajanta & Ellora',
      trips: []
    }
  ];

  useEffect(() => {
    const fetchTripVibes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tavellings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trip data');
        }
        
        const data = await response.json();
        console.log("Response: ", data);
        
        // Limit trips to maximum of 6
        const limitedTrips = data.slice(0, 6);
        setTripVibes(limitedTrips);
        setError(null);
      } catch (err) {
        console.error('Error fetching trip vibes:', err);
        setError('Failed to load trip vibes. Using default data instead.');
        // Uncomment the following line if you want to use fallback data on error
        // setTripVibes(fallbackTripVibes.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };

    fetchTripVibes();
  }, []);

  const handleVibeClick = (tripId: string) => {
    // Navigate to a filtered trips page or open a modal with trips of this vibe
    console.log(`Clicked on vibe: ${tripId}`);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-2 text-center">Quick and Easy Trip Planner</h2>
      <p className="text-xl text-gray-600 mb-8 text-center">Pick a vibe and explore the top destinations in India</p>
      
      {error && <p className="text-center text-amber-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Show only 6 skeleton loaders while loading
          [...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg h-52 animate-pulse"></div>
          ))
        ) : (
          tripVibes.map((vibe) => (
            <div 
              key={vibe.title} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 group cursor-pointer"
              onClick={() => handleVibeClick(vibe.tripId)}
            >
              <div className="relative h-52 overflow-hidden">
                <Image 
                  src={vibe?.bannerImage?.url} 
                  alt={vibe?.bannerImage?.alt || vibe.title}
                  width={500}
                  height={500}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-4 text-white">
                    <h3 className="text-xl font-bold">{vibe.title}</h3>
                    {/* <p className="text-white/80">{vibe.destinations}</p> */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/customer/trips">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300">
            Explore All Trips
          </button>
        </Link>
      </div>
    </div>
  );
}