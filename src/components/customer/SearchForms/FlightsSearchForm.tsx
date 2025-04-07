import React, { useState } from 'react';

export default function FlightsSearchForm() {
  const [location, setLocation] = useState('');
  const [dates, setDates] = useState('');
  const [guests, setGuests] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (dates) params.set('dates', dates);
    if (guests) params.set('guests', guests);

    // Update the URL
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  return (
    <div className="bg-opacity-30 p-4 rounded-lg">
      <div className="flex flex-wrap -mx-1">
        {/* Location Input */}
        <div className="w-full md:w-1/3 p-1">
          <input
            type="text"
            placeholder="Where are you going?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-3 rounded-md"
          />
        </div>

        {/* Dates Input */}
        <div className="w-full md:w-1/3 p-1">
          <input
            type="text"
            placeholder="Dates"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            className="w-full p-3 rounded-md"
          />
        </div>

        {/* Guests Input */}
        <div className="w-full md:w-1/3 p-1">
          <input
            type="text"
            placeholder="Guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full p-3 rounded-md"
          />
        </div>

        {/* Search Button */}
        <div className="w-full md:w-1/12 p-1">
          <button
            onClick={handleSearch}
            className="bg-[#0071c2] hover:bg-[#005ea6] text-white w-full py-3 rounded-md font-bold"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
