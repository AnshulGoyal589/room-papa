// src/components/PropertyDetails.tsx
import React from 'react';
import { MapPin, Users, Tag, Star, Calendar, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel } from '@/components/ui/form';
import GoogleMapsSection from './GoogleMapsSection';

const PropertyDetails: React.FC<{ item: Property; isEditable?: boolean }> = ({ item, isEditable = false }) => {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ensurePropertyData, setEnsurePropertyData] = React.useState<any>({
    ...item,
    categoryRooms: item.categoryRooms || []
  });
  
  const [newCategory, setNewCategory] = React.useState({
    title: '',
    qty: 1,
    price: 0,
    discountedPrice: 0,
    currency: 'USD'
  });
  
  const handleCategoryChange = (field: string, value: string | number) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddCategory = () => {
    if (!newCategory.title) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEnsurePropertyData((prev:any) => ({
      ...prev,
      categoryRooms: [...(prev.categoryRooms || []), newCategory]
    }));
    setNewCategory({ title: '', qty: 1, price: 0, discountedPrice: 0, currency: 'USD' });
  };
  
  const handleRemoveCategory = (index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEnsurePropertyData((prev:any) => ({
      ...prev,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categoryRooms: prev.categoryRooms.filter((_: any, i: number) => i !== index)
    }));
  };

  const getFormattedAddress = () => {
    if (!item.location) return 'Address not available';
    const { address, city, state, country } = item.location;
    let formattedAddress = address || '';
    if (city) formattedAddress += `, ${city}`;
    if (state) formattedAddress += `, ${state}`;
    if (country) formattedAddress += `, ${country}`;
    return formattedAddress || 'Address not available';
  };

  const formatPropertyType = (type: string | undefined) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper to render a list of string items as badges (defined inside the component)
  const renderBadges = (items: string[] | undefined, emptyMessage: string) => {
    if (!items || items.length === 0 || (items.length === 1 && !items[0]?.trim())) {
      return <p className="text-sm text-gray-500">{emptyMessage}</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((itemStr, index) => (
          <Badge key={index} variant="outline" className="text-sm py-1 px-2.5">
            {typeof itemStr === 'string' ? 
              itemStr.charAt(0).toUpperCase() + itemStr.slice(1).replace(/([A-Z])/g, ' $1') : 
              'Unknown Item'}
          </Badge>
        ))}
      </div>
    );
  };

  // Helper function to render sections of badges (defined inside the component)
  // This function will now have access to `renderBadges` and `isEditable` from the component's scope.
  const renderSection = (
    sectionTitle: string, 
    data: string[] | undefined, 
    emptyMsg: string
  ) => {
    const hasData = data && data.length > 0 && !(data.length === 1 && !data[0]?.trim());

    if (!hasData && !isEditable) { // If no data and not editable, render nothing for this section
        return null;
    }

    return (
      <div className="border-t pt-6 mt-6">
        <h4 className="text-base font-medium mb-3 text-gray-700">{sectionTitle}</h4>
        {renderBadges(data, isEditable && !hasData ? `No ${sectionTitle.toLowerCase()} added yet.` : emptyMsg)}
      </div>
    );
  };


  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Property Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 mb-6">
        <div className="flex items-start">
          <MapPin className="w-4 h-4 mr-2 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="text-sm">{getFormattedAddress()}</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-4 h-4 mr-2 text-gray-500 shrink-0 mt-1 flex items-center justify-center font-bold">$</div>
          <div>
            <p className="text-sm text-gray-500">Price per night</p>
            <p className="text-sm">
              {item.costing?.price?.toLocaleString() || 0} {item.costing?.currency || 'USD'}
              {item.costing?.discountedPrice && item.costing?.discountedPrice < (item.costing?.price || 0) && (
                <span className="ml-2 text-green-600">
                  (Discounted: {item.costing.discountedPrice.toLocaleString()} {item.costing.currency})
                </span>
              )}
            </p>
          </div>
        </div>
 
        <div className="flex items-start">
          <Users className="w-4 h-4 mr-2 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Maximum Rooms</p>
            <p className="text-sm">{item.rooms || 0}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Tag className="w-4 h-4 mr-2 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="text-sm">{formatPropertyType(item.type)}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <Star className="w-4 h-4 mr-2 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <p className="text-sm">
              {item.propertyRating ? `Property Rating: ${item.propertyRating.toString()}` : 'Not rated yet'}
            </p>
          </div>
        </div>
        
        <GoogleMapsSection item={item} /> 

        <div className="flex items-start">
          <Calendar className="w-4 h-4 mr-2 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Availability</p>
            <p className="text-sm">
              {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} - 
              {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {(isEditable || (ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0)) && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Room Categories</h3>
          
          {ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0 && (
            <div className="mb-4 space-y-3">
              <h4 className="text-base font-medium text-gray-700">Available Categories:</h4>
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {ensurePropertyData.categoryRooms.map((cat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-md shadow-sm">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-sm">
                      <div className="font-medium col-span-2 sm:col-span-1">{cat.title}</div>
                      <div className="text-gray-600">Qty: {cat.qty}</div>
                      <div className="text-gray-600">
                        {cat.currency} {cat.price.toLocaleString()}
                        {cat.discountedPrice > 0 && cat.discountedPrice < cat.price && (
                          <span className="ml-1 text-green-600 line-through text-xs">
                            {cat.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {cat.discountedPrice > 0 && cat.discountedPrice < cat.price && (
                         <div className="text-green-700 font-semibold">
                           {cat.currency} {cat.discountedPrice.toLocaleString()}
                         </div>
                      )}
                    </div>
                    {isEditable && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveCategory(index)}
                        className="text-red-500 hover:text-red-700 ml-3 p-1 rounded hover:bg-red-100 transition-colors"
                        aria-label="Remove category"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isEditable && (
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h4 className="text-base font-medium mb-3 text-gray-700">Add New Category:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormItem>
                  <FormLabel htmlFor={`new-cat-title-${item._id || 'new'}`}>Category Title</FormLabel>
                  <Input 
                    id={`new-cat-title-${item._id || 'new'}`}
                    value={newCategory.title}
                    onChange={(e) => handleCategoryChange('title', e.target.value)}
                    placeholder="e.g. Deluxe Room, Suite"
                  />
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor={`new-cat-qty-${item._id || 'new'}`}>Quantity</FormLabel>
                  <Input 
                    id={`new-cat-qty-${item._id || 'new'}`}
                    type="number"
                    value={newCategory.qty}
                    onChange={(e) => handleCategoryChange('qty', Number(e.target.value) || 0)}
                    min={1}
                    placeholder="Number of rooms"
                  />
                </FormItem>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormItem>
                  <FormLabel htmlFor={`new-cat-price-${item._id || 'new'}`}>Price</FormLabel>
                  <Input 
                    id={`new-cat-price-${item._id || 'new'}`}
                    type="number"
                    value={newCategory.price}
                    onChange={(e) => handleCategoryChange('price', Number(e.target.value) || 0)}
                    min={0}
                    placeholder="Regular price"
                  />
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor={`new-cat-discount-${item._id || 'new'}`}>Discounted Price (Optional)</FormLabel>
                  <Input 
                    id={`new-cat-discount-${item._id || 'new'}`}
                    type="number"
                    value={newCategory.discountedPrice}
                    onChange={(e) => handleCategoryChange('discountedPrice', Number(e.target.value) || 0)}
                    min={0}
                    placeholder="If applicable"
                  />
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor={`new-cat-currency-${item._id || 'new'}`}>Currency</FormLabel>
                  <Select
                    value={newCategory.currency} 
                    onValueChange={(value) => handleCategoryChange('currency', value)} 
                  >
                    <SelectTrigger id={`new-cat-currency-${item._id || 'new'}`}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>
              <button 
                type="button"
                onClick={handleAddCategory}
                className="flex items-center justify-center w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus size={18} className="mr-2" /> Add Category
              </button>
            </div>
          )}
        </div>
      )}
      
      {/*
        THE ERRONEOUS ANONYMOUS FUNCTION BLOCK HAS BEEN REMOVED FROM HERE.
        We now directly call the `renderSection` helper function.
      */}

      {/* Dynamic Sections using the helper */}
      {renderSection("Amenities", item.amenities, 'No amenities listed')}
      {renderSection("Property Accessibility", item.accessibility, 'No property accessibility features listed')}
      {renderSection("Room Accessibility", item.roomAccessibility, 'No room accessibility features listed')}
      {renderSection("Popular Filters", item.popularFilters, 'No popular filters listed')}
      {renderSection("Fun Things To Do", item.funThingsToDo, 'No fun activities listed')}
      {renderSection("Meals", item.meals, 'No meal options listed')}
      {renderSection("Facilities", item.facilities, 'No facilities listed')}
      {renderSection("Bed Preference", item.bedPreference, 'No bed preferences listed')}
      {renderSection("Reservation Policy", item.reservationPolicy, 'No reservation policies listed')}
      {renderSection("Brands", item.brands, 'No brands listed')}
      {renderSection("Room Facilities", item.roomFacilities, 'No room facilities listed')}
      
      {item.bannerImage?.url && (
        <div className="border-t pt-6 mt-6">
          <h4 className="text-base font-medium mb-3 text-gray-700">Banner Image</h4>
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-md">
            <Image
              fill
              src={item.bannerImage.url} 
              alt={item.bannerImage.alt || "Property banner"} 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      )}
      
      {item.detailImages && item.detailImages.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="text-base font-medium mb-3 text-gray-700">Gallery</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {item.detailImages.map((image, index) => (
              <div key={image.url || index} className="relative aspect-square rounded-md overflow-hidden shadow hover:shadow-lg transition-shadow">
                <Image
                  fill
                  src={image.url} 
                  alt={image.alt || `Property image ${index + 1}`} 
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {item.review && item.review.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="text-base font-medium mb-3 text-gray-700">Reviews ({item.review.length})</h4>
          <div className="space-y-4">
            {item.review.slice(0, 3).map((review, index) => (
              <div key={index} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-700">{review.rating || 0}/5</span>
                </div>
                {/* {review.title && <p className="font-semibold text-gray-800 mb-1">{review.title}</p>}
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                {review.user && <p className="text-xs text-gray-400 mt-2">- {review.user.name || 'Anonymous'}</p>} */}
              </div>
            ))}
            {item.review.length > 3 && (
              <button className="text-sm text-blue-600 hover:underline">
                View all {item.review.length} reviews
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;