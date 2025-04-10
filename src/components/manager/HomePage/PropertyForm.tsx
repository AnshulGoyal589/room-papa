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
import { Property } from '@/lib/mongodb/models/Property';
import { PropertyType } from '@/types';

// Define options for each multi-select category
const categoryOptions = {
  propertyAccessibility: ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'],
  roomAccessibility: ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'],
  popularFilters: ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'],
  funThingsToDo: ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'],
  meals: ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'],
  // landmarks: ['City Center', 'Airport', 'Beach', 'Shopping District', 'Business District', 'Historic Center', 'Park', 'Medical Facilities'],
  facilities: ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'],
  bedPreference: ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'],
  // neighborhood: ['Downtown', 'Suburbs', 'Beach Area', 'Historic District', 'Entertainment District', 'Business District', 'Residential'],
  reservationPolicy: ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'],
  brands: ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'],
  roomFacilities: ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower']
};

// Create a default/initial state for PropertyData
const initialPropertyData: Property = {
  type: 'Hotel' as PropertyType,
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
  },
  amenities: [],
  costing: {
    price: 0,
    discountedPrice: 0,
    currency: 'USD',
  },
  rooms: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // Default to 7 days from now
  propertyAccessibility: [],
  roomAccessibility: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [],
  facilities: [],
  propertyRating: 0,
  bedPreference: [],
  reservationPolicy: [],
  brands: [],
  roomFacilities: [],
};

interface PropertyFormProps {
  propertyData: Property;
  setPropertyData: React.Dispatch<React.SetStateAction<Property>>;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ 
  propertyData = initialPropertyData, 
  setPropertyData 
}) => {
  
  const handlePropertyChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPropertyData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setPropertyData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleArrayItem = (field: string, item: string) => {
    const currentArray = (propertyData[field as keyof Property] as string[]) || [];
    
    if (currentArray.includes(item)) {
      // Remove item if it exists
      handlePropertyChange(
        field, 
        currentArray.filter(i => i !== item)
      );
    } else {
      // Add item if it doesn't exist
      handlePropertyChange(field, [...currentArray, item]);
    }
  };
  
  const handleRemoveItem = (field: string, item: string) => {
    const currentArray = (propertyData[field as keyof Property] as string[]) || [];
    
    handlePropertyChange(
      field, 
      currentArray.filter(i => i !== item)
    );
  };

  const renderMultiSelect = (field: string, label: string) => {
    // Make sure we have an array to work with, even if property is undefined
    const selectedValues = Array.isArray(propertyData[field as keyof Property]) 
      ? (propertyData[field as keyof Property] as string[]) 
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
  const ensurePropertyData = {
    ...initialPropertyData,
    ...propertyData,
    location: {
      ...initialPropertyData.location,
      ...(propertyData?.location || {}),
    },
    costing: {
      ...initialPropertyData.costing,
      ...(propertyData?.costing || {}),
    },
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
      <FormItem>
        <FormLabel>Property Type</FormLabel>
        <Select
          value={ensurePropertyData.type}
          onValueChange={(value) => handlePropertyChange('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="hostel">Hostel</SelectItem>
            <SelectItem value="resort">Resort</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
      
      <FormItem>
        <FormLabel>Address</FormLabel>
        <Input 
          value={ensurePropertyData.location.address}
          onChange={(e) => handlePropertyChange('location.address', e.target.value)}
          placeholder="Enter address"
        />
      </FormItem>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Start Date</FormLabel>
          <Input 
            type="date"
            value={ensurePropertyData.startDate ? ensurePropertyData.startDate : ''}
            onChange={(e) => handlePropertyChange('startDate', new Date(e.target.value).toISOString().split('T')[0])}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>End Date</FormLabel>
          <Input 
            type="date"
            value={ensurePropertyData.endDate ? ensurePropertyData.endDate : ''}
            onChange={(e) => handlePropertyChange('endDate', new Date(e.target.value).toISOString().split('T')[0])}
          />
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormItem>
          <FormLabel>City</FormLabel>
          <Input 
            value={ensurePropertyData.location.city}
            onChange={(e) => handlePropertyChange('location.city', e.target.value)}
            placeholder="Enter city"
          />
        </FormItem>
        <FormItem>
          <FormLabel>State</FormLabel>
          <Input 
            value={ensurePropertyData.location.state}
            onChange={(e) => handlePropertyChange('location.state', e.target.value)}
            placeholder="Enter State"
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Country</FormLabel>
          <Input 
            value={ensurePropertyData.location.country}
            onChange={(e) => handlePropertyChange('location.country', e.target.value)}
            placeholder="Enter country"
          />
        </FormItem>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormItem>
          <FormLabel>Price per Night</FormLabel>
          <Input 
            type="number"
            value={ensurePropertyData.costing.price}
            onChange={(e) => handlePropertyChange('costing.price', Number(e.target.value) || 0)}
            min={0}
          />
        </FormItem>
        <FormItem>
          <FormLabel>Discounted Price per Night</FormLabel>
          <Input 
            type="number"
            value={ensurePropertyData.costing.discountedPrice}
            onChange={(e) => handlePropertyChange('costing.discountedPrice', Number(e.target.value) || 0)}
            min={0}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Currency</FormLabel>
          <Select
            value={ensurePropertyData.costing.currency}
            onValueChange={(value) => handlePropertyChange('costing.currency', value)}
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
      
      <div className="grid grid-cols-3 gap-2">
        <FormItem>
          <FormLabel>Max Rooms</FormLabel>
          <Input 
            type="number"
            value={ensurePropertyData.rooms}
            onChange={(e) => handlePropertyChange('rooms', Number(e.target.value) || 1)}
            min={1}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Property Rating</FormLabel>
          <Select
            value={ensurePropertyData.propertyRating.toString()}
            onValueChange={(value) => handlePropertyChange('propertyRating', Number(value))}
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
      </div>
      
      <FormItem>
        <FormLabel>Amenities</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfast'].map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id={amenity}
                checked={ensurePropertyData.amenities.includes(amenity)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handlePropertyChange('amenities', [...(ensurePropertyData.amenities || []), amenity]);
                  } else {
                    handlePropertyChange('amenities', (ensurePropertyData.amenities || []).filter(a => a !== amenity));
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
      
      {/* New categories with multi-select dropdowns */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Additional Property Categories</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMultiSelect('propertyAccessibility', 'Property Accessibility')}
          {renderMultiSelect('roomAccessibility', 'Room Accessibility')}
          {renderMultiSelect('popularFilters', 'Popular Filters')}
          {renderMultiSelect('funThingsToDo', 'Fun Things To Do')}
          {renderMultiSelect('meals', 'Meals')}
          {/* {renderMultiSelect('landmarks', 'Landmarks')} */}
          {renderMultiSelect('facilities', 'Facilities')}
          {renderMultiSelect('bedPreference', 'Bed Preference')}
          {/* {renderMultiSelect('neighborhood', 'Neighborhood')} */}
          {renderMultiSelect('reservationPolicy', 'Reservation Policy')}
          {renderMultiSelect('brands', 'Brands')}
          {renderMultiSelect('roomFacilities', 'Room Facilities')}
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;