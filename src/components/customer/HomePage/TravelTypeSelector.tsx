'use client';

import React from 'react';
import { Hotel, Plane, Car } from 'lucide-react';
// import { TransportationType } from '@/types';

type TravelTypeSelectorProps = {
  searchType: 'stays' | 'flights' | 'car-rentals';
  setSearchType: (type: 'stays' | 'flights' | 'car-rentals') => void;
};

export default function TravelTypeSelector({ searchType, setSearchType }: TravelTypeSelectorProps) {
  const travelTypes = [
    { 
      icon: <Hotel className="w-6 h-6 text-[#003c95]" />, 
      label: 'Stays', 
      type: 'stays' 
    },
    { 
      icon: <Plane className="w-6 h-6 text-[#003c95]" />, 
      label: 'Flights', 
      type: 'flights' 
    },
    { 
      icon: <Car className="w-6 h-6 text-[#003c95]" />, 
      label: 'Car Rentals', 
      type: 'car-rentals' 
    }
  ];

  return (
    <div className="flex space-x-4 mb-4">
      {travelTypes.map((type) => (
        <button
          key={type.type}
          onClick={() => setSearchType(type.type as 'flights' | 'stays' | 'car-rentals')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            searchType === type.type 
              ? 'bg-white text-[#003c95]' 
              : 'bg-[#003c95] text-white hover:bg-[#003c95]'
          }`}
        >
          {type.icon}
          <span>{type.label}</span>
        </button>
      ))}
    </div>
  );
}