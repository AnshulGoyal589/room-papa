import React, { useState, useEffect } from 'react';
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
import { Plus, X } from 'lucide-react';
import { Property } from '@/lib/mongodb/models/Property';
import { PropertyType } from '@/types';
import { categoryOptions } from '../../../../public/assets/data';


// Create a default/initial state for PropertyData
const initialPropertyData: Property = {
  type: 'Hotel' as PropertyType,
  location: {
    address: '',
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
  rooms: 0, // Will be calculated from room categories

  categoryRooms: [], // Start with empty array
  amenities: [],
  accessibility: [],
  roomAccessibility: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [],
  facilities: [],
  bedPreference: [],
  reservationPolicy: [],
  brands: [],
  roomFacilities: [],
  
  propertyRating: 0,
};

interface PropertyFormProps {
  propertyData: Property;
  setPropertyData: React.Dispatch<React.SetStateAction<Property>>;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ 
  propertyData = initialPropertyData, 
  setPropertyData 
}) => {

  const [newCategory, setNewCategory] = useState({
    title: '',
    qty: 1,
    price: 0,
    discountedPrice: 0,
    currency: 'USD'
  });
  
  // Update the property costing based on room categories
  useEffect(() => {
    if (propertyData.categoryRooms && propertyData.categoryRooms.length > 0) {
      // Find the minimum discounted price from all categories
      const categories = [...propertyData.categoryRooms];
      
      // Sort categories by discounted price (or regular price if no discount)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories.sort((a:any, b:any) => {
        const aPrice = a.discountedPrice > 0 ? a.discountedPrice : a.price;
        const bPrice = b.discountedPrice > 0 ? b.discountedPrice : b.price;
        return aPrice - bPrice;
      });
      
      // Use the first (minimum) category for property costing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const minCategory : any = categories[0];
      
      // Calculate total rooms from category quantities
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalRooms = categories.reduce((sum, category:any) => sum + (category.qty || 0), 0);
      
      // Update the property costing and total rooms
      setPropertyData(prev => ({
        ...prev,
        costing: {
          price: minCategory.price,
          discountedPrice: minCategory.discountedPrice,
          currency: minCategory.currency
        },
        rooms: totalRooms // Set rooms based on sum of category quantities
      }));
    } else {
      // Reset costing and rooms if no categories
      setPropertyData(prev => ({
        ...prev,
        costing: {
          price: 0,
          discountedPrice: 0,
          currency: 'USD'
        },
        rooms: 0 // Reset to 0 when no categories exist
      }));
    }
  }, [propertyData.categoryRooms, setPropertyData]);

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

  const handleCategoryChange = (field: string, value: string | number) => {
    setNewCategory(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCategory = () => {
    // Validate the new category
    if (!newCategory.title.trim()) {
      alert('Category title is required');
      return;
    }

    // Add to property data
    const updatedCategories = [...(propertyData.categoryRooms || []), {...newCategory}];
    handlePropertyChange('categoryRooms', updatedCategories);

    // Reset form
    setNewCategory({
      title: '',
      qty: 1,
      price: 0,
      discountedPrice: 0,
      currency: 'USD'
    });
  };

  const handleRemoveCategory = (index: number) => {
    const updatedCategories = [...(propertyData.categoryRooms || [])];
    updatedCategories.splice(index, 1);
    handlePropertyChange('categoryRooms', updatedCategories);
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
    categoryRooms: propertyData?.categoryRooms || [],
  };

  // Calculate total rooms for display
  const totalRooms = ensurePropertyData.categoryRooms.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum, category:any) => sum + (category.qty || 0), 
    0
  );

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
  
      {/* Show Total Rooms as a read-only display instead of input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Total Rooms</FormLabel>
          <div className="p-2 border rounded-md bg-gray-50">
            {totalRooms} {totalRooms === 1 ? 'room' : 'rooms'}
            <p className="text-xs text-gray-500 mt-1">
              (Automatically calculated from room categories)
            </p>
          </div>
        </FormItem>
        
        <FormItem>
          <FormLabel>Property Rating</FormLabel>
          <Select
            value={ ensurePropertyData.propertyRating ? ensurePropertyData.propertyRating.toString() : '1' }
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

      {/* Display property price information derived from room categories */}
      {ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-md font-medium mb-2">Property Price Information</h3>
          <p className="text-sm text-gray-700">
            Base price: {ensurePropertyData.costing.currency} {ensurePropertyData.costing.price}
            {ensurePropertyData.costing.discountedPrice > 0 && (
              <span className="ml-1 text-green-600">
                (Discounted: {ensurePropertyData.costing.currency} {ensurePropertyData.costing.discountedPrice})
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This price is automatically set to the lowest price from your room categories.
          </p>
        </div>
      )}

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Room Categories</h3>
        
        {/* List of existing categories */}
        {ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0 && (
          <div className="mb-4 space-y-2">
            <h4 className="text-sm font-medium">Added Categories:</h4>
            
            <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {ensurePropertyData.categoryRooms.map((cat:any, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <p className="font-medium">{cat.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Qty: {cat.qty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {cat.currency} {cat.price}
                        {cat.discountedPrice > 0 && (
                          <span className="ml-1 text-green-600">
                            (-{cat.currency} {cat.discountedPrice})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Form to add new category */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium mb-3">Add New Category:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormItem>
              <FormLabel>Category Title</FormLabel>
              <Input 
                value={newCategory.title}
                onChange={(e) => handleCategoryChange('title', e.target.value)}
                placeholder="e.g. Deluxe Room, Suite, etc."
              />
            </FormItem>
            
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <Input 
                type="number"
                value={newCategory.qty}
                onChange={(e) => handleCategoryChange('qty', Number(e.target.value) || 0)}
                min={1}
                placeholder="Number of rooms available"
              />
            </FormItem>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormItem>
              <FormLabel>Price</FormLabel>
              <Input 
                type="number"
                value={newCategory.price}
                onChange={(e) => handleCategoryChange('price', Number(e.target.value) || 0)}
                min={0}
                placeholder="Regular price"
              />
            </FormItem>
            
            <FormItem>
              <FormLabel>Discounted Price</FormLabel>
              <Input 
                type="number"
                value={newCategory.discountedPrice}
                onChange={(e) => handleCategoryChange('discountedPrice', Number(e.target.value) || 0)}
                min={0}
                placeholder="Discounted price (if any)"
              />
            </FormItem>
            
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                value={newCategory.currency} 
                onValueChange={(value) => handleCategoryChange('currency', value)} 
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
          
          <button 
            type="button"
            onClick={handleAddCategory}
            className="flex items-center justify-center w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} className="mr-2" /> Add Category
          </button>
        </div>
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
      
      {/* Additional property categories with multi-select dropdowns */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Additional Property Categories</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMultiSelect('accessibility', 'Property Accessibility')}
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

export default PropertyForm;