'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyType, TransportationType } from '@/types';



const categoryOptions = {
  propertyAccessibility: ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'],
  roomAccessibility: ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'],
  popularFilters: ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'],
  funThingsToDo: ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'],
  meals: ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'],
  facilities: ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'],
  bedPreference: ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'],
  reservationPolicy: ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'],
  brands: ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'],
  roomFacilities: ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower'],
  travellingAccessibility: ['Priority Boarding', 'Wheelchair Assistance', 'Accessible Seating', 'Special Meal Options', 'Medical Assistance']
};

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter mode (Property, Travelling, Trip)
  const [filterMode, setFilterMode] = useState<'property' | 'travelling' | 'trip'>('property');

  // Common filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  // const [totalRating, setTotalRating] = useState<string>('');

  // Basic property filters
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [propertyRating, setPropertyRating] = useState<string>('');
  const [roomAccessibility, setRoomAccessibility] = useState<string[]>([]);
  const [bedPreference, setBedPreference] = useState<string[]>([]);
  const [roomFacilities, setRoomFacilities] = useState<string[]>([]);
  
  // Transportation filters (for Travelling)
  const [transportationType, setTransportationType] = useState<TransportationType | ''>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  
  // Trip filters
  const [tripType, setTripType] = useState<string>(''); // Domestic or International
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  
  // Category filters using the categoryOptions
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [popularFilters, setPopularFilters] = useState<string[]>([]);
  const [funThingsToDo, setFunThingsToDo] = useState<string[]>([]);
  const [meals, setMeals] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [reservationPolicy, setReservationPolicy] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);

  // Handle filter changes and update URL params
  const updateFilters = () => {

    
    const scrollPosition = window.scrollY;


    const params: { [key: string]: string | undefined } = {
      category: filterMode,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      currency: currency || undefined,
    };


    // Add mode-specific params
    
    if (filterMode === 'property') {
      params.propertyType = propertyType || undefined;
      params.propertyRating = propertyRating || undefined;
      params.roomAccessibility = roomAccessibility.length > 0 ? roomAccessibility.join(',') : undefined;
      params.bedPreference = bedPreference.length > 0 ? bedPreference.join(',') : undefined;
      params.roomFacilities = roomFacilities.length > 0 ? roomFacilities.join(',') : undefined;
    } else if (filterMode === 'travelling') {
      params.transportationType = transportationType || undefined;
      params.arrivalTime = arrivalTime || undefined;
      params.departureTime = departureTime || undefined;
      params.fromLocation = fromLocation || undefined;
      params.toLocation = toLocation || undefined;
    } else if (filterMode === 'trip') {
      params.tripType = tripType || undefined;
      params.city = city || undefined;
      params.state = state || undefined;
      params.country = country || undefined;
    }
    
    // Common category filters
    params.accessibility = accessibility.length > 0 ? accessibility.join(',') : undefined;
    params.popularFilters = popularFilters.length > 0 ? popularFilters.join(',') : undefined;
    params.funThingsToDo = funThingsToDo.length > 0 ? funThingsToDo.join(',') : undefined;
    params.meals = meals.length > 0 ? meals.join(',') : undefined;
    params.facilities = facilities.length > 0 ? facilities.join(',') : undefined;
    params.reservationPolicy = reservationPolicy.length > 0 ? reservationPolicy.join(',') : undefined;
    params.brands = brands.length > 0 ? brands.join(',') : undefined;
    params.amenities = amenities.length > 0 ? amenities.join(',') : undefined;

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    // Construct URL search params
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    router.push(`?${queryString}`);
    window.scrollTo(0, scrollPosition);
  };

  // Auto-update URL whenever filters change
  useEffect(() => {
    updateFilters();
  }, [
    filterMode, minPrice, maxPrice, currency,
    propertyType, propertyRating, accessibility, roomAccessibility, bedPreference, roomFacilities,
    transportationType, arrivalTime, departureTime, fromLocation, toLocation,
    tripType, city, state, country,
    popularFilters, funThingsToDo, meals, facilities, reservationPolicy, brands, amenities
  ]);

  // Sync state with URL params on mount
  useEffect(() => {
    if (searchParams) {
      // Get the filter mode
      const mode = searchParams.get('mode');
      if (mode === 'property' || mode === 'travelling' || mode === 'trip') {
        setFilterMode(mode);
      }

      // Common filters
      setMinPrice(searchParams.get('minPrice') || '');
      setMaxPrice(searchParams.get('maxPrice') || '');
      setCurrency(searchParams.get('currency') || 'USD');

      // Property filters
      setPropertyType((searchParams.get('propertyType') as PropertyType) || '');
      setPropertyRating(searchParams.get('propertyRating') || '');
      setRoomAccessibility(searchParams.get('roomAccessibility')?.split(',') || []);
      setBedPreference(searchParams.get('bedPreference')?.split(',') || []);
      setRoomFacilities(searchParams.get('roomFacilities')?.split(',') || []);

      // Travelling filters
      setTransportationType((searchParams.get('transportationType') as TransportationType) || '');
      setArrivalTime(searchParams.get('arrivalTime') || '');
      setDepartureTime(searchParams.get('departureTime') || '');
      setFromLocation(searchParams.get('fromLocation') || '');
      setToLocation(searchParams.get('toLocation') || '');
      // setTravellingRating(searchParams.get('travellingRating') || '');
      // setTravellingAccessibility(searchParams.get('travellingAccessibility')?.split(',') || []);
      
      // Trip filters
      setTripType(searchParams.get('tripType') || '');
      setCity(searchParams.get('city') || '');
      setState(searchParams.get('state') || '');
      setCountry(searchParams.get('country') || '');
      
      // Common category filters
      setAccessibility(searchParams.get('accessibility')?.split(',') || []);
      setAmenities(searchParams.get('amenities')?.split(',') || []);
      setPopularFilters(searchParams.get('popularFilters')?.split(',') || []);
      setFunThingsToDo(searchParams.get('funThingsToDo')?.split(',') || []);
      setMeals(searchParams.get('meals')?.split(',') || []);
      setFacilities(searchParams.get('facilities')?.split(',') || []);
      setReservationPolicy(searchParams.get('reservationPolicy')?.split(',') || []);
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

  // Helper function to clear all filters
  const clearAllFilters = () => {
    // Common filters
    setMinPrice('');
    setMaxPrice('');
    setCurrency('USD');

    // Property filters
    setPropertyType('');
    setPropertyRating('');
    setRoomAccessibility([]);
    setBedPreference([]);
    setRoomFacilities([]);
    
    // Travelling filters
    setTransportationType('');
    setArrivalTime('');
    setDepartureTime('');
    setFromLocation('');
    setToLocation('');
    
    // Trip filters
    setTripType('');
    setCity('');
    setState('');
    setCountry('');

    // Common category filters
    setAccessibility([]);
    setAmenities([]);
    setPopularFilters([]);
    setFunThingsToDo([]);
    setMeals([]);
    setFacilities([]);
    setReservationPolicy([]);
    setBrands([]);
  };

  return (
    <div className="w-full bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      {/* Filter Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Filter Type</label>
        <div className="flex justify-between">
          <button
            onClick={() => setFilterMode('property')}
            className={`px-4 py-2 rounded-md ${filterMode === 'property' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Property
          </button>
          <button
            onClick={() => setFilterMode('travelling')}
            className={`px-4 py-2 rounded-md ${filterMode === 'travelling' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Travel
          </button>
          <button
            onClick={() => setFilterMode('trip')}
            className={`px-4 py-2 rounded-md ${filterMode === 'trip' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Trip
          </button>
        </div>
      </div>

      {/* Price Range Filter (Common) */}
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

      {/* Currency Selection (Common) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border rounded-md p-2 w-full"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="INR">INR</option>
          <option value="JPY">JPY</option>
        </select>
      </div>

      {/* Property-specific filters */}
      {filterMode === 'property' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="border rounded-md p-2 w-full"
            >
              <option value="">All</option>
              {Object.values(propertyType).map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Property Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Property Rating</label>
            <select
              value={propertyRating}
              onChange={(e) => setPropertyRating(e.target.value)}
              className="border rounded-md p-2 w-full"
            >
              <option value="0">Any</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          {/* Property Accessibility */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Property Accessibility</label>
            <div className="space-y-2">
              {categoryOptions.propertyAccessibility.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={accessibility.includes(item)}
                    onChange={() => handleCheckboxChange(item, accessibility, setAccessibility)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Room Accessibility */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Room Accessibility</label>
            <div className="space-y-2">
              {categoryOptions.roomAccessibility.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={roomAccessibility.includes(item)}
                    onChange={() => handleCheckboxChange(item, roomAccessibility, setRoomAccessibility)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bed Preference */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Bed Preference</label>
            <div className="space-y-2">
              {categoryOptions.bedPreference.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={bedPreference.includes(item)}
                    onChange={() => handleCheckboxChange(item, bedPreference, setBedPreference)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Room Facilities */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Room Facilities</label>
            <div className="space-y-2">
              {categoryOptions.roomFacilities.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={roomFacilities.includes(item)}
                    onChange={() => handleCheckboxChange(item, roomFacilities, setRoomFacilities)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Travelling-specific filters */}
      {filterMode === 'travelling' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Transportation Type</label>
            <select
              value={transportationType}
              onChange={(e) => setTransportationType(e.target.value as TransportationType)}
              className="border rounded-md p-2 w-full"
            >
              <option value="">All</option>
              {Object.values(transportationType).map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Departure Time</label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Arrival Time</label>
            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="text"
              placeholder="Departure location"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="text"
              placeholder="Arrival location"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          {/* Travelling Accessibility */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Travel Accessibility</label>
            <div className="space-y-2">
              {categoryOptions.travellingAccessibility.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={accessibility.includes(item)}
                    onChange={() => handleCheckboxChange(item, accessibility, setAccessibility)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Trip-specific filters */}
      {filterMode === 'trip' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Trip Type</label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="border rounded-md p-2 w-full"
            >
              <option value="">All</option>
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">State/Province</label>
            <input
              type="text"
              placeholder="State/Province"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Country</label>
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border rounded-md p-2 w-full"
            />
          </div>

          {/* Trip Accessibility */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Trip Accessibility</label>
            <div className="space-y-2">
              {categoryOptions.travellingAccessibility.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={accessibility.includes(item)}
                    onChange={() => handleCheckboxChange(item, accessibility, setAccessibility)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Common category filters that apply to all modes */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amenities</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {[
            'WiFi', 'Parking', 'Pool', 'Gym', 'Air conditioning', 'Pet friendly', 'Restaurant', 
            'Room service', 'Disabled facilities', 'TV', 'Laundry', 'Kitchen'
          ].map((item) => (
            <label key={item} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={amenities.includes(item)}
                onChange={() => handleCheckboxChange(item, amenities, setAmenities)}
                className="form-checkbox"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Popular Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Popular Filters</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {categoryOptions.popularFilters.map((item) => (
            <label key={item} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={popularFilters.includes(item)}
                onChange={() => handleCheckboxChange(item, popularFilters, setPopularFilters)}
                className="form-checkbox"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fun Things To Do */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Fun Things to Do</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {categoryOptions.funThingsToDo.map((item) => (
            <label key={item} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={funThingsToDo.includes(item)}
                onChange={() => handleCheckboxChange(item, funThingsToDo, setFunThingsToDo)}
                className="form-checkbox"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Meals</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {categoryOptions.meals.map((item) => (
            <label key={item} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={meals.includes(item)}
                onChange={() => handleCheckboxChange(item, meals, setMeals)}
                className="form-checkbox"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Facilities */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Facilities</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
        {categoryOptions.facilities.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={facilities.includes(item)}
                    onChange={() => handleCheckboxChange(item, facilities, setFacilities)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

      {/* Reservation Policy */}
      <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Reservation Policy</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categoryOptions.reservationPolicy.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reservationPolicy.includes(item)}
                    onChange={() => handleCheckboxChange(item, reservationPolicy, setReservationPolicy)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
      </div>

      {/* Brands */}
      <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Brands</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categoryOptions.brands.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={brands.includes(item)}
                    onChange={() => handleCheckboxChange(item, brands, setBrands)}
                    className="form-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
      </div>

      {/* Clear All Filters Button */}
      <button
            onClick={clearAllFilters}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md w-full hover:bg-gray-300 transition-all mb-2"
          >
            Clear All Filters
      </button>

      {/* Apply Filters Button */}
      <button
            onClick={updateFilters}
            className="bg-blue-500 text-white py-2 px-4 rounded-md w-full hover:bg-blue-600 transition-all"
          >
            Apply Filters
      </button>
    </div>
  );
}