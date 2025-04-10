'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Basic property filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [rooms, setRooms] = useState<string>('');
  const [starRating, setStarRating] = useState<string[]>([]);
  
  // Date filters
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  
  // Amenities filters
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // Popular filters
  const [popularFilters, setPopularFilters] = useState<string[]>([]);
  
  // Activities filters
  const [activities, setActivities] = useState<string[]>([]);
  
  // Meals filters
  const [mealPlans, setMealPlans] = useState<string[]>([]);
  
  // Reservation policy filters
  const [reservationPolicies, setReservationPolicies] = useState<string[]>([]);
  
  // Brand filters
  const [brands, setBrands] = useState<string[]>([]);

  // Handle filter changes and update URL params
  const updateFilters = () => {
    const params: { [key: string]: string | undefined } = {
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      propertyType: propertyType || undefined,
      rooms: rooms || undefined,
      starRating: starRating.length > 0 ? starRating.join(',') : undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      amenities: amenities.length > 0 ? amenities.join(',') : undefined,
      popularFilters: popularFilters.length > 0 ? popularFilters.join(',') : undefined,
      activities: activities.length > 0 ? activities.join(',') : undefined,
      mealPlans: mealPlans.length > 0 ? mealPlans.join(',') : undefined,
      reservationPolicies: reservationPolicies.length > 0 ? reservationPolicies.join(',') : undefined,
      brands: brands.length > 0 ? brands.join(',') : undefined,
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    // Construct URL search params
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    router.push(`?${queryString}`);
  };

  // Auto-update URL whenever filters change
  useEffect(() => {
    updateFilters();
  }, [
    minPrice, maxPrice, propertyType, rooms, starRating, 
    checkIn, checkOut, amenities, popularFilters, 
    activities, mealPlans, reservationPolicies, brands
  ]);

  // Sync state with URL params on mount
  useEffect(() => {
    if (searchParams) {
      setMinPrice(searchParams.get('minPrice') || '');
      setMaxPrice(searchParams.get('maxPrice') || '');
      setPropertyType(searchParams.get('propertyType') || '');
      setRooms(searchParams.get('rooms') || '');
      setStarRating(searchParams.get('starRating')?.split(',') || []);
      setCheckIn(searchParams.get('checkIn') || '');
      setCheckOut(searchParams.get('checkOut') || '');
      setAmenities(searchParams.get('amenities')?.split(',') || []);
      setPopularFilters(searchParams.get('popularFilters')?.split(',') || []);
      setActivities(searchParams.get('activities')?.split(',') || []);
      setMealPlans(searchParams.get('mealPlans')?.split(',') || []);
      setReservationPolicies(searchParams.get('reservationPolicies')?.split(',') || []);
      setBrands(searchParams.get('brands')?.split(',') || []);
    }
  }, [searchParams]);

  // Helper function for checkbox filters
  const handleCheckboxChange = (value: string, currentState: string[], stateSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentState.includes(value)) {
      stateSetter(currentState.filter(item => item !== value));
    } else {
      stateSetter([...currentState, value]);
    }
  };

  return (
    <div className="w-full lg:w-1/4 bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      {/* Check-in and Check-out Dates */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Check-in Date</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="border rounded-md p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Check-out Date</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="border rounded-md p-2 w-full"
        />
      </div>

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
          <option value="homestay">Homestay</option>
          <option value="resort">Resort</option>
          <option value="guesthouse">Guesthouse</option>
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
          min="1"
        />
      </div>

      {/* Star Rating Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Star Rating</label>
        <div className="space-y-2">
          {['1', '2', '3', '4', '5'].map((star) => (
            <label key={star} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={starRating.includes(star)}
                onChange={() => handleCheckboxChange(star, starRating, setStarRating)}
                className="form-checkbox"
              />
              <span>{star} Stars</span>
            </label>
          ))}
        </div>
      </div>

      {/* Popular Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Popular Filters</label>
        <div className="space-y-2">
          {[
            'Free cancellation',
            'No prepayment',
            'Homestays',
            'Hotels',
            'Book without credit card',
            'Breakfast & dinner included',
            'Swimming Pool'
          ].map((filter) => (
            <label key={filter} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={popularFilters.includes(filter)}
                onChange={() => handleCheckboxChange(filter, popularFilters, setPopularFilters)}
                className="form-checkbox"
              />
              <span>{filter}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fun Activities */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Fun Things to Do</label>
        <div className="space-y-2">
          {[
            'Bike tours',
            'Walking tours',
            'Bicycle rental',
            'Hiking',
            'Evening entertainment'
          ].map((activity) => (
            <label key={activity} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={activities.includes(activity)}
                onChange={() => handleCheckboxChange(activity, activities, setActivities)}
                className="form-checkbox"
              />
              <span>{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Meal Plans */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Meals</label>
        <div className="space-y-2">
          {[
            'Self catering',
            'Breakfast included',
            'All meals included',
            'All-inclusive',
            'Breakfast & lunch included',
            'Breakfast & dinner included'
          ].map((meal) => (
            <label key={meal} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={mealPlans.includes(meal)}
                onChange={() => handleCheckboxChange(meal, mealPlans, setMealPlans)}
                className="form-checkbox"
              />
              <span>{meal}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amenities</label>
        <div className="space-y-2">
          {[
            'WiFi',
            'Parking',
            'Pool',
            'Gym',
            'Spa',
            'Air conditioning',
            'Restaurant',
            'Room service',
            'Bar',
            'Family rooms',
            'Pet friendly',
            'Disabled facilities'
          ].map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => handleCheckboxChange(amenity, amenities, setAmenities)}
                className="form-checkbox"
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reservation Policies */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Reservation Policy</label>
        <div className="space-y-2">
          {[
            'Free cancellation',
            'Book without credit card',
            'No prepayment'
          ].map((policy) => (
            <label key={policy} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reservationPolicies.includes(policy)}
                onChange={() => handleCheckboxChange(policy, reservationPolicies, setReservationPolicies)}
                className="form-checkbox"
              />
              <span>{policy}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Brands</label>
        <div className="space-y-2">
          {[
            'StayVista',
            'FabHotels',
            'OYO Rooms',
            'Zostel',
            'Moustache Escapes',
            'The Hosteller'
          ].map((brand) => (
            <label key={brand} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={brands.includes(brand)}
                onChange={() => handleCheckboxChange(brand, brands, setBrands)}
                className="form-checkbox"
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear All Filters Button */}
      <button
        onClick={() => {
          setMinPrice('');
          setMaxPrice('');
          setPropertyType('');
          setRooms('');
          setStarRating([]);
          setCheckIn('');
          setCheckOut('');
          setAmenities([]);
          setPopularFilters([]);
          setActivities([]);
          setMealPlans([]);
          setReservationPolicies([]);
          setBrands([]);
        }}
        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md w-full hover:bg-gray-300 transition-all mb-2"
      >
        Clear All Filters
      </button>
    </div>
  );
}