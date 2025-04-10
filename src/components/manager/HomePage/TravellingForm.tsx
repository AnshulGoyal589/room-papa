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
import { Travelling } from '@/lib/mongodb/models/Travelling';
import { TransportationType } from '@/types';

// Define options for each multi-select category
const categoryOptions = {
  travellingAccessibility: ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'],
  roomAccessibility: ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'],
  popularFilters: ['Pet Friendly', 'Free Cancellation', 'Free Food', 'Wifi', 'Entertainment', 'Window Seat', 'Family Friendly', 'Business Facilities'],
  funThingsToDo: ['Movies', 'Reading', 'Games', 'Sleeping', 'Local Tours', 'Sightseeing', 'Entertainment', 'Shopping'],
  meals: ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'],
  facilities: ['Charging Ports', 'WiFi', 'Entertainment', 'Blankets', 'Food', 'Drinks', 'Extra Luggage', 'Private Cabin'],
  bedPreference: ['Recliner', 'Flat Bed', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'],
  reservationPolicy: ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Counter', 'Pay Now'],
  brands: ['Air India', 'British Airways', 'Emirates', 'JetBlue', 'Southwest', 'Delta', 'IRCTC', 'Uber'],
  roomFacilities: ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Power Outlet', 'Extra Space', 'Reading Light', 'Pillow']
};

// Create a default/initial state for TravellingData
const initialTravellingData: Travelling = {
  transportation: {
    type: 'Flight' as TransportationType,
    arrivalTime: '',
    departureTime: '',
    from: '',
    to: '',
  },
  amenities: [],
  costing: {
    price: 0,
    discountedPrice: 0,
    currency: 'USD',
  },
  travellingAccessibility: [],
  roomAccessibility: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [],
  facilities: [],
  travellingRating: 0,
  bedPreference: [],
  reservationPolicy: [],
  brands: [],
  roomFacilities: [],
};

interface TravellingFormProps {
  travellingData: Travelling;
  setTravellingData: React.Dispatch<React.SetStateAction<Travelling>>;
}

const TravellingForm: React.FC<TravellingFormProps> = ({ 
  travellingData = initialTravellingData, 
  setTravellingData 
}) => {
  
  const handleTravellingChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTravellingData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setTravellingData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleArrayItem = (field: string, item: string) => {
    const currentArray = (travellingData[field as keyof Travelling] as string[]) || [];
    
    if (currentArray.includes(item)) {
      // Remove item if it exists
      handleTravellingChange(
        field, 
        currentArray.filter(i => i !== item)
      );
    } else {
      // Add item if it doesn't exist
      handleTravellingChange(field, [...currentArray, item]);
    }
  };
  
  const handleRemoveItem = (field: string, item: string) => {
    const currentArray = (travellingData[field as keyof Travelling] as string[]) || [];
    
    handleTravellingChange(
      field, 
      currentArray.filter(i => i !== item)
    );
  };

  const renderMultiSelect = (field: string, label: string) => {
    // Make sure we have an array to work with, even if property is undefined
    const selectedValues = Array.isArray(travellingData[field as keyof Travelling]) 
      ? (travellingData[field as keyof Travelling] as string[]) 
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
  const ensureTravellingData = {
    ...initialTravellingData,
    ...travellingData,
    transportation: {
      ...initialTravellingData.transportation,
      ...(travellingData?.transportation || {}),
    },
    costing: {
      ...initialTravellingData.costing,
      ...(travellingData?.costing || {}),
    },
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
      <FormItem>
        <FormLabel>Transportation Type</FormLabel>
        <Select
          value={ensureTravellingData.transportation.type}
          onValueChange={(value) => handleTravellingChange('transportation.type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select transportation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Flight">Flight</SelectItem>
            <SelectItem value="Train">Train</SelectItem>
            <SelectItem value="Bus">Bus</SelectItem>
            <SelectItem value="Car">Car</SelectItem>
            <SelectItem value="Ship">Ship</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>From</FormLabel>
          <Input 
            value={ensureTravellingData.transportation.from}
            onChange={(e) => handleTravellingChange('transportation.from', e.target.value)}
            placeholder="Departure location"
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>To</FormLabel>
          <Input 
            value={ensureTravellingData.transportation.to}
            onChange={(e) => handleTravellingChange('transportation.to', e.target.value)}
            placeholder="Arrival location"
          />
        </FormItem>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Departure Time</FormLabel>
          <Input 
            type="datetime-local"
            value={ensureTravellingData.transportation.departureTime}
            onChange={(e) => handleTravellingChange('transportation.departureTime', e.target.value)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Arrival Time</FormLabel>
          <Input 
            type="datetime-local"
            value={ensureTravellingData.transportation.arrivalTime}
            onChange={(e) => handleTravellingChange('transportation.arrivalTime', e.target.value)}
          />
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormItem>
          <FormLabel>Price</FormLabel>
          <Input 
            type="number"
            value={ensureTravellingData.costing.price}
            onChange={(e) => handleTravellingChange('costing.price', Number(e.target.value) || 0)}
            min={0}
          />
        </FormItem>
        <FormItem>
          <FormLabel>Discounted Price</FormLabel>
          <Input 
            type="number"
            value={ensureTravellingData.costing.discountedPrice}
            onChange={(e) => handleTravellingChange('costing.discountedPrice', Number(e.target.value) || 0)}
            min={0}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Currency</FormLabel>
          <Select
            value={ensureTravellingData.costing.currency}
            onValueChange={(value) => handleTravellingChange('costing.currency', value)}
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
          <FormLabel>Travel Rating</FormLabel>
          <Select
            value={ensureTravellingData.travellingRating.toString()}
            onValueChange={(value) => handleTravellingChange('travellingRating', Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} {rating === 1 ? 'Star' : 'Stars'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
        
        <FormItem>
          <FormLabel>Total Rating</FormLabel>
          <Input 
            type="number"
            value={ensureTravellingData.totalRating || 0}
            onChange={(e) => handleTravellingChange('totalRating', Number(e.target.value) || 0)}
            min={0}
            max={5}
            step={0.1}
          />
        </FormItem>
      </div>
      
      <FormItem>
        <FormLabel>Amenities</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {['wifi', 'food', 'entertainment', 'charging', 'blanket', 'extraLuggage', 'airConditioning', 'privateSpace'].map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id={amenity}
                checked={ensureTravellingData.amenities.includes(amenity)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleTravellingChange('amenities', [...(ensureTravellingData.amenities || []), amenity]);
                  } else {
                    handleTravellingChange('amenities', (ensureTravellingData.amenities || []).filter(a => a !== amenity));
                  }
                }}
              />
              <label htmlFor={amenity} className="text-sm capitalize">
                {amenity === 'airConditioning' ? 'Air Conditioning' : 
                 amenity === 'extraLuggage' ? 'Extra Luggage' : 
                 amenity === 'privateSpace' ? 'Private Space' : amenity}
              </label>
            </div>
          ))}
        </div>
      </FormItem>
      
      {/* Travel-specific categories with multi-select dropdowns */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Additional Travel Categories</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMultiSelect('travellingAccessibility', 'Travelling Accessibility')}
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

export default TravellingForm;