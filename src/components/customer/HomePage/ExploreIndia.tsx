import React from 'react';
import { MapPin } from 'lucide-react';

export default function ExploreIndia() {
  const indianDestinations = [
    { 
      name: 'Delhi', 
      image: '/images/explore1.avif',
      description: 'History & heritage sites',
      properties: '1,245+ properties'
    },
    { 
      name: 'Mumbai', 
      image: '/images/explore2.avif',
      description: 'Coastal metropolis',
      properties: '1,890+ properties'
    },
    { 
      name: 'Jaipur', 
      image: '/images/explore3.avif',
      description: 'Royal palaces & forts',
      properties: '875+ properties'
    },
    { 
      name: 'Goa', 
      image: '/images/explore4.avif',
      description: 'Beaches & nightlife',
      properties: '1,120+ properties'
    },
    { 
      name: 'Shimla', 
      image: '/images/explore5.avif',
      description: 'Hill station retreat',
      properties: '645+ properties'
    },
    { 
      name: 'Kochi', 
      image: '/images/explore6.avif',
      description: 'Coastal cultural hub',
      properties: '720+ properties'
    }
  ];

  return (
    <div className="container mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-2 text-center">Explore India</h2>
      <p className="text-xl text-gray-600 mb-8 text-center">These popular destinations have a lot to offer</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {indianDestinations.map((destination) => (
          <div 
            key={destination.name} 
            className="relative group overflow-hidden rounded-lg shadow-md"
          >
            <img 
              src={destination.image} 
              alt={destination.name}
              className="w-full h-64 object-cover group-hover:scale-110 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
              <h3 className="text-2xl font-bold text-white">{destination.name}</h3>
              <p className="text-white/80 mb-2">{destination.description}</p>
              <div className="flex items-center text-white/90">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{destination.properties}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300">
          Discover All of India
        </button>
      </div>
    </div>
  );
}