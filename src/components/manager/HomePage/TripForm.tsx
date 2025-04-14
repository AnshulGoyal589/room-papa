import React from 'react';
import {
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { Trip } from '@/lib/mongodb/models/Trip';

// Define options for each multi-select category
const categoryOptions = {
  activities: ['Sightseeing', 'Adventure', 'Relaxation', 'Food Tours', 'Cultural Experience', 'Shopping', 'Hiking', 'Beach Activities'],
  propertyAccessibility: ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'],
  roomAccessibility: ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'],
  popularFilters: ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'],
  funThingsToDo: ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'],
  meals: ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'],
  facilities: ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'],
  bedPreference: ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'],
  reservationPolicy: ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'],
  brands: ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'],
  roomFacilities: ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower']
};

// Create a default/initial state for TripData
const initialTripData: Trip = {
  domain: '',
  destination: {
    city: '',
    state: '',
    country: '',
  },
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // Default to 7 days from now
  costing: {
    price: 0,
    discountedPrice: 0,
    currency: 'USD',
  },
  totalRating: 0,
  activities: [],
  type: 'Domestic',
  amenities: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [],
  facilities: [],
  reservationPolicy: [],
  brands: [],
};

interface TripFormProps {
  tripData: Trip;
  setTripData: React.Dispatch<React.SetStateAction<Trip>>;
}

const TripForm: React.FC<TripFormProps> = ({ 
  tripData = initialTripData, 
  setTripData 
}) => {
  
  const handleTripChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTripData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setTripData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleArrayItem = (field: string, item: string) => {
    const currentArray = (tripData[field as keyof Trip] as string[]) || [];
    
    if (currentArray.includes(item)) {
      // Remove item if it exists
      handleTripChange(
        field, 
        currentArray.filter(i => i !== item)
      );
    } else {
      // Add item if it doesn't exist
      handleTripChange(field, [...currentArray, item]);
    }
  };
  
  const handleRemoveItem = (field: string, item: string) => {
    const currentArray = (tripData[field as keyof Trip] as string[]) || [];
    
    handleTripChange(
      field, 
      currentArray.filter(i => i !== item)
    );
  };

  const renderMultiSelect = (field: string, label: string) => {
    // Make sure we have an array to work with, even if property is undefined
    const selectedValues = Array.isArray(tripData[field as keyof Trip]) 
      ? (tripData[field as keyof Trip] as string[]) 
      : [];
    
    const options = categoryOptions[field as keyof typeof categoryOptions] || [];
      
    return (
      <FormItem className="space-y-2">
        <FormLabel>{label}</FormLabel>
        
        {/* Dropdown for selecting items */}
        <div className="relative">
          <select 
            className="w-full p-2 border rounded-md bg-white"
            onChange={(e) => {
              if (e.target.value) {
                toggleArrayItem(field, e.target.value);
                e.target.value = ""; // Reset select after selection
              }
            }}
            value=""
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option 
                key={option} 
                value={option}
                disabled={selectedValues.includes(option)}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
        
        {/* Display selected items as chips */}
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedValues.map((item, index) => (
              <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <span className="mr-1">{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(field, item)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </FormItem>
    );
  };

  // Ensure all expected properties exist with defaults if needed
  const ensureTripData = {
    ...initialTripData,
    ...tripData,
    destination: {
      ...initialTripData.destination,
      ...(tripData?.destination || {}),
    },
    costing: {
      ...initialTripData.costing,
      ...(tripData?.costing || {}),
    },
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
      <FormItem>
        <FormLabel>Domain</FormLabel>
        <Input 
          value={ensureTripData.domain || ''}
          onChange={(e) => handleTripChange('domain', e.target.value)}
          placeholder="Enter domain"
        />
      </FormItem>
      
      <FormItem>
        <FormLabel>Trip Type</FormLabel>
        <Select
          value={ensureTripData.type}
          onValueChange={(value) => handleTripChange('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trip type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Domestic">Domestic</SelectItem>
            <SelectItem value="International">International</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
      
      <FormItem>
        <FormLabel>Destination City</FormLabel>
        <Input 
          value={ensureTripData.destination.city}
          onChange={(e) => handleTripChange('destination.city', e.target.value)}
          placeholder="Enter city"
        />
      </FormItem>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Start Date</FormLabel>
          <Input 
            type="date"
            value={ensureTripData.startDate ? ensureTripData.startDate : ''}
            onChange={(e) => handleTripChange('startDate', new Date(e.target.value).toISOString().split('T')[0])}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>End Date</FormLabel>
          <Input 
            type="date"
            value={ensureTripData.endDate ? ensureTripData.endDate : ''}
            onChange={(e) => handleTripChange('endDate', new Date(e.target.value).toISOString().split('T')[0])}
          />
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>State</FormLabel>
          <Input 
            value={ensureTripData.destination.state}
            onChange={(e) => handleTripChange('destination.state', e.target.value)}
            placeholder="Enter state"
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Country</FormLabel>
          <Input 
            value={ensureTripData.destination.country}
            onChange={(e) => handleTripChange('destination.country', e.target.value)}
            placeholder="Enter country"
          />
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormItem>
          <FormLabel>Price</FormLabel>
          <Input 
            type="number"
            value={ensureTripData.costing.price}
            onChange={(e) => handleTripChange('costing.price', Number(e.target.value) || 0)}
            min={0}
          />
        </FormItem>
        <FormItem>
          <FormLabel>Discounted Price</FormLabel>
          <Input 
            type="number"
            value={ensureTripData.costing.discountedPrice}
            onChange={(e) => handleTripChange('costing.discountedPrice', Number(e.target.value) || 0)}
            min={0}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Currency</FormLabel>
          <Select
            value={ensureTripData.costing.currency}
            onValueChange={(value) => handleTripChange('costing.currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        
        <FormItem>
          <FormLabel>Total Rating</FormLabel>
          <Input 
            type="number"
            value={ensureTripData.totalRating || 0}
            onChange={(e) => handleTripChange('totalRating', Number(e.target.value) || 0)}
            min={0}
            max={5}
            step={0.1}
          />
        </FormItem>
      </div>
      
      <FormItem>
        <FormLabel>Amenities</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfast'].map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id={amenity}
                checked={ensureTripData.amenities?.includes(amenity)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleTripChange('amenities', [...(ensureTripData.amenities || []), amenity]);
                  } else {
                    handleTripChange('amenities', (ensureTripData.amenities || []).filter(a => a !== amenity));
                  }
                }}
              />
              <label htmlFor={amenity} className="text-sm capitalize">
                {amenity === 'airConditioning' ? 'Air Conditioning' : amenity}
              </label>
            </div>
          ))}
        </div>
      </FormItem>
      
      {/* Activities multi-select */}
      {renderMultiSelect('activities', 'Activities')}
      
      {/* Additional categories with multi-select dropdowns */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Additional Trip Categories</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMultiSelect('propertyAccessibility', 'Property Accessibility')}
          {renderMultiSelect('roomAccessibility', 'Room Accessibility')}
          {renderMultiSelect('popularFilters', 'Popular Filters')}
          {renderMultiSelect('funThingsToDo', 'Fun Things To Do')}
          {renderMultiSelect('meals', 'Meals')}
          {renderMultiSelect('facilities', 'Facilities')}
          {renderMultiSelect('bedPreference', 'Bed Preference')}
          {renderMultiSelect('reservationPolicy', 'Reservation Policy')}
          {renderMultiSelect('brands', 'Brands')}
          {renderMultiSelect('roomFacilities', 'Room Facilities')}
        </div>
      </div>
    </div>
  );
};

export default TripForm;