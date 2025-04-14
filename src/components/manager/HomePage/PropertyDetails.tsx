import React from 'react';
import { MapPin, Users, Tag, Star, Calendar, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel } from '@/components/ui/form';

const PropertyDetails: React.FC<{ item: Property; isEditable?: boolean }> = ({ item, isEditable = false }) => {
  // console.log("Item: ", item);
  // State for managing room categories
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ensurePropertyData, setEnsurePropertyData] = React.useState<any>({
    ...item,
    categoryRooms: item.categoryRooms || []
  });
  
  // State for new category
  const [newCategory, setNewCategory] = React.useState({
    title: '',
    qty: 1,
    price: 0,
    discountedPrice: 0,
    currency: 'USD'
  });
  
  // Handle changes in the new category form
  const handleCategoryChange = (field: string, value: string | number) => {
    setNewCategory(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add a new category
  const handleAddCategory = () => {
    if (!newCategory.title) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEnsurePropertyData((prev:any) => ({
      ...prev,
      categoryRooms: [...(prev.categoryRooms || []), newCategory]
    }));
    
    // Reset form
    setNewCategory({
      title: '',
      qty: 1,
      price: 0,
      discountedPrice: 0,
      currency: 'USD'
    });
  };
  
  // Remove a category
  const handleRemoveCategory = (index: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEnsurePropertyData((prev:any) => ({
      ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categoryRooms: prev.categoryRooms.filter((_: any, i: number) => i !== index)
    }));
  };

  // Function to get formatted address
  const getFormattedAddress = () => {
    if (!item.location) return 'Address not available';
    
    const { address, city, state, country } = item.location;
    let formattedAddress = address || '';
    
    if (city) formattedAddress += `, ${city}`;
    if (state) formattedAddress += `, ${state}`;
    if (country) formattedAddress += `, ${country}`;
    
    return formattedAddress || 'Address not available';
  };

  // Format the property type for display
  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper to render a list of string items as badges
  const renderBadges = (items: string[] | undefined, emptyMessage: string) => {
    if (!items || items.length === 0 || (items.length === 1 && !items[0].trim())) {
      return <p className="text-gray-500">{emptyMessage}</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="outline">
            {typeof item === 'string' ? 
              item.charAt(0).toUpperCase() + item.slice(1).replace(/([A-Z])/g, ' $1') : 
              'Unknown Item'}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Property Details</h3>
      
      {/* Main property details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p>{getFormattedAddress()}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 text-gray-500">$</div>
          <div>
            <p className="text-sm text-gray-500">Price per night</p>
            <p>
              {item.costing?.price?.toLocaleString() || 0} {item.costing?.currency || 'USD'}
              {item.costing?.discountedPrice && item.costing?.discountedPrice < item.costing?.price && (
                <span className="ml-2 text-green-600">
                  Discounted: {item.costing.discountedPrice.toLocaleString()} {item.costing.currency}
                </span>
              )}
            </p>
          </div>
        </div>
 
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Maximum Rooms</p>
            <p>{item.rooms || 0}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Tag className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p>{formatPropertyType(item.type || 'hotel')}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Star className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <p>
              {/* {item.totalRating || 0}/5 ({item.review?.length || 0} reviews) */}
              {item.propertyRating && <span className="ml-2">Property Rating: {item.propertyRating.toString()}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Availability</p>
            <p>
              {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} - 
              {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Room Categories Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Room Categories</h3>
        
        {/* List of existing categories */}
        {ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0 && (
          <div className="mb-4 space-y-2">
            <h4 className="text-sm font-medium">Available Categories:</h4>
            
            <div className="space-y-2">
            {/*  eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {ensurePropertyData.categoryRooms.map((cat: any, index: number) => (
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
                  {isEditable && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Form to add new category - only shown in editable mode */}
        {isEditable && (
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
        )}
      </div>
      
      {/* Amenities section */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Amenities</h4>
        {renderBadges(item.amenities, 'No amenities listed')}
      </div>

      {/* Property Accessibility */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Property Accessibility</h4>
        {renderBadges(item.accessibility, 'No property accessibility features listed')}
      </div>

      {/* Room Accessibility */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Room Accessibility</h4>
        {renderBadges(item.roomAccessibility, 'No room accessibility features listed')}
      </div>

      {/* Popular Filters */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Popular Filters</h4>
        {renderBadges(item.popularFilters, 'No popular filters listed')}
      </div>

      {/* Fun Things To Do */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Fun Things To Do</h4>
        {renderBadges(item.funThingsToDo, 'No fun activities listed')}
      </div>

      {/* Meals */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Meals</h4>
        {renderBadges(item.meals, 'No meal options listed')}
      </div>

      {/* Facilities */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Facilities</h4>
        {renderBadges(item.facilities, 'No facilities listed')}
      </div>

      {/* Bed Preference */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Bed Preference</h4>
        {renderBadges(item.bedPreference, 'No bed preferences listed')}
      </div>

      {/* Reservation Policy */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Reservation Policy</h4>
        {renderBadges(item.reservationPolicy, 'No reservation policies listed')}
      </div>

      {/* Brands */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Brands</h4>
        {renderBadges(item.brands, 'No brands listed')}
      </div>

      {/* Room Facilities */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Room Facilities</h4>
        {renderBadges(item.roomFacilities, 'No room facilities listed')}
      </div>
      
      {/* Banner Image */}
      {item.bannerImage && item.bannerImage.url && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Banner Image</h4>
          <Image
            width={500}
            height={300}
            src={item.bannerImage.url} 
            alt={item.bannerImage.alt || "Property banner"} 
            className="rounded-md object-cover w-full h-64"
          />
        </div>
      )}
      
      {/* Detail Images section */}
      {item.detailImages && item.detailImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Gallery</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {item.detailImages.map((image, index) => (
              <Image
                width={200}
                height={200} 
                key={index} 
                src={image.url} 
                alt={`Property image ${index + 1}`} 
                className="rounded-md object-cover h-32 w-full"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Reviews section */}
      {item.review && item.review.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Reviews</h4>
          <div className="space-y-4">
            {item.review.slice(0, 3).map((review, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  <span>{review.rating}/5</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
            {item.review.length > 3 && (
              <p className="text-sm text-gray-500">And {item.review.length - 3} more reviews</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;