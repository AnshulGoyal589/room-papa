"use client"

import { PropertyType } from '@/types';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Property {
  _id: string;
  title: string;
  costing: {
    price: number;
    discountedPrice: number;
    currency: string;
  };
  bannerImage: {
    url: string;
  };
  type: PropertyType;
  location: {
    city: string;
    state : string;
    country: string;
  };

}

export default function UniqueProperties(): React.ReactElement {

  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (id: string) => {
    router.push(`/customer/properties/${id}`);
  };
  const handleProperties = () => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('category', 'property');
    router.push(`/customer/search?${params.toString()}`);
  };

  useEffect(() => {
    const fetchProperties = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties');
        
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



  if (loading) {
    return (
      <div className="bg-gray-100 py-16 px-4 text-center">
        <div className="container mx-auto">
          <p>Loading unique properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 py-16 px-4 text-center">
        <div className="container mx-auto">
          <p className="text-red-500">Error: {error}</p>
          <p>Unable to load properties at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center">Stay at Our Top Unique Properties</h2>
        <p className="text-xl text-gray-600 mb-8 text-center">From villas and apartments to hotels and resorts, we've got it all</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.slice(0, 4).map((property) => (
            <div 
              key={property._id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300"
              onClick={() => handleSearch(property._id)}
            >
              <div className="relative">
                <Image
                  src={property.bannerImage.url} 
                  height={500}
                  width={500}
                  alt={property.title}
                  className="w-full h-60 object-cover"
                />
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                  {property.type}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1">{property.title}</h3>
                <p className="text-gray-500 mb-2">{property.location.city}, {property.location.country}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">
                    {(property.costing.price, property.costing.currency)}
                  </span>
                  <button className="text-sm text-blue-600 hover:underline" onClick = {() => handleProperties()}>
                    View Details
                  </button>
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
              handleProperties();
            }}
          >
          More Properties
         </button>
        </div>
      </div>
    </div>
  );
}