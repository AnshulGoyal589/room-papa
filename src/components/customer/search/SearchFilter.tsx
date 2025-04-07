'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // States for filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [rooms, setRooms] = useState<string>('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  // Handle filter changes and update URL params
  const updateFilters = () => {
    const params: { [key: string]: string | undefined } = {
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      propertyType: propertyType || undefined,
      rooms: rooms || undefined,
      amenities: amenities.length > 0 ? amenities.join(',') : undefined,
      city: city || undefined,
      country: country || undefined,
    };

    // Construct URL search params
    const queryString = new URLSearchParams(params).toString();
    router.push(`?${queryString}`);
  };

  // Sync state with URL params on mount
  useEffect(() => {
    if (searchParams) {
      setMinPrice(searchParams.get('minPrice') || '');
      setMaxPrice(searchParams.get('maxPrice') || '');
      setPropertyType(searchParams.get('propertyType') || '');
      setRooms(searchParams.get('rooms') || '');
      setAmenities(searchParams.get('amenities')?.split(',') || []);
      setCity(searchParams.get('city') || '');
      setCountry(searchParams.get('country') || '');
    }
  }, [searchParams]);

  return (
    <div className="w-full lg:w-1/4 bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      {/* Price Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Price Range</label>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="border rounded-md p-2 w-full"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="border rounded-md p-2 w-full"
          />
        </div>
      </div>

      {/* Property Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Property Type</label>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="border rounded-md p-2 w-full"
        >
          <option value="">All</option>
          <option value="hotel">Hotel</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="hostel">Hostel</option>
        </select>
      </div>

      {/* Rooms Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Rooms</label>
        <input
          type="number"
          placeholder="Number of rooms"
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
          className="border rounded-md p-2 w-full"
        />
      </div>

      {/* Amenities Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Amenities</label>
        <div className="space-y-2">
          {['WiFi', 'Parking', 'Pool', 'Gym', 'Spa'].map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAmenities([...amenities, amenity]);
                  } else {
                    setAmenities(amenities.filter((a) => a !== amenity));
                  }
                }}
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">City</label>
        <input
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border rounded-md p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Country</label>
        <input
          type="text"
          placeholder="Enter country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border rounded-md p-2 w-full"
        />
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={updateFilters}
        className="bg-blue-600 text-white py-2 px-4 rounded-md w-full hover:bg-blue-700 transition-all"
      >
        Apply Filters
      </button>
    </div>
  );
}
