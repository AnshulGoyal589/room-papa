'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Users, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SearchFormProps = {
  defaultCategory: 'property' | 'trip' | 'travelling';
};

export default function SearchForm({ defaultCategory = 'property' }: SearchFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);

  const handleSearch = () => {
    // Build the query parameters
    const params = new URLSearchParams();
    
    // Common parameters for search results component
    params.set('sortBy', 'createdAt');
    params.set('sortOrder', 'desc');
    params.set('page', '1');
    params.set('category', category);
    
    // Add location based on the category field naming in the results component
    if (location) {
      if (category === 'property') {
        params.set('location.city', location);
      } else if (category === 'trip' || category === 'travelling') {
        params.set('destination.city', location);
      }
    }
    
    // Add dates based on the category
    if (startDate) {
      params.set('startDate', startDate);
    }
    
    if (endDate) {
      params.set('endDate', endDate);
    }
    
    // Add guests parameter
    if (guests > 0) {
      if (category === 'property') {
        params.set('maximumGuests', guests.toString());
      } else {
        params.set('guests', guests.toString());
      }
    }
    
    // Add some default parameters based on category
    if (category === 'property') {
      params.set('rating', '4');
      params.set('propertyType', 'villa');
    } else if (category === 'trip') {
      params.set('status', 'active');
    } else if (category === 'travelling') {
      params.set('visibility', 'public');
      params.set('activityCategory', 'dining');
    }
    
    // Navigate to search results page with parameters
    router.push(`/customer/search?${params.toString()}`);
    
    console.log('Searching:', { 
      category,
      location, 
      startDate, 
      endDate, 
      guests,
      params: params.toString()
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-center mb-4 space-x-2">
        <button
          onClick={() => setCategory('property')}
          className={`px-4 py-2 rounded-md transition-colors ${
            category === 'property' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Stays
        </button>
        <button
          onClick={() => setCategory('trip')}
          className={`px-4 py-2 rounded-md transition-colors ${
            category === 'trip' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Trips
        </button>
        <button
          onClick={() => setCategory('travelling')}
          className={`px-4 py-2 rounded-md transition-colors ${
            category === 'travelling' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Itineraries
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-gray-700 mb-2">Location</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <MapPin className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700 mb-2">
            {category === 'property' ? 'Check-in' : 'Start Date'}
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Calendar className="text-gray-400 mr-2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700 mb-2">
            {category === 'property' ? 'Check-out' : 'End Date'}
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Calendar className="text-gray-400 mr-2" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700 mb-2">
            {category === 'property' ? 'Guests' : category === 'trip' ? 'Travelers' : 'People'}
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Users className="text-gray-400 mr-2" />
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={handleSearch}
          className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition duration-300 flex items-center justify-center space-x-2 mx-auto"
        >
          <Search size={20} />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
}