import Image from 'next/image';
import React from 'react';

export default function PropertyTypes() {
  const propertyTypes = [
    { 
      type: 'Hotels', 
      image: '/images/property1.avif',
      count: '3,245 properties'
    },
    { 
      type: 'Resorts', 
      image: '/images/property2.avif',
      count: '890 properties'
    },
    { 
      type: 'Apartments', 
      image: '/images/property3.avif',
      count: '1,567 properties'
    },
    { 
      type: 'Villas', 
      image: '/images/property4.avif',
      count: '672 properties'
    }
  ];

  return (
    <div className="container mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center">Browse by Property Type</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {propertyTypes.map((property) => (
          <div 
            key={property.type} 
            className="group cursor-pointer"
          >
            <div className="rounded-lg overflow-hidden shadow-md mb-3">
              <Image 
                src={property.image} 
                alt={property.type}
                height={500}
                width={500}
                className="w-full h-52 object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <h3 className="text-xl font-semibold text-center">{property.type}</h3>
            <p className="text-gray-500 text-center">{property.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}