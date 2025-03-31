import React from 'react';
import { Calendar } from 'lucide-react';
import Image from 'next/image';

export default function WeekendDeals() {
  const weekendDeals = [
    { 
      name: 'Luxury Resort Spa Package',
      location: 'Udaipur, Rajasthan',
      image: '/images/weekend1.avif',
      originalPrice: '₹22,500',
      discountedPrice: '₹16,999',
      discount: '25% OFF',
      dates: 'Valid for next 3 weekends'
    },
    { 
      name: 'Beach Villa Getaway',
      location: 'Goa',
      image: '/images/weekend2.avif',
      originalPrice: '₹18,000',
      discountedPrice: '₹13,499',
      discount: '30% OFF',
      dates: 'Valid for next 3 weekends'
    },
    { 
      name: 'Hill Station Retreat',
      location: 'Munnar, Kerala',
      image: '/images/weekend3.avif',
      originalPrice: '₹12,500',
      discountedPrice: '₹8,999',
      discount: '28% OFF',
      dates: 'Valid for next 3 weekends'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center">Deals for the Weekend</h2>
        <p className="text-xl text-gray-600 mb-8 text-center">Special offers to make your weekend special</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {weekendDeals.map((deal) => (
            <div 
              key={deal.name} 
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300"
            >
              <div className="relative">
                <Image 
                  src={deal.image} 
                  alt={deal.name}
                  height={500}
                  width={500}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1">
                  {deal.discount}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold">{deal.name}</h3>
                <p className="text-gray-500 mb-3">{deal.location}</p>
                
                <div className="flex items-center mb-3 text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">{deal.dates}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 line-through text-sm">{deal.originalPrice}</span>
                    <span className="text-xl font-bold text-blue-600 ml-2">{deal.discountedPrice}</span>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition duration-300">
            View All Weekend Deals
          </button>
        </div>
      </div>
    </div>
  );
}