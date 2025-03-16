// components/search/SearchFilters.tsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const propertyAmenities = [
  'WiFi', 'Pool', 'Parking', 'Kitchen', 'Washer', 'Dryer', 
  'Air Conditioning', 'Heating', 'TV', 'Gym'
];

const propertyTypes = [
  'Apartment', 'House', 'Villa', 'Hotel', 'Resort', 'Cabin'
];

const transportationTypes = [
  'Flight', 'Train', 'Bus', 'Car', 'Ferry', 'Cruise'
];

const activityCategories = [
  'Sightseeing', 'Dining', 'Adventure', 'Cultural', 'Relaxation'
];

const tripStatuses = [
  'Planning', 'Booked', 'Active', 'Completed', 'Cancelled'
];

const itineraryVisibilities = [
  'Public', 'Private', 'Friends', 'Shared'
];

interface SearchFiltersProps {
  initialCategory: string;
  searchParams: { [key: string]: string };
}

export default function SearchFilters({ initialCategory, searchParams }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const [category, setCategory] = useState(initialCategory || 'property');
  
  // Track filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [guests, setGuests] = useState(1);
  
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  const [tripStatus, setTripStatus] = useState('');
  const [transportationType, setTransportationType] = useState('');
  
  const [visibility, setVisibility] = useState('');
  const [activityCategory, setActivityCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    // Update filter values from URL params
    setCategory(searchParams.category || 'property');
    
    if (searchParams.minPrice && searchParams.maxPrice) {
      setPriceRange([parseInt(searchParams.minPrice), parseInt(searchParams.maxPrice)]);
    }
    
    if (searchParams.propertyType) {
      setPropertyType(searchParams.propertyType);
    }
    
    if (searchParams.amenities) {
      setSelectedAmenities(searchParams.amenities.split(','));
    }
    
    if (searchParams.bedrooms) {
      setBedrooms(parseInt(searchParams.bedrooms));
    }
    
    if (searchParams.bathrooms) {
      setBathrooms(parseInt(searchParams.bathrooms));
    }
    
    if (searchParams.guests) {
      setGuests(parseInt(searchParams.guests));
    }
    
    if (searchParams.minBudget && searchParams.maxBudget) {
      setBudgetRange([parseInt(searchParams.minBudget), parseInt(searchParams.maxBudget)]);
    }
    
    if (searchParams.status) {
      setTripStatus(searchParams.status);
    }
    
    if (searchParams.transportationType) {
        setTransportationType(searchParams.transportationType);
      }
      
      if (searchParams.visibility) {
        setVisibility(searchParams.visibility);
      }
      
      if (searchParams.activityCategory) {
        setActivityCategory(searchParams.activityCategory);
      }
      
      if (searchParams.tags) {
        setSelectedTags(searchParams.tags.split(','));
      }
    }, [searchParams]);
  
    const applyFilters = () => {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.set('category', category);
      
      // Clear category-specific filters first
      ['minPrice', 'maxPrice', 'propertyType', 'amenities', 
       'bedrooms', 'bathrooms', 'guests', 'minBudget', 'maxBudget', 
       'status', 'transportationType', 'visibility', 'activityCategory', 'tags'].forEach(param => {
        params.delete(param);
      });
      
      // Apply category-specific filters
      switch (category) {
        case 'property':
          params.set('minPrice', priceRange[0].toString());
          params.set('maxPrice', priceRange[1].toString());
          if (propertyType) params.set('propertyType', propertyType);
          if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
          params.set('bedrooms', bedrooms.toString());
          params.set('bathrooms', bathrooms.toString());
          params.set('guests', guests.toString());
          break;
          
        case 'trip':
          params.set('minBudget', budgetRange[0].toString());
          params.set('maxBudget', budgetRange[1].toString());
          if (tripStatus) params.set('status', tripStatus);
          if (transportationType) params.set('transportationType', transportationType);
          break;
          
        case 'travelling':
          if (visibility) params.set('visibility', visibility);
          if (activityCategory) params.set('activityCategory', activityCategory);
          if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
          break;
      }
      
      router.push(`${pathname}?${params.toString()}`);
    };
  
    const clearFilters = () => {
      const params = new URLSearchParams(currentSearchParams.toString());
      params.set('category', category);
      
      // Clear category-specific filters
      ['minPrice', 'maxPrice', 'propertyType', 'amenities', 
       'bedrooms', 'bathrooms', 'guests', 'minBudget', 'maxBudget', 
       'status', 'transportationType', 'visibility', 'activityCategory', 'tags'].forEach(param => {
        params.delete(param);
      });
      
      router.push(`${pathname}?${params.toString()}`);
      
      // Reset local state
      setPriceRange([0, 1000]);
      setSelectedAmenities([]);
      setPropertyType('');
      setBedrooms(1);
      setBathrooms(1);
      setGuests(1);
      setBudgetRange([0, 10000]);
      setTripStatus('');
      setTransportationType('');
      setVisibility('');
      setActivityCategory('');
      setSelectedTags([]);
    };
  
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
        <h2 className="text-xl font-semibold mb-6">Filters</h2>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Category</h3>
          <RadioGroup 
            value={category} 
            onValueChange={(value) => setCategory(value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="property" id="property" />
              <label htmlFor="property">Properties</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="travelling" id="travelling" />
              <label htmlFor="travelling">Itineraries</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trip" id="trip" />
              <label htmlFor="trip">Trips</label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Property Filters */}
        {category === 'property' && (
          <>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Price per night</h3>
              <Slider
                min={0}
                max={2000}
                step={50}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="mt-2"
              />
              <div className="flex justify-between mt-2">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Property Type</h3>
              <RadioGroup 
                value={propertyType} 
                onValueChange={setPropertyType}
                className="space-y-2"
              >
                {propertyTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`type-${type}`} />
                    <label htmlFor={`type-${type}`}>{type}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Rooms & Guests</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm">Bedrooms (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value))}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Bathrooms (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value))}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Guests (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Amenities</h3>
              <div className="space-y-2">
                {propertyAmenities.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${amenity}`}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAmenities([...selectedAmenities, amenity]);
                        } else {
                          setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                        }
                      }}
                    />
                    <label htmlFor={`amenity-${amenity}`}>{amenity}</label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Trip Filters */}
        {category === 'trip' && (
          <>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Budget</h3>
              <Slider
                min={0}
                max={20000}
                step={500}
                value={budgetRange}
                onValueChange={(value) => setBudgetRange(value as [number, number])}
                className="mt-2"
              />
              <div className="flex justify-between mt-2">
                <span>${budgetRange[0]}</span>
                <span>${budgetRange[1]}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Status</h3>
              <RadioGroup 
                value={tripStatus} 
                onValueChange={setTripStatus}
                className="space-y-2"
              >
                {tripStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={`status-${status}`} />
                    <label htmlFor={`status-${status}`}>{status}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Transportation Type</h3>
              <RadioGroup 
                value={transportationType} 
                onValueChange={setTransportationType}
                className="space-y-2"
              >
                {transportationTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`transport-${type}`} />
                    <label htmlFor={`transport-${type}`}>{type}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </>
        )}
        
        {/* Travelling (Itinerary) Filters */}
        {category === 'travelling' && (
          <>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Visibility</h3>
              <RadioGroup 
                value={visibility} 
                onValueChange={setVisibility}
                className="space-y-2"
              >
                {itineraryVisibilities.map((vis) => (
                  <div key={vis} className="flex items-center space-x-2">
                    <RadioGroupItem value={vis} id={`visibility-${vis}`} />
                    <label htmlFor={`visibility-${vis}`}>{vis}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Activity Category</h3>
              <RadioGroup 
                value={activityCategory} 
                onValueChange={setActivityCategory}
                className="space-y-2"
              >
                {activityCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <RadioGroupItem value={category} id={`activity-${category}`} />
                    <label htmlFor={`activity-${category}`}>{category}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="space-y-2">
                {['Family', 'Solo', 'Romantic', 'Adventure', 'Budget', 'Luxury'].map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag]);
                        } else {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        }
                      }}
                    />
                    <label htmlFor={`tag-${tag}`}>{tag}</label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={applyFilters}
            className="bg-primary text-white px-4 py-2 rounded-md flex-1"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }