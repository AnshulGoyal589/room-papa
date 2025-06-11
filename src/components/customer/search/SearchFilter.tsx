'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyType, TransportationType } from '@/types'; // Assuming these types are defined
import { categoryOptions } from '../../../../public/assets/data'; // Assuming this path is correct
import { Slider } from '@/components/ui/slider'; // Assuming this component exists

// Helper component for filter sections for better structure and styling consistency
const FilterSection: React.FC<{ title: string; children: React.ReactNode; show?: boolean }> = ({ title, children, show = true }) => {
  if (!show) return null;
  return (
    <div className="py-4 border-b border-gray-200 last:border-b-0">
      <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
};

// Helper component for checkbox items
const CheckboxItem: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}> = ({ id, label, checked, onChange }) => (
  <label htmlFor={id} className="flex items-center space-x-3 py-1.5 cursor-pointer group">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-5 w-5 text-blue-600 border-gray-400 rounded focus:ring-blue-500 focus:ring-offset-0 group-hover:border-blue-500"
    />
    <span className="text-sm text-gray-700 group-hover:text-blue-600">{label}</span>
  </label>
);


export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter mode (Property, Travelling, Trip)
  const [filterMode, setFilterMode] = useState<string>(searchParams?.get('category') || 'property');

  // Common filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

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

  // Fixed list for TransportationType options for the dropdown
  const transportationTypeOptions: { value: TransportationType; label: string }[] = [
    { value: 'flight', label: 'Flight' },
    { value: 'train', label: 'Train' },
    { value: 'bus', label: 'Bus' },
    { value: 'car', label: 'Car Rental' },
    { value: 'ferry', label: 'Ferry' },
  ];
  const propertyTypeOptions: { value: PropertyType; label: string }[] = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'resort', label: 'Resort' },
  ];


  const updateFilters = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const scrollPosition = window.scrollY;
      const params: { [key: string]: string | undefined } = {
        category: filterMode,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      };

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
      
      params.accessibility = accessibility.length > 0 ? accessibility.join(',') : undefined;
      params.popularFilters = popularFilters.length > 0 ? popularFilters.join(',') : undefined;
      params.funThingsToDo = funThingsToDo.length > 0 ? funThingsToDo.join(',') : undefined;
      params.meals = meals.length > 0 ? meals.join(',') : undefined;
      params.facilities = facilities.length > 0 ? facilities.join(',') : undefined;
      params.reservationPolicy = reservationPolicy.length > 0 ? reservationPolicy.join(',') : undefined;
      params.brands = brands.length > 0 ? brands.join(',') : undefined;
      params.amenities = amenities.length > 0 ? amenities.join(',') : undefined;

      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      router.push(`?${queryString}`, { scroll: false }); // Use scroll: false with manual scroll restoration
      window.scrollTo(0, scrollPosition);
    }, 1000);
  };

  useEffect(() => {
    updateFilters();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterMode, minPrice, maxPrice, propertyType, propertyRating, accessibility, roomAccessibility, bedPreference, roomFacilities, transportationType, arrivalTime, departureTime, fromLocation, toLocation, tripType, city, state, country, popularFilters, funThingsToDo, meals, facilities, reservationPolicy, brands, amenities
  ]);

  useEffect(() => {
    if (searchParams) {
      setFilterMode(searchParams.get('category') || 'property');
      setMinPrice(searchParams.get('minPrice') || '0');
      setMaxPrice(searchParams.get('maxPrice') || '200000');
      setPropertyType((searchParams.get('propertyType') as PropertyType) || '');
      setPropertyRating(searchParams.get('propertyRating') || '');
      setRoomAccessibility(searchParams.get('roomAccessibility')?.split(',').filter(Boolean) || []);
      setBedPreference(searchParams.get('bedPreference')?.split(',').filter(Boolean) || []);
      setRoomFacilities(searchParams.get('roomFacilities')?.split(',').filter(Boolean) || []);
      setTransportationType((searchParams.get('transportationType') as TransportationType) || '');
      setArrivalTime(searchParams.get('arrivalTime') || '');
      setDepartureTime(searchParams.get('departureTime') || '');
      setFromLocation(searchParams.get('fromLocation') || '');
      setToLocation(searchParams.get('toLocation') || '');
      setTripType(searchParams.get('tripType') || '');
      setCity(searchParams.get('city') || '');
      setState(searchParams.get('state') || '');
      setCountry(searchParams.get('country') || '');
      setAccessibility(searchParams.get('accessibility')?.split(',').filter(Boolean) || []);
      setAmenities(searchParams.get('amenities')?.split(',').filter(Boolean) || []);
      setPopularFilters(searchParams.get('popularFilters')?.split(',').filter(Boolean) || []);
      setFunThingsToDo(searchParams.get('funThingsToDo')?.split(',').filter(Boolean) || []);
      setMeals(searchParams.get('meals')?.split(',').filter(Boolean) || []);
      setFacilities(searchParams.get('facilities')?.split(',').filter(Boolean) || []);
      setReservationPolicy(searchParams.get('reservationPolicy')?.split(',').filter(Boolean) || []);
      setBrands(searchParams.get('brands')?.split(',').filter(Boolean) || []);
    }
  }, [searchParams]); // Only re-run if searchParams object itself changes

  const handleCheckboxChange = (value: string, currentState: string[], stateSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentState.includes(value)) {
      stateSetter(currentState.filter(item => item !== value));
    } else {
      stateSetter([...currentState, value]);
    }
  };

  const clearAllFilters = () => {
    setMinPrice('0'); // Reset to default min
    setMaxPrice('200000'); // Reset to default max
    setPropertyType('');
    setPropertyRating('');
    setRoomAccessibility([]);
    setBedPreference([]);
    setRoomFacilities([]);
    setTransportationType('');
    setArrivalTime('');
    setDepartureTime('');
    setFromLocation('');
    setToLocation('');
    setTripType('');
    setCity('');
    setState('');
    setCountry('');
    setAccessibility([]);
    setAmenities([]);
    setPopularFilters([]);
    setFunThingsToDo([]);
    setMeals([]);
    setFacilities([]);
    setReservationPolicy([]);
    setBrands([]);
  };

  const handlePriceChange = (value: [number, number]): void => {
    setMinPrice(value[0].toString());
    setMaxPrice(value[1].toString());
  };

  // Common input field styling
  const inputClassName = "block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 text-sm";
  // Common select field styling
  const selectClassName = "block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 text-sm";


  return (
    <div className="w-full bg-white p-5 shadow-md rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Filter by:</h2>
      </div>

      {/* Clear All Filters Button - Placed near the top or bottom as preferred */}
       <button
            onClick={clearAllFilters}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-150 mb-4"
          >
            Clear All Filters
      </button>

      {/* Price Range Filter */}
      <FilterSection title="Your budget (per night)">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-3">
            <div className="relative flex-1">
              <span className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-500">
                Min price
              </span>
              <div className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md text-sm text-gray-700 text-center">
                ₹{Number(minPrice).toLocaleString()}
              </div>
            </div>
            <span className="text-gray-400 pt-3">-</span>
            <div className="relative flex-1">
              <span className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-500">
                Max price
              </span>
              <div className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md text-sm text-gray-700 text-center">
                ₹{Number(maxPrice).toLocaleString()}
              </div>
            </div>
          </div>
          <Slider
            value={[Number(minPrice), Number(maxPrice)]}
            onValueChange={handlePriceChange}
            max={200000}
            min={0}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹{(0).toLocaleString()}</span>
            <span>₹{(200000).toLocaleString()}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Popular Filters" show={filterMode === 'property' || filterMode === 'travelling' || filterMode === 'trip'}>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.popularFilters.map((item) => (
            <CheckboxItem
              key={item}
              id={`popular-${item}`}
              label={item}
              checked={popularFilters.includes(item)}
              onChange={() => handleCheckboxChange(item, popularFilters, setPopularFilters)}
            />
          ))}
        </div>
      </FilterSection>
      
      <FilterSection title="Property Type" show={filterMode === 'property'}>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyType)}
          className={selectClassName}
        >
          <option value="">All property types</option>
          {propertyTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </FilterSection>

      <FilterSection title="Star Rating" show={filterMode === 'property'}>
        <select
          value={propertyRating}
          onChange={(e) => setPropertyRating(e.target.value)}
          className={selectClassName}
        >
          <option value="0">Any rating</option>
          {[1, 2, 3, 4, 5].map(star => (
            <option key={star} value={star.toString()}>{star} Star{star > 1 ? 's' : ''}</option>
          ))}
           <option value="unrated">Unrated</option>
        </select>
      </FilterSection>
      

      <FilterSection title="Property Accessibility" show={filterMode === 'property'}>
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.accessibility.map((item) => (
             <CheckboxItem
              key={item}
              id={`prop-access-${item}`}
              label={item}
              checked={accessibility.includes(item)}
              onChange={() => handleCheckboxChange(item, accessibility, setAccessibility)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Room Accessibility" show={filterMode === 'property'}>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.roomAccessibility.map((item) => (
            <CheckboxItem
              key={item}
              id={`room-access-${item}`}
              label={item}
              checked={roomAccessibility.includes(item)}
              onChange={() => handleCheckboxChange(item, roomAccessibility, setRoomAccessibility)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Bed Preference" show={filterMode === 'property'}>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.bedPreference.map((item) => (
            <CheckboxItem
              key={item}
              id={`bed-${item}`}
              label={item}
              checked={bedPreference.includes(item)}
              onChange={() => handleCheckboxChange(item, bedPreference, setBedPreference)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Room Facilities" show={filterMode === 'property'}>
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.roomFacilities.map((item) => (
            <CheckboxItem
              key={item}
              id={`room-fac-${item}`}
              label={item}
              checked={roomFacilities.includes(item)}
              onChange={() => handleCheckboxChange(item, roomFacilities, setRoomFacilities)}
            />
          ))}
        </div>
      </FilterSection>


      {/* Travelling-specific filters */}
      <FilterSection title="Transportation Type" show={filterMode === 'travelling'}>
        <select
          value={transportationType}
          onChange={(e) => setTransportationType(e.target.value as TransportationType)}
          className={selectClassName}
        >
          <option value="">All transportation</option>
          {transportationTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </FilterSection>
      
      <FilterSection title="Departure Time" show={filterMode === 'travelling'}>
        <input
          type="datetime-local"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="Arrival Time" show={filterMode === 'travelling'}>
        <input
          type="datetime-local"
          value={arrivalTime}
          onChange={(e) => setArrivalTime(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="From Location" show={filterMode === 'travelling'}>
        <input
          type="text"
          placeholder="e.g. New York JFK"
          value={fromLocation}
          onChange={(e) => setFromLocation(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="To Location" show={filterMode === 'travelling'}>
        <input
          type="text"
          placeholder="e.g. London LHR"
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="Travel Accessibility" show={filterMode === 'travelling'}>
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.accessibility.map((item) => ( // Using general accessibility options
             <CheckboxItem
              key={item}
              id={`travel-access-${item}`}
              label={item}
              checked={accessibility.includes(item)}
              onChange={() => handleCheckboxChange(item, accessibility, setAccessibility)}
            />
          ))}
        </div>
      </FilterSection>


      {/* Trip-specific filters */}
      <FilterSection title="Trip Type" show={filterMode === 'trip'}>
        <select
          value={tripType}
          onChange={(e) => setTripType(e.target.value)}
          className={selectClassName}
        >
          <option value="">All trip types</option>
          <option value="Domestic">Domestic</option>
          <option value="International">International</option>
        </select>
      </FilterSection>

      <FilterSection title="City" show={filterMode === 'trip'}>
        <input
          type="text"
          placeholder="e.g. Paris"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="State/Province" show={filterMode === 'trip'}>
        <input
          type="text"
          placeholder="e.g. California"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="Country" show={filterMode === 'trip'}>
        <input
          type="text"
          placeholder="e.g. France"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={inputClassName}
        />
      </FilterSection>

      <FilterSection title="Trip Accessibility" show={filterMode === 'trip'}>
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.accessibility.map((item) => ( // Using general accessibility options
             <CheckboxItem
              key={item}
              id={`trip-access-${item}`}
              label={item}
              checked={accessibility.includes(item)}
              onChange={() => handleCheckboxChange(item, accessibility, setAccessibility)}
            />
          ))}
        </div>
      </FilterSection>


      {/* Common category filters */}
      <FilterSection title="Amenities">
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {[
            'WiFi', 'Parking', 'Pool', 'Gym', 'Air conditioning', 'Pet friendly', 'Restaurant', 
            'Room service', 'Disabled facilities', 'TV', 'Laundry', 'Kitchen'
          ].map((item) => (
             <CheckboxItem
              key={item}
              id={`amenity-${item}`}
              label={item}
              checked={amenities.includes(item)}
              onChange={() => handleCheckboxChange(item, amenities, setAmenities)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Fun Things to Do">
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.funThingsToDo.map((item) => (
             <CheckboxItem
              key={item}
              id={`fun-${item}`}
              label={item}
              checked={funThingsToDo.includes(item)}
              onChange={() => handleCheckboxChange(item, funThingsToDo, setFunThingsToDo)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Meals">
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.meals.map((item) => (
             <CheckboxItem
              key={item}
              id={`meal-${item}`}
              label={item}
              checked={meals.includes(item)}
              onChange={() => handleCheckboxChange(item, meals, setMeals)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Facilities">
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.facilities.map((item) => (
            <CheckboxItem
              key={item}
              id={`facility-${item}`}
              label={item}
              checked={facilities.includes(item)}
              onChange={() => handleCheckboxChange(item, facilities, setFacilities)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Reservation Policy">
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.reservationPolicy.map((item) => (
            <CheckboxItem
              key={item}
              id={`policy-${item}`}
              label={item}
              checked={reservationPolicy.includes(item)}
              onChange={() => handleCheckboxChange(item, reservationPolicy, setReservationPolicy)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brands">
         <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {categoryOptions.brands.map((item) => (
            <CheckboxItem
              key={item}
              id={`brand-${item}`}
              label={item}
              checked={brands.includes(item)}
              onChange={() => handleCheckboxChange(item, brands, setBrands)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}