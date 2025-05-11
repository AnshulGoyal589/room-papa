// src/components/PropertyDetails.tsx
import React from 'react';
import { MapPin, Users, Tag, Star, Calendar, X, Plus, Baby, DollarSign as PriceIcon } from 'lucide-react'; // Added Baby and PriceIcon
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property'; // Assuming Review is part of Property type
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel } from '@/components/ui/form'; // Assuming these are ShadCN form components
import GoogleMapsSection from './GoogleMapsSection';
import { RoomCategory as StoredRoomCategory, RoomCategoryPricing } from '@/types'; // Import your updated types

// Helper to generate unique IDs if adding categories locally
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state for the new category form, matching the detailed structure
const initialNewCategoryFormState = {
  title: '',
  qty: 1,
  currency: 'USD', // Default, can be updated
  pricing: {
    singleOccupancyAdultPrice: 0,
    discountedSingleOccupancyAdultPrice: 0,
    doubleOccupancyAdultPrice: 0,
    discountedDoubleOccupancyAdultPrice: 0,
    tripleOccupancyAdultPrice: 0,
    discountedTripleOccupancyAdultPrice: 0,
    child5to12Price: 0,
    discountedChild5to12Price: 0,
    child12to18Price: 0,
    discountedChild12to18Price: 0,
  }
};


interface PropertyDetailsProps {
  item: Property; // Expect 'item' to have the detailed categoryRooms structure
  isEditable?: boolean;
  // onUpdate?: (updatedProperty: Property) => void; // Optional: If changes need to be saved
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ item, isEditable = false }) => {

  // State to hold property data, including potentially modified categoryRooms if editable
  // Strongly recommend typing this properly instead of 'any'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ensurePropertyData, setEnsurePropertyData] = React.useState<any>({
    ...item,
    categoryRooms: item.categoryRooms || [] // Expects StoredRoomCategory[]
  });
  
  // State for the "Add New Category" form
  const [newCategory, setNewCategory] = React.useState<{
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing;
  }>({
    ...initialNewCategoryFormState,
    currency: item.costing?.currency || "USD"
  });

  React.useEffect(() => {
    // Update local state if the item prop changes
    setEnsurePropertyData({
        ...item,
        categoryRooms: item.categoryRooms || []
    });
    // Reset newCategory currency if item changes and not currently editing its currency
    setNewCategory(prev => ({ ...prev, currency: item.costing?.currency || "USD" }));
  }, [item]);
  
  const handleNewCategoryFieldChange = (field: keyof Omit<typeof newCategory, 'pricing'>, value: string | number) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };

  const handleNewCategoryPricingChange = (field: keyof RoomCategoryPricing, value: string | number) => {
    const numericValue = Number(value);
    setNewCategory(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: numericValue < 0 ? 0 : numericValue
      }
    }));
  };
  
  const handleAddCategory = () => {
    if (!newCategory.title.trim()) { alert("Category title is required."); return; }
    if (newCategory.qty <= 0) { alert("Quantity must be greater than 0."); return; }
    if (newCategory?.pricing?.singleOccupancyAdultPrice <= 0 && newCategory?.pricing?.doubleOccupancyAdultPrice <= 0 && newCategory.pricing?.tripleOccupancyAdultPrice <= 0) {
        alert("At least one adult occupancy price must be greater than 0."); return;
    }
    // Add more validation as needed (e.g., discounted price logic)

    const categoryToAdd: StoredRoomCategory = {
      id: generateId(), // Generate a unique ID for local state management
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: { ...newCategory.pricing }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEnsurePropertyData((prev: any) => ({
      ...prev,
      categoryRooms: [...(prev.categoryRooms || []), categoryToAdd]
    }));
    
    // Reset the form, keeping the currency from the last added/property
    setNewCategory({
      ...initialNewCategoryFormState,
      currency: newCategory.currency 
    });

    // If an onUpdate prop exists, you might call it here
    // onUpdate?.({...ensurePropertyData, categoryRooms: [...ensurePropertyData.categoryRooms, categoryToAdd]});
  };
  
  const handleRemoveCategory = (idToRemove: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEnsurePropertyData((prev: any) => ({
      ...prev,
      categoryRooms: prev.categoryRooms.filter((cat: StoredRoomCategory) => cat.id !== idToRemove)
    }));
    // If an onUpdate prop exists, you might call it here
    // onUpdate?.({...ensurePropertyData, categoryRooms: ensurePropertyData.categoryRooms.filter((cat: StoredRoomCategory) => cat.id !== idToRemove)});
  };

  const getFormattedAddress = () => {
    if (!ensurePropertyData.location) return 'Address not available';
    const { address, city, state, country } = ensurePropertyData.location;
    return [address, city, state, country].filter(Boolean).join(', ') || 'Address not available';
  };

  const formatPropertyType = (type: string | undefined) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderBadges = (items: string[] | undefined, emptyMessage: string) => {
    if (!items || items.length === 0 || (items.length === 1 && !items[0]?.trim())) {
      return <p className="text-sm text-gray-500">{emptyMessage}</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((itemStr, index) => (
          <Badge key={index} variant="outline" className="text-sm py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300">
            {typeof itemStr === 'string' ? 
              itemStr.charAt(0).toUpperCase() + itemStr.slice(1).replace(/([A-Z])/g, ' $1') : 
              'Unknown Item'}
          </Badge>
        ))}
      </div>
    );
  };

  const renderSection = (
    sectionTitle: string, 
    data: string[] | undefined, 
    emptyMsg: string
  ) => {
    const hasData = data && data.length > 0 && !(data.length === 1 && !data[0]?.trim());
    if (!hasData && !isEditable) return null;
    return (
      <div className="border-t pt-6 mt-6">
        <h4 className="text-lg font-semibold mb-3 text-gray-800">{sectionTitle}</h4>
        {renderBadges(data, isEditable && !hasData ? `No ${sectionTitle.toLowerCase()} added yet. You can add them in the edit form.` : emptyMsg)}
      </div>
    );
  };

  // Calculate overall property price and rooms (from ensurePropertyData.categoryRooms)
  // This logic should mirror what's in PropertyEditForm's useEffect
  let displayPrice = ensurePropertyData.costing?.price || 0;
  let displayDiscountedPrice = ensurePropertyData.costing?.discountedPrice || 0;
  let displayCurrency = ensurePropertyData.costing?.currency || 'USD';
  let displayTotalRooms = ensurePropertyData.rooms || 0;

  if (ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = ensurePropertyData.categoryRooms[0].currency || "USD";

      ensurePropertyData.categoryRooms.forEach((cat: StoredRoomCategory) => {
        const prices: number[] = [];
        const discountedPrices: number[] = [];

        prices.push(cat.pricing?.singleOccupancyAdultPrice);
        discountedPrices.push(cat.pricing?.discountedSingleOccupancyAdultPrice && cat.pricing?.discountedSingleOccupancyAdultPrice > 0 ? cat.pricing?.discountedSingleOccupancyAdultPrice : cat.pricing?.singleOccupancyAdultPrice);
        if (cat.pricing?.doubleOccupancyAdultPrice > 0) {
          prices.push(cat.pricing?.doubleOccupancyAdultPrice / 2);
          discountedPrices.push(cat.pricing?.discountedDoubleOccupancyAdultPrice && cat.pricing?.discountedDoubleOccupancyAdultPrice > 0 ? cat.pricing?.discountedDoubleOccupancyAdultPrice / 2 : cat.pricing?.doubleOccupancyAdultPrice / 2);
        }
        if (cat.pricing?.tripleOccupancyAdultPrice > 0) {
          prices.push(cat.pricing?.tripleOccupancyAdultPrice / 3);
          discountedPrices.push(cat.pricing?.discountedTripleOccupancyAdultPrice && cat.pricing?.discountedTripleOccupancyAdultPrice > 0 ? cat.pricing?.discountedTripleOccupancyAdultPrice / 3 : cat.pricing?.tripleOccupancyAdultPrice / 3);
        }
        
        const currentCatMinPrice = Math.min(...prices.filter(p => p > 0 && isFinite(p)));
        const currentCatMinDiscountedPrice = Math.min(...discountedPrices.filter(p => p > 0 && isFinite(p)));

        if (currentCatMinPrice < minOverallPrice) {
          minOverallPrice = currentCatMinPrice;
          leadCurrency = cat.currency;
        }
        if (currentCatMinDiscountedPrice < minOverallDiscountedPrice) {
          minOverallDiscountedPrice = currentCatMinDiscountedPrice;
        }
      });
      
      displayTotalRooms = ensurePropertyData.categoryRooms.reduce((sum: number, category: StoredRoomCategory) => sum + (category.qty || 0), 0);
      displayPrice = minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2));
      displayDiscountedPrice = minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2));
      displayCurrency = leadCurrency;
  }


  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{ensurePropertyData.title || "Property Details"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Location</p>
            <p className="text-base text-gray-700">{getFormattedAddress()}</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <PriceIcon className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Starting Price (per adult)</p>
            <p className="text-base text-gray-700">
              {displayPrice.toLocaleString()} {displayCurrency}
              {displayDiscountedPrice > 0 && displayDiscountedPrice < displayPrice && (
                <span className="ml-2 text-green-600 font-semibold">
                  (Now: {displayDiscountedPrice.toLocaleString()} {displayCurrency})
                </span>
              )}
            </p>
          </div>
        </div>
 
        <div className="flex items-start space-x-3">
          <Users className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Total Rooms Available</p>
            <p className="text-base text-gray-700">{displayTotalRooms}</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Tag className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Type</p>
            <p className="text-base text-gray-700">{formatPropertyType(ensurePropertyData.type)}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Star className="w-5 h-5 text-yellow-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Property Rating</p>
            <p className="text-base text-gray-700">
              {ensurePropertyData.propertyRating ? `${ensurePropertyData.propertyRating.toString()} / 5 Stars` : 'Not rated yet'}
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Availability</p>
            <p className="text-base text-gray-700">
              {ensurePropertyData.startDate ? new Date(ensurePropertyData.startDate).toLocaleDateString() : 'N/A'} - 
              {ensurePropertyData.endDate ? new Date(ensurePropertyData.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      <GoogleMapsSection item={ensurePropertyData} /> 

      {(isEditable || (ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0)) && (
        <div className="border-t pt-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Room Categories & Pricing</h3>
          
          {ensurePropertyData.categoryRooms && ensurePropertyData.categoryRooms.length > 0 && (
            <div className="mb-6 space-y-4">
              {ensurePropertyData.categoryRooms.map((cat: StoredRoomCategory) => ( // Use StoredRoomCategory type
                <div key={cat.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms available)</span></p>
                      <p className="text-sm text-gray-500">Currency: {cat.currency}</p>
                    </div>
                    {isEditable && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 transition-colors"
                        aria-label={`Remove ${cat.title} category`}
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                   <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-700 flex items-center"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p>
                      <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5">
                        <li>1 Adult: {cat.currency} {cat.pricing?.singleOccupancyAdultPrice.toLocaleString()}
                            {cat.pricing?.discountedSingleOccupancyAdultPrice && cat.pricing?.discountedSingleOccupancyAdultPrice > 0 && cat.pricing?.discountedSingleOccupancyAdultPrice < cat.pricing?.singleOccupancyAdultPrice ? <span className="text-green-600 font-medium"> (Now: {cat.pricing?.discountedSingleOccupancyAdultPrice.toLocaleString()})</span> : ''}
                        </li>
                        <li>2 Adults: {cat.currency} {cat.pricing?.doubleOccupancyAdultPrice.toLocaleString()}
                            {cat.pricing?.discountedDoubleOccupancyAdultPrice && cat.pricing?.discountedDoubleOccupancyAdultPrice > 0 && cat.pricing?.discountedDoubleOccupancyAdultPrice < cat.pricing?.doubleOccupancyAdultPrice ? <span className="text-green-600 font-medium"> (Now: {cat.pricing?.discountedDoubleOccupancyAdultPrice.toLocaleString()})</span> : ''}
                        </li>
                        <li>3 Adults: {cat.currency} {cat.pricing?.tripleOccupancyAdultPrice.toLocaleString()}
                            {cat.pricing?.discountedTripleOccupancyAdultPrice && cat.pricing?.discountedTripleOccupancyAdultPrice > 0 && cat.pricing?.discountedTripleOccupancyAdultPrice < cat.pricing?.tripleOccupancyAdultPrice ? <span className="text-green-600 font-medium"> (Now: {cat.pricing?.discountedTripleOccupancyAdultPrice.toLocaleString()})</span> : ''}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 flex items-center mt-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p>
                       <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5">
                        <li>5-12 yrs: {cat.currency} {cat.pricing?.child5to12Price.toLocaleString()}
                             {cat.pricing?.discountedChild5to12Price && cat.pricing?.discountedChild5to12Price > 0 && cat.pricing?.discountedChild5to12Price < cat.pricing?.child5to12Price ? <span className="text-green-600 font-medium"> (Now: {cat.pricing?.discountedChild5to12Price.toLocaleString()})</span> : ''}
                        </li>
                        <li>12-18 yrs: {cat.currency} {cat.pricing?.child12to18Price.toLocaleString()}
                            {cat.pricing?.discountedChild12to18Price && cat.pricing?.discountedChild12to18Price > 0 && cat.pricing?.discountedChild12to18Price < cat.pricing?.child12to18Price ? <span className="text-green-600 font-medium"> (Now: {cat.pricing?.discountedChild12to18Price.toLocaleString()})</span> : ''}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isEditable && (
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-md space-y-6">
              <h4 className="text-lg font-semibold text-gray-700">Add New Room Category:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormItem className="md:col-span-1">
                  <FormLabel htmlFor={`new-cat-title-${ensurePropertyData._id || 'new'}`}>Category Title</FormLabel>
                  <Input id={`new-cat-title-${ensurePropertyData._id || 'new'}`} value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g. Deluxe Room" />
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor={`new-cat-qty-${ensurePropertyData._id || 'new'}`}>Quantity</FormLabel>
                  <Input id={`new-cat-qty-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} />
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor={`new-cat-curr-${ensurePropertyData._id || 'new'}`}>Currency</FormLabel>
                  <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}>
                    <SelectTrigger id={`new-cat-curr-${ensurePropertyData._id || 'new'}`}><SelectValue placeholder="Currency" /></SelectTrigger>
                    <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              </div>

              <div className="pt-4 border-t border-gray-300">
                <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price)</FormLabel>
                {[
                  { occupancy: 1, base: 'singleOccupancyAdultPrice', disc: 'discountedSingleOccupancyAdultPrice', label: '1 Adult' },
                  { occupancy: 2, base: 'doubleOccupancyAdultPrice', disc: 'discountedDoubleOccupancyAdultPrice', label: '2 Adults' },
                  { occupancy: 3, base: 'tripleOccupancyAdultPrice', disc: 'discountedTripleOccupancyAdultPrice', label: '3 Adults' },
                ].map(p => (
                  <div key={p.occupancy} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4 items-end">
                    <FormItem>
                      <FormLabel className="text-sm" htmlFor={`new-cat-adult-${p.base}-${ensurePropertyData._id || 'new'}`}>{p.label} - Base Price</FormLabel>
                      <Input id={`new-cat-adult-${p.base}-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.pricing[p.base as keyof RoomCategoryPricing]} onChange={(e) => handleNewCategoryPricingChange(p.base as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" step="0.01" />
                    </FormItem>
                    <FormItem>
                      <FormLabel className="text-sm" htmlFor={`new-cat-adult-${p.disc}-${ensurePropertyData._id || 'new'}`}>{p.label} - Discounted (Optional)</FormLabel>
                      <Input id={`new-cat-adult-${p.disc}-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.pricing[p.disc as keyof RoomCategoryPricing] || ''} onChange={(e) => handleNewCategoryPricingChange(p.disc as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" step="0.01" />
                    </FormItem>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-300">
                <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, sharing)</FormLabel>
                 {[
                  { age: '5-12 yrs', base: 'child5to12Price', disc: 'discountedChild5to12Price' },
                  { age: '12-18 yrs', base: 'child12to18Price', disc: 'discountedChild12to18Price' },
                ].map(p => (
                  <div key={p.age} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4 items-end">
                    <FormItem>
                      <FormLabel className="text-sm" htmlFor={`new-cat-child-${p.base}-${ensurePropertyData._id || 'new'}`}>Child ({p.age}) - Base Price</FormLabel>
                      <Input id={`new-cat-child-${p.base}-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.pricing[p.base as keyof RoomCategoryPricing]} onChange={(e) => handleNewCategoryPricingChange(p.base as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" step="0.01" />
                    </FormItem>
                    <FormItem>
                      <FormLabel className="text-sm" htmlFor={`new-cat-child-${p.disc}-${ensurePropertyData._id || 'new'}`}>Child ({p.age}) - Discounted (Optional)</FormLabel>
                      <Input id={`new-cat-child-${p.disc}-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.pricing[p.disc as keyof RoomCategoryPricing] || ''} onChange={(e) => handleNewCategoryPricingChange(p.disc as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" step="0.01" />
                    </FormItem>
                  </div>
                ))}
              </div>
              <button 
                type="button"
                onClick={handleAddCategory}
                className="flex items-center justify-center w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus size={18} className="mr-2" /> Add This Category
              </button>
            </div>
          )}
        </div>
      )}
      
      {renderSection("Amenities", ensurePropertyData.amenities, 'No specific amenities listed.')}
      {renderSection("Property Accessibility", ensurePropertyData.accessibility, 'No property-wide accessibility features detailed.')}
      {renderSection("Room Accessibility", ensurePropertyData.roomAccessibility, 'No specific room accessibility features detailed.')}
      {renderSection("Popular Filters", ensurePropertyData.popularFilters, 'No popular filters listed.')}
      {renderSection("Fun Things To Do", ensurePropertyData.funThingsToDo, 'No fun activities listed.')}
      {renderSection("Meals", ensurePropertyData.meals, 'No meal options listed.')}
      {renderSection("Facilities", ensurePropertyData.facilities, 'No facilities listed.')}
      {renderSection("Bed Preference", ensurePropertyData.bedPreference, 'No bed preferences listed.')}
      {renderSection("Reservation Policy", ensurePropertyData.reservationPolicy, 'No reservation policies listed.')}
      {renderSection("Brands", ensurePropertyData.brands, 'No brands listed.')}
      {renderSection("Room Facilities", ensurePropertyData.roomFacilities, 'No room facilities listed.')}

      
      {/* Additional sections can be added here */}
      {/* ... other renderSection calls ... */}
      
      {ensurePropertyData.bannerImage?.url && (
        <div className="border-t pt-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Banner Image</h3>
          <div className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-xl">
            <Image
              fill
              src={ensurePropertyData.bannerImage.url} 
              alt={ensurePropertyData.bannerImage.alt || ensurePropertyData.title || "Property banner"} 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        </div>
      )}
      
      {ensurePropertyData.detailImages && ensurePropertyData.detailImages.length > 0 && (
        <div className="border-t pt-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Photo Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ensurePropertyData.detailImages.map((image: { url: string; alt?: string; public_id?: string }, index: number) => (
              <div key={image.public_id || image.url || index} className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
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
      
      {/* {ensurePropertyData.review && ensurePropertyData.review.length > 0 && (
        <div className="border-t pt-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer Reviews ({ensurePropertyData.review.length})</h3>
          <div className="space-y-6">
            {ensurePropertyData.review.slice(0, 3).map((review: Review, index: number) => ( // Assuming Review type from models
              <div key={review._id?.toString() || index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-md">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < (review.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-3 text-sm font-bold text-gray-700">{review.rating || 0}/5</span>
                </div>
                <p className="text-gray-700 leading-relaxed mb-1">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-3">- {review.userId?.toString().slice(-6) || 'Anonymous User'}{review.createdAt && `, on ${new Date(review.createdAt).toLocaleDateString()}`}</p>
              </div>
            ))}
            {ensurePropertyData.review.length > 3 && (
              <button className="text-sm text-blue-600 hover:underline font-medium">
                View all {ensurePropertyData.review.length} reviews
              </button>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default PropertyDetails;