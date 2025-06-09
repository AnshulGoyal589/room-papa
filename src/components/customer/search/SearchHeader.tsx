// ----------------------------------
// ----------------------------------
// YOU CAN DELETE IT, IT IS OF NO USE
// ----------------------------------
// ----------------------------------

'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, DollarSign, Plane, Hotel , Users, Baby  } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SearchHeaderProps } from '@/types';


export default function SearchHeader({ category, initialSearchParams = {} }: SearchHeaderProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // General Filters
  const [searchQuery, setSearchQuery] = useState(initialSearchParams.title || '');
  const [location, setLocation] = useState(initialSearchParams.city || '');
  const [startDate, setStartDate] = useState<Date | null>(initialSearchParams.startDate ? new Date(initialSearchParams.startDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(initialSearchParams.endDate ? new Date(initialSearchParams.endDate) : null);
  const [type, setType] = useState(initialSearchParams.type || '');
  const [minPrice, setMinPrice] = useState(initialSearchParams.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialSearchParams.maxPrice || '');
  const [selectedCategory, setSelectedCategory] = useState(initialSearchParams.category || category);
  
  // Property-specific filters
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);
  const [amenities, setAmenities] = useState<string[]>(initialSearchParams.amenities ? initialSearchParams.amenities.split(',') : []);
  
  // Travelling-specific filters
  
  // Trip-specific filters
  const [domain, setDomain] = useState(initialSearchParams.domain || '');

  useEffect(() => {
    if (currentSearchParams) {
      setSearchQuery(currentSearchParams.get('title') || '');
      setLocation(currentSearchParams.get('city') || '');
      setStartDate(currentSearchParams.get('startDate') ? new Date(currentSearchParams.get('startDate') as string) : null);
      setEndDate(currentSearchParams.get('endDate') ? new Date(currentSearchParams.get('endDate') as string) : null);
      setSelectedCategory(currentSearchParams.get('category') || category);
      setMinPrice(currentSearchParams.get('minPrice') || '');
      setMaxPrice(currentSearchParams.get('maxPrice') || '');
      setType(currentSearchParams.get('type') || '');
      
      // Property-specific
      setAmenities(currentSearchParams.get('amenities') ? (currentSearchParams.get('amenities') as string).split(',') : []);
      
      // Travelling-specific
      
      // Trip-specific
    }
  }, [currentSearchParams, category]);

  useEffect(() => {
    const minRoomsRequired = Math.ceil(adults / 3);
    if (rooms < minRoomsRequired) {
      setRooms(minRoomsRequired);
    }
  }, [adults, rooms ]);

  const handleAdultsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAdults(Math.max(1, value)); // Ensure at least 1 adult
  };
  
  
  const handleChildrenChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setChildren(Math.max(0, value));
  };

  const handleRoomsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const minRoomsRequired = Math.ceil(adults / 3);
    setRooms(Math.max(minRoomsRequired, value));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    
    if (searchQuery) params.set('title', searchQuery);
    if (searchQuery.length==0) params.delete('title');

    if (location) params.set('location', location);
    if (location.length==0) params.delete('location');

    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    if (!startDate) params.delete('startDate');
    if (!endDate) params.delete('endDate');

    if (type.length>0) params.set('type', type);
    if (type.length==0) params.delete('type');

    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    
    params.set('category', selectedCategory);
    params.set('page', '1');
    
    
    if (selectedCategory === 'property') {
      // if (adults) params.set('adults', adults.toString());
      // if (children) params.set('children', children.toString());
      if (rooms) params.set('rooms', rooms.toString());
      if (amenities.length > 0) params.set('amenities', amenities.join(','));
    } else if (selectedCategory === 'travelling') {
      if (rooms) params.delete('rooms');
    } else if (selectedCategory === 'trip') {
      if (domain) params.set('domain', domain);
      if (rooms) params.delete('rooms');
      if (!domain) params.delete('domain');
    }
    
    try {
      
      await fetch(`/api/search?${params.toString()}`);
      
      router.push(`/customer/search?${params.toString()}`, { scroll: false });

      
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    
    if (newCategory !== 'property') {
      setAmenities([]);

    }
    
    if (newCategory !== 'travelling') {
    }
    
    if (newCategory !== 'trip') {
    }
  };

  
  const renderCategoryFilters = () => {
    switch (selectedCategory) {
      
      case 'property':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                placeholder="Minimum price"
                className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                placeholder="Maximum price"
                className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              className="pl-4 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Any type</option>
              <option value="hotel">Hotel</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="hostel">Hostel</option>
              <option value="resort">Resort</option>
            </select>
          </div>

          {/* Amenities */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
            <select
              className="pl-4 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
              value={amenities[0] || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  setAmenities([value]);
                } else {
                  setAmenities([]);
                }
              }}
            >
              <option value="">Any amenity</option>
              <option value="wifi">WiFi</option>
              <option value="pool">Pool</option>
              <option value="gym">Gym</option>
              <option value="spa">Spa</option>
              <option value="restaurant">Restaurant</option>
              <option value="parking">Parking</option>
              <option value="airConditioning">Air Conditioning</option>
              <option value="breakfast">Breakfast</option>
            </select>
          </div>

          {/* Adults input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Adults</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                placeholder="Number of adults"
                className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                value={adults}
                onChange={handleAdultsChange}
                min="1"
              />
            </div>
          </div>
          
          {/* Children input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Children</label>
            <div className="relative">
              <Baby className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                placeholder="Number of children"
                className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                value={children}
                onChange={handleChildrenChange}
                min="0"
              />
            </div>
          </div>
          
          {/* Rooms input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
            <div className="relative">
              <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                placeholder="Number of rooms"
                className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                value={rooms}
                onChange={handleRoomsChange}
                min={Math.ceil(adults / 3)}
              />
            </div>
            {rooms < Math.ceil(adults / 3) && (
              <p className="text-red-500 text-sm mt-1">
                Minimum {Math.ceil(adults / 3)} room(s) required for {adults} adults
              </p>
            )}
          </div>
              
              
        </div>
      );

      case 'travelling':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Transportation Type</label>
                <div className="relative">
                  <Plane className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Any type</option>
                    <option value="flight">Flight</option>
                    <option value="train">Train</option>
                    <option value="bus">Bus</option>
                    <option value="car">Car</option>
                    <option value="ferry">Ferry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    placeholder="Minimum price"
                    className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
              </div>
          
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    placeholder="Maximum price"
                    className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

            </div>
          );
  
      case 'trip':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="pl-4 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">Any Type</option>
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="pl-4 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="">Any Type</option>
                  <option value="beach">Beach Getaway</option>
                  <option value="mountain">Mountain Retreat</option>
                  <option value="cultural">Cultural Experience</option>
                  <option value="wildlife">Wildlife Adventure</option>
                  <option value="city">City Exploration</option>
                  <option value="heritage">Heritage Sites</option>
                </select>
              </div>
            
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    placeholder="Minimum budget"
                    className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    placeholder="Maximum budget"
                    className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
  
            </div>
          );

      default:
        return null;
    }
  };

  return (
    <div className="bg-primary py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-white">Find your perfect {selectedCategory}</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
    
          <div className="flex justify-center mb-6">
            <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                className={`tab transition-all duration-200 px-6 py-2 rounded-md ${
                  selectedCategory === 'property' ? 'bg-primary text-white' : 'text-gray-700'
                }`}
                onClick={() => handleCategoryChange('property')}
              >
                Properties
              </button>
              <button
                type="button"
                className={`tab transition-all duration-200 px-6 py-2 rounded-md ${
                  selectedCategory === 'travelling' ? 'bg-primary text-white' : 'text-gray-700'
                }`}
                onClick={() => handleCategoryChange('travelling')}
              >
                Travelling
              </button>
              <button
                type="button"
                className={`tab transition-all duration-200 px-6 py-2 rounded-md ${
                  selectedCategory === 'trip' ? 'bg-primary text-white' : 'text-gray-700'
                }`}
                onClick={() => handleCategoryChange('trip')}
              >
                Trips
              </button>
            </div>
          </div>
          
          
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="What are you looking for?"
                      className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <DatePicker
                      selected={startDate}
                      onChange={(dates) => {
                        const [start, end] = dates;
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      startDate={startDate}
                      endDate={endDate}
                      selectsRange
                      placeholderText="Check In — Check Out"
                      className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-white w-full px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors duration-200 disabled:opacity-70"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                  
                </div>

                {renderCategoryFilters()}


        </form>

        </div>

      </div>
    </div>
  )
};  

