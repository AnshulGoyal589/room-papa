import Image from 'next/image';
import React from 'react';

export default function PopularDestinations() {
  const popularDestinations = [
    { name: 'Paris', image: '/images/popular1.avif' },
    { name: 'Maldives', image: '/images/popular2.avif' },
    { name: 'Tokyo', image: '/images/popular3.avif' },
    { name: 'New York', image: '/images/popular4.avif' }
  ];

  return (
    <div className="container mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center">Popular Destinations</h2>
      <div className="grid md:grid-cols-4 gap-6">
        {popularDestinations.map((destination) => (
          <div 
            key={destination.name} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300"
          >
            <Image 
              src={destination.image} 
              width={500}
              height={500}
              alt={destination.name} 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold">{destination.name}</h3>
              <p className="text-gray-500">Discover amazing experiences</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}