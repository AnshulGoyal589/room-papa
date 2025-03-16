'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, Users, DollarSign, Tag, Plane, Compass, Hotel } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SearchHeaderProps {
  category: string;
  initialSearchParams?: { [key: string]: string };
}

export default function SearchHeader({ category, initialSearchParams = {} }: SearchHeaderProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize state from URL or props
  const [searchQuery, setSearchQuery] = useState(initialSearchParams.query || '');
  const [location, setLocation] = useState(initialSearchParams.city || '');
  const [startDate, setStartDate] = useState<Date | null>(initialSearchParams.startDate ? new Date(initialSearchParams.startDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(initialSearchParams.endDate ? new Date(initialSearchParams.endDate) : null);
  const [guests, setGuests] = useState(initialSearchParams.guests || '');
  const [selectedCategory, setSelectedCategory] = useState(initialSearchParams.category || category);
  
  // Property-specific filters
  const [minPrice, setMinPrice] = useState(initialSearchParams.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialSearchParams.maxPrice || '');
  const [bedrooms, setBedrooms] = useState(initialSearchParams.bedrooms || '');
  const [bathrooms, setBathrooms] = useState(initialSearchParams.bathrooms || '');
  const [propertyType, setPropertyType] = useState(initialSearchParams.propertyType || '');
  const [amenities, setAmenities] = useState<string[]>(initialSearchParams.amenities ? initialSearchParams.amenities.split(',') : []);
  
  // Travelling-specific filters
  const [visibility, setVisibility] = useState(initialSearchParams.visibility || '');
  const [activityCategory, setActivityCategory] = useState(initialSearchParams.activityCategory || '');
  const [tags, setTags] = useState<string[]>(initialSearchParams.tags ? initialSearchParams.tags.split(',') : []);
  
  // Trip-specific filters
  const [tripStatus, setTripStatus] = useState(initialSearchParams.status || '');
  const [transportationType, setTransportationType] = useState(initialSearchParams.transportationType || '');
  const [minBudget, setMinBudget] = useState(initialSearchParams.minBudget || '');
  const [maxBudget, setMaxBudget] = useState(initialSearchParams.maxBudget || '');

  // Update state when URL params change
  useEffect(() => {
    if (currentSearchParams) {
      setSearchQuery(currentSearchParams.get('query') || '');
      setLocation(currentSearchParams.get('city') || '');
      setStartDate(currentSearchParams.get('startDate') ? new Date(currentSearchParams.get('startDate') as string) : null);
      setEndDate(currentSearchParams.get('endDate') ? new Date(currentSearchParams.get('endDate') as string) : null);
      setGuests(currentSearchParams.get('guests') || '');
      setSelectedCategory(currentSearchParams.get('category') || category);
      
      // Property-specific
      setMinPrice(currentSearchParams.get('minPrice') || '');
      setMaxPrice(currentSearchParams.get('maxPrice') || '');
      setBedrooms(currentSearchParams.get('bedrooms') || '');
      setBathrooms(currentSearchParams.get('bathrooms') || '');
      setPropertyType(currentSearchParams.get('propertyType') || '');
      setAmenities(currentSearchParams.get('amenities') ? (currentSearchParams.get('amenities') as string).split(',') : []);
      
      // Travelling-specific
      setVisibility(currentSearchParams.get('visibility') || '');
      setActivityCategory(currentSearchParams.get('activityCategory') || '');
      setTags(currentSearchParams.get('tags') ? (currentSearchParams.get('tags') as string).split(',') : []);
      
      // Trip-specific
      setTripStatus(currentSearchParams.get('status') || '');
      setTransportationType(currentSearchParams.get('transportationType') || '');
      setMinBudget(currentSearchParams.get('minBudget') || '');
      setMaxBudget(currentSearchParams.get('maxBudget') || '');
    }
  }, [currentSearchParams, category]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    
    // Common parameters
    if (searchQuery) params.set('query', searchQuery);
    if (location) params.set('city', location);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    params.set('category', selectedCategory);
    params.set('page', '1'); // Reset to page 1 for new searches
    
    // Category-specific parameters
    if (selectedCategory === 'property') {
      if (guests) params.set('guests', guests);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (bedrooms) params.set('bedrooms', bedrooms);
      if (bathrooms) params.set('bathrooms', bathrooms);
      if (propertyType) params.set('propertyType', propertyType);
      if (amenities.length > 0) params.set('amenities', amenities.join(','));
    } else if (selectedCategory === 'travelling') {
      if (visibility) params.set('visibility', visibility);
      if (activityCategory) params.set('activityCategory', activityCategory);
      if (tags.length > 0) params.set('tags', tags.join(','));
    } else if (selectedCategory === 'trip') {
      if (tripStatus) params.set('status', tripStatus);
      if (transportationType) params.set('transportationType', transportationType);
      if (minBudget) params.set('minBudget', minBudget);
      if (maxBudget) params.set('maxBudget', maxBudget);
    }
    
    try {
      // Fetch search results from API
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      
      // Update URL without triggering a navigation
      router.push(`/customer/search?${params.toString()}`, { scroll: false });
      
      console.log("Search results:", data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    
    // Reset category-specific filters when changing categories
    if (newCategory !== 'property') {
      setGuests('');
      setMinPrice('');
      setMaxPrice('');
      setBedrooms('');
      setBathrooms('');
      setPropertyType('');
      setAmenities([]);
    }
    
    if (newCategory !== 'travelling') {
      setVisibility('');
      setActivityCategory('');
      setTags([]);
    }
    
    if (newCategory !== 'trip') {
      setTripStatus('');
      setTransportationType('');
      setMinBudget('');
      setMaxBudget('');
    }
  };

  // Render additional filters based on selected category
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <div className="relative">
                <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="Min bedrooms"
                  className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Min bathrooms"
                  className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      
      case 'travelling':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                className="pl-4 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="">Any visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Category</label>
              <div className="relative">
                <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={activityCategory}
                  onChange={(e) => setActivityCategory(e.target.value)}
                >
                  <option value="">Any category</option>
                  <option value="sightseeing">Sightseeing</option>
                  <option value="dining">Dining</option>
                  <option value="transportation">Transportation</option>
                  <option value="adventure">Adventure</option>
                  <option value="relaxation">Relaxation</option>
                </select>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter tags (comma separated)"
                  className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={tags.join(',')}
                  onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
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
                value={tripStatus}
                onChange={(e) => setTripStatus(e.target.value)}
              >
                <option value="">Any status</option>
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transportation</label>
              <div className="relative">
                <Plane className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={transportationType}
                  onChange={(e) => setTransportationType(e.target.value)}
                >
                  <option value="">Any type</option>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                  <option value="car">Car</option>
                  <option value="ferry">Ferry</option>
                </select>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="Minimum budget"
                  className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
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
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
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
          {/* Category Tabs */}
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
                Itineraries
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
          
          {/* Search Form */}
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
      onChange={(date) => setStartDate(date)}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      placeholderText="Check-in — Check-out"
      className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
    />
  </div>
</div>

{selectedCategory === 'property' && (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
    <div className="relative">
      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="number"
        placeholder="Number of guests"
        className="pl-10 pr-4 py-3 rounded-md w-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
        value={guests}
        onChange={(e) => setGuests(e.target.value)}
      />
    </div>
  </div>
)}

{selectedCategory !== 'property' && (
  <div className="flex items-end">
    <button
      type="submit"
      disabled={isLoading}
      className="bg-primary text-white w-full px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors duration-200 disabled:opacity-70"
    >
      {isLoading ? 'Searching...' : 'Search'}
    </button>
  </div>
)}
</div>

{/* Category-specific filters */}
{renderCategoryFilters()}

{selectedCategory === 'property' && (
  <div className="md:col-span-2 lg:col-span-4 mt-4">
    <button
      type="submit"
      disabled={isLoading}
      className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors duration-200 w-full md:w-auto float-right disabled:opacity-70"
    >
      {isLoading ? 'Searching...' : 'Search'}
    </button>
  </div>
)}
        </form>

        </div>

      </div>
    </div>
  )
};  

