'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Users } from 'lucide-react';

type SearchFormProps = {
  searchType: 'stays' | 'flights' | 'car-rentals';
};

export default function SearchForm({ searchType }: SearchFormProps) {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const handleSearch = () => {
    
    console.log('Searching:', { 
      type: searchType, 
      destination, 
      checkIn, 
      checkOut, 
      guests 
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-gray-700 mb-2">Destination</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <MapPin className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700 mb-2">Check-in</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Calendar className="text-gray-400 mr-2" />
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700 mb-2">Check-out</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Calendar className="text-gray-400 mr-2" />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700 mb-2">Guests</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Users className="text-gray-400 mr-2" />
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full text-gray-700 focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={handleSearch}
          className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition duration-300"
        >
          Search
        </button>
      </div>
    </div>
  );
}