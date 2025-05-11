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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, X, Home, MapPin, DollarSign, BedDouble, ListChecks, ShieldCheck, Users, Baby } from 'lucide-react';
import { Property } from '@/lib/mongodb/models/Property';
import { PropertyType, RoomCategory as StoredRoomCategory, RoomCategoryPricing } from '@/types'; // Assuming types are updated
import { categoryOptions } from '../../../../public/assets/data';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state for the form to add a new room category
const initialNewCategoryState = {
  title: '',
  qty: 1,
  currency: 'USD',
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
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
  costing: { // This will be calculated
    price: 0,
    discountedPrice: 0,
    currency: 'USD', // Default, will be updated from the first room category or a chosen one
  },
  rooms: 0, // Will be calculated from room categories qty

  categoryRooms: [], // Array of StoredRoomCategory
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
  googleMaps: '',
};

interface PropertyFormProps {
  propertyData: Property;
  setPropertyData: React.Dispatch<React.SetStateAction<Property>>;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ 
  propertyData = initialPropertyData, 
  setPropertyData 
}) => {
  const [newCategory, setNewCategory] = useState<{
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing;
  }>(initialNewCategoryState);
  
  useEffect(() => {
    if (propertyData.categoryRooms && propertyData.categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = propertyData.categoryRooms[0].currency || 'USD';

      propertyData.categoryRooms.forEach(cat => {
        // Calculate effective per-adult prices for this category
        const prices: number[] = [];
        const discountedPrices: number[] = [];

        // Single occupancy
        prices.push(cat.pricing.singleOccupancyAdultPrice);
        if (cat.pricing.discountedSingleOccupancyAdultPrice !== undefined && cat.pricing.discountedSingleOccupancyAdultPrice > 0) {
          discountedPrices.push(cat.pricing.discountedSingleOccupancyAdultPrice);
        } else {
          discountedPrices.push(cat.pricing.singleOccupancyAdultPrice);
        }

        // Double occupancy (per person)
        if (cat.pricing.doubleOccupancyAdultPrice > 0) {
          prices.push(cat.pricing.doubleOccupancyAdultPrice / 2);
          if (cat.pricing.discountedDoubleOccupancyAdultPrice !== undefined && cat.pricing.discountedDoubleOccupancyAdultPrice > 0) {
            discountedPrices.push(cat.pricing.discountedDoubleOccupancyAdultPrice / 2);
          } else {
            discountedPrices.push(cat.pricing.doubleOccupancyAdultPrice / 2);
          }
        }
        
        // Triple occupancy (per person)
        if (cat.pricing.tripleOccupancyAdultPrice > 0) {
          prices.push(cat.pricing.tripleOccupancyAdultPrice / 3);
          if (cat.pricing.discountedTripleOccupancyAdultPrice !== undefined && cat.pricing.discountedTripleOccupancyAdultPrice > 0) {
            discountedPrices.push(cat.pricing.discountedTripleOccupancyAdultPrice / 3);
          } else {
            discountedPrices.push(cat.pricing.tripleOccupancyAdultPrice / 3);
          }
        }
        
        const currentCatMinPrice = Math.min(...prices.filter(p => p > 0));
        const currentCatMinDiscountedPrice = Math.min(...discountedPrices.filter(p => p > 0));

        if (currentCatMinPrice < minOverallPrice) {
          minOverallPrice = currentCatMinPrice;
          leadCurrency = cat.currency; // Update currency based on the category with the overall min price
        }
        if (currentCatMinDiscountedPrice < minOverallDiscountedPrice) {
          minOverallDiscountedPrice = currentCatMinDiscountedPrice;
           // leadCurrency could also be updated here if discounted logic is primary
        }
      });
      
      const totalRooms = propertyData.categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);
      
      setPropertyData(prev => ({
        ...prev,
        costing: {
          price: minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2)),
          discountedPrice: minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2)),
          currency: leadCurrency
        },
        rooms: totalRooms
      }));
    } else { // No room categories
      setPropertyData(prev => ({
        ...prev,
        costing: {
          price: 0,
          discountedPrice: 0,
          currency: 'USD'
        },
        rooms: 0
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
      setPropertyData(prev => ({ ...prev, [field]: value as Property[keyof Property] }));
    }
  };

  const toggleArrayItem = (field: keyof Property, item: string) => {
    const currentArray = (propertyData[field] as string[] | undefined) || [];
    if (currentArray.includes(item)) {
      handlePropertyChange(field, currentArray.filter(i => i !== item));
    } else {
      handlePropertyChange(field, [...currentArray, item]);
    }
  };
  
  const handleRemoveItem = (field: keyof Property, item: string) => {
    const currentArray = (propertyData[field] as string[] | undefined) || [];
    handlePropertyChange(field, currentArray.filter(i => i !== item));
  };

  const handleNewCategoryFieldChange = (field: keyof typeof newCategory, value: string | number) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };

  const handleNewCategoryPricingChange = (field: keyof RoomCategoryPricing, value: string | number) => {
    const numericValue = Number(value);
    setNewCategory(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: numericValue < 0 ? 0 : numericValue // Ensure prices are not negative
      }
    }));
  };

  const handleAddCategory = () => {
    if (!newCategory.title.trim()) {
      alert('Category title is required.'); return;
    }
    if (newCategory.qty <= 0) {
      alert('Quantity must be greater than 0.'); return;
    }
    // Basic validation for prices (e.g., single occupancy must be set)
    if (newCategory.pricing.singleOccupancyAdultPrice <= 0) {
      alert('Price for 1 Adult must be greater than 0.'); return;
    }
    // Add more specific validations as needed (e.g., discounted < price)
    const { discountedSingleOccupancyAdultPrice, singleOccupancyAdultPrice, 
            discountedDoubleOccupancyAdultPrice, doubleOccupancyAdultPrice,
            discountedTripleOccupancyAdultPrice, tripleOccupancyAdultPrice,
            // ... other discounted prices
          } = newCategory.pricing;

    if (discountedSingleOccupancyAdultPrice && discountedSingleOccupancyAdultPrice > singleOccupancyAdultPrice) {
        alert('Discounted price for 1 Adult cannot be greater than regular price.'); return;
    }
    if (discountedDoubleOccupancyAdultPrice && discountedDoubleOccupancyAdultPrice > doubleOccupancyAdultPrice) {
        alert('Discounted price for 2 Adults cannot be greater than regular price.'); return;
    }
    if (discountedTripleOccupancyAdultPrice && discountedTripleOccupancyAdultPrice > tripleOccupancyAdultPrice) {
        alert('Discounted price for 3 Adults cannot be greater than regular price.'); return;
    }
    // Similar checks for child prices if discounts are implemented for them

    const categoryToAdd: StoredRoomCategory = {
      id: generateId(), // Generate a unique ID
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: { ...newCategory.pricing } // Deep copy pricing object
    };

    const updatedCategories = [...(propertyData.categoryRooms || []), categoryToAdd];
    handlePropertyChange('categoryRooms', updatedCategories);
    setNewCategory(initialNewCategoryState); // Reset form
  };

  const handleRemoveCategory = (id: string) => {
    const updatedCategories = (propertyData.categoryRooms || []).filter(cat => cat.id !== id);
    handlePropertyChange('categoryRooms', updatedCategories);
  };

  const renderMultiSelect = (field: keyof Property, label: string, IconComponent?: React.ElementType) => {
    const selectedValues = (propertyData[field] as string[] | undefined) || [];
    const options = categoryOptions[field as keyof typeof categoryOptions] || [];
    return (
      <FormItem className="space-y-2">
        <FormLabel className="flex items-center">
          {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />}
          {label}
        </FormLabel>
        <Select onValueChange={(value) => { if (value) { toggleArrayItem(field, value); } }} value="">
          <SelectTrigger className="w-full"><SelectValue placeholder={`Select ${label.toLowerCase()}...`} /></SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option} disabled={selectedValues.includes(option)} className={selectedValues.includes(option) ? 'text-muted-foreground' : ''}>
                {option}
              </SelectItem>
            ))}
            {options.length === 0 && <SelectItem value="no-options" disabled>No options available</SelectItem>}
          </SelectContent>
        </Select>
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedValues.map((item) => (
              <div key={item} className="flex items-center bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-sm">
                <span className="mr-1.5">{item}</span>
                <button type="button" onClick={() => handleRemoveItem(field, item)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={`Remove ${item}`}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </FormItem>
    );
  };

  const ensurePropertyData = {
    ...initialPropertyData,
    ...propertyData,
    location: { ...initialPropertyData.location, ...(propertyData?.location || {}) },
    costing: { ...initialPropertyData.costing, ...(propertyData?.costing || {}) }, // Will be updated by useEffect
    categoryRooms: propertyData?.categoryRooms || [],
    amenities: propertyData?.amenities || [],
  };

  const totalRooms = ensurePropertyData.categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);

  const SectionHeader: React.FC<{ title: string; icon?: React.ElementType; className?: string }> = ({ title, icon: Icon, className }) => (
    <div className={`flex items-center mb-4 ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
      <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-8 max-h-[70vh] overflow-y-auto p-1 pr-3">
      {/* ... (Property Details, Location & Dates sections remain the same) ... */}
       {/* Section: Property Details */}
       <div className="space-y-4">
        <SectionHeader title="Property Details" icon={Home} />
        <FormItem>
          <FormLabel>Property Type</FormLabel>
          <Select
            value={ensurePropertyData.type}
            onValueChange={(value) => handlePropertyChange('type', value as PropertyType)}
          >
            <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Hotel">Hotel</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
              <SelectItem value="Hostel">Hostel</SelectItem>
              <SelectItem value="Resort">Resort</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Property Rating</FormLabel>
            <Select
              value={ensurePropertyData.propertyRating ? ensurePropertyData.propertyRating.toString() : '0'}
              onValueChange={(value) => handlePropertyChange('propertyRating', Number(value))}
            >
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Unrated</SelectItem>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} {rating === 1 ? 'Star' : 'Stars'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem>
            <FormLabel>Google Maps Link (Optional)</FormLabel>
            <Input 
              value={ensurePropertyData.googleMaps}
              onChange={(e) => handlePropertyChange('googleMaps', e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </FormItem>
        </div>
      </div>

      {/* Section: Location & Dates */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Location & Dates" icon={MapPin} />
        <FormItem>
          <FormLabel>Address</FormLabel>
          <Input 
            value={ensurePropertyData.location.address}
            onChange={(e) => handlePropertyChange('location.address', e.target.value)}
            placeholder="e.g., 123 Main St"
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel>City</FormLabel>
            <Input value={ensurePropertyData.location.city} onChange={(e) => handlePropertyChange('location.city', e.target.value)} placeholder="e.g., New York" />
          </FormItem>
          <FormItem>
            <FormLabel>State/Province</FormLabel>
            <Input value={ensurePropertyData.location.state} onChange={(e) => handlePropertyChange('location.state', e.target.value)} placeholder="e.g., NY" />
          </FormItem>
          <FormItem>
            <FormLabel>Country</FormLabel>
            <Input value={ensurePropertyData.location.country} onChange={(e) => handlePropertyChange('location.country', e.target.value)} placeholder="e.g., USA" />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Availability Start Date</FormLabel>
            <Input type="date" value={ensurePropertyData.startDate} onChange={(e) => handlePropertyChange('startDate', e.target.value)} />
          </FormItem>
          <FormItem>
            <FormLabel>Availability End Date</FormLabel>
            <Input type="date" value={ensurePropertyData.endDate} onChange={(e) => handlePropertyChange('endDate', e.target.value)} />
          </FormItem>
        </div>
      </div>

      {/* Section: Room & Price Summary (Property Level) */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Room & Price Summary (Property Overview)" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Total Rooms Available</FormLabel>
            <div className="p-3 border rounded-md bg-muted text-muted-foreground">
              {totalRooms} {totalRooms === 1 ? 'room' : 'rooms'}
              <p className="text-xs mt-1"> (Calculated from all room categories)</p>
            </div>
          </FormItem>
          {ensurePropertyData.categoryRooms.length > 0 && (
            <FormItem>
              <FormLabel>Property Starting Price (per adult)</FormLabel>
              <div className="p-3 border rounded-md bg-muted text-muted-foreground">
                {ensurePropertyData.costing.currency} {ensurePropertyData.costing.price.toLocaleString()}
                {ensurePropertyData.costing.discountedPrice > 0 && ensurePropertyData.costing.discountedPrice < ensurePropertyData.costing.price && (
                  <span className="ml-2 text-green-600 font-semibold">
                    (From: {ensurePropertyData.costing.currency} {ensurePropertyData.costing.discountedPrice.toLocaleString()})
                  </span>
                )}
                <p className="text-xs mt-1">(Lowest effective per-adult price from categories)</p>
              </div>
            </FormItem>
          )}
        </div>
      </div>

      {/* Section: Room Categories */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Manage Room Categories" icon={BedDouble} />
        {ensurePropertyData.categoryRooms.length > 0 && (
          <div className="mb-6 space-y-3">
            <h4 className="text-md font-medium text-foreground">Added Categories:</h4>
            {ensurePropertyData.categoryRooms.map((cat) => (
              <div key={cat.id} className="p-4 bg-muted/50 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-lg">{cat.title} <span className="text-sm text-muted-foreground">({cat.qty} rooms)</span></p>
                    <p className="text-xs text-muted-foreground">Currency: {cat.currency}</p>
                  </div>
                  <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveCategory(cat.id)} className="text-destructive hover:text-destructive/80" aria-label={`Remove ${cat.title}`}>
                    <X size={18} />
                  </Button>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p><strong><Users className="inline h-4 w-4 mr-1"/>Pricing (Adults):</strong></p>
                  <ul className="list-disc list-inside pl-4">
                    <li>1 Adult: {cat.currency} {cat.pricing.singleOccupancyAdultPrice}
                        {cat.pricing.discountedSingleOccupancyAdultPrice && cat.pricing.discountedSingleOccupancyAdultPrice < cat.pricing.singleOccupancyAdultPrice ? ` (Disc: ${cat.pricing.discountedSingleOccupancyAdultPrice})` : ''}
                    </li>
                    <li>2 Adults (Total): {cat.currency} {cat.pricing.doubleOccupancyAdultPrice}
                        {cat.pricing.discountedDoubleOccupancyAdultPrice && cat.pricing.discountedDoubleOccupancyAdultPrice < cat.pricing.doubleOccupancyAdultPrice ? ` (Disc: ${cat.pricing.discountedDoubleOccupancyAdultPrice})` : ''}
                    </li>
                    <li>3 Adults (Total): {cat.currency} {cat.pricing.tripleOccupancyAdultPrice}
                        {cat.pricing.discountedTripleOccupancyAdultPrice && cat.pricing.discountedTripleOccupancyAdultPrice < cat.pricing.tripleOccupancyAdultPrice ? ` (Disc: ${cat.pricing.discountedTripleOccupancyAdultPrice})` : ''}
                    </li>
                  </ul>
                  <p className="mt-1"><strong><Baby className="inline h-4 w-4 mr-1"/>Pricing (Children, per child, sharing):</strong></p>
                  <ul className="list-disc list-inside pl-4">
                    <li>Child (5-12 yrs): {cat.currency} {cat.pricing.child5to12Price}
                         {cat.pricing.discountedChild5to12Price && cat.pricing.discountedChild5to12Price < cat.pricing.child5to12Price ? ` (Disc: ${cat.pricing.discountedChild5to12Price})` : ''}
                    </li>
                    <li>Child (12-18 yrs): {cat.currency} {cat.pricing.child12to18Price}
                        {cat.pricing.discountedChild12to18Price && cat.pricing.discountedChild12to18Price < cat.pricing.child12to18Price ? ` (Disc: ${cat.pricing.discountedChild12to18Price})` : ''}
                    </li>
                    <li>Children below 5: Free (implicitly)</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Form to add new category */}
        <div className="p-4 bg-muted/30 border rounded-lg space-y-4">
          <h4 className="text-md font-medium text-foreground">Add New Room Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem className="md:col-span-1">
              <FormLabel>Category Title</FormLabel>
              <Input value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Room" />
            </FormItem>
            <FormItem>
              <FormLabel>Quantity (Rooms)</FormLabel>
              <Input type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} />
            </FormItem>
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          </div>

          <div className="pt-3 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-2 block flex items-center"><Users className="inline h-5 w-5 mr-2 text-primary" />Adult Pricing (Total Room Price)</FormLabel>
            {[
              { occupancy: 1, base: 'singleOccupancyAdultPrice', disc: 'discountedSingleOccupancyAdultPrice', label: '1 Adult' },
              { occupancy: 2, base: 'doubleOccupancyAdultPrice', disc: 'discountedDoubleOccupancyAdultPrice', label: '2 Adults' },
              { occupancy: 3, base: 'tripleOccupancyAdultPrice', disc: 'discountedTripleOccupancyAdultPrice', label: '3 Adults' },
            ].map(p => (
              <div key={p.occupancy} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 items-end">
                <FormItem>
                  <FormLabel className="text-sm">{p.label} - Base Price</FormLabel>
                  <Input type="number" value={newCategory.pricing[p.base as keyof RoomCategoryPricing]} onChange={(e) => handleNewCategoryPricingChange(p.base as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" />
                </FormItem>
                <FormItem>
                  <FormLabel className="text-sm">{p.label} - Discounted Price (Optional)</FormLabel>
                  <Input type="number" value={newCategory.pricing[p.disc as keyof RoomCategoryPricing] || ''} onChange={(e) => handleNewCategoryPricingChange(p.disc as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00 (if any)" min="0" />
                </FormItem>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-2 block flex items-center"><Baby className="inline h-5 w-5 mr-2 text-primary" />Child Pricing (Per Child, when sharing, max 3 total occupants)</FormLabel>
            <p className="text-xs text-muted-foreground mb-3">Children below 5 are typically free and not counted in occupancy for pricing if no separate bed is taken.</p>
            {[
              { age: '5-12 yrs', base: 'child5to12Price', disc: 'discountedChild5to12Price' },
              { age: '12-18 yrs', base: 'child12to18Price', disc: 'discountedChild12to18Price' },
            ].map(p => (
              <div key={p.age} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 items-end">
                <FormItem>
                  <FormLabel className="text-sm">Child ({p.age}) - Base Price</FormLabel>
                  <Input type="number" value={newCategory.pricing[p.base as keyof RoomCategoryPricing]} onChange={(e) => handleNewCategoryPricingChange(p.base as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" />
                </FormItem>
                <FormItem>
                  <FormLabel className="text-sm">Child ({p.age}) - Discounted Price (Optional)</FormLabel>
                  <Input type="number" value={newCategory.pricing[p.disc as keyof RoomCategoryPricing] || ''} onChange={(e) => handleNewCategoryPricingChange(p.disc as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00 (if any)" min="0" />
                </FormItem>
              </div>
            ))}
          </div>
          <Button type="button" onClick={handleAddCategory} className="w-full">
            <Plus size={18} className="mr-2" /> Add This Room Category
          </Button>
        </div>
      </div>
      
      {/* Section: Amenities */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Property Amenities" icon={ListChecks} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3">
          {['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfastIncluded', 'petFriendly', 'roomService', 'barLounge', 'laundryService'].map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox id={`amenity-${amenity}`} checked={(ensurePropertyData.amenities || []).includes(amenity)}
                onCheckedChange={(checked) => {
                  const currentAmenities = ensurePropertyData.amenities || [];
                  if (checked) { handlePropertyChange('amenities', [...currentAmenities, amenity]); } 
                  else { handlePropertyChange('amenities', currentAmenities.filter(a => a !== amenity)); }
                }} />
              <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal capitalize cursor-pointer">
                {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Section: Additional Property Categories */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications & Features" icon={ShieldCheck} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderMultiSelect('accessibility', 'Property Accessibility')}
          {renderMultiSelect('roomAccessibility', 'Room Accessibility Features')}
          {renderMultiSelect('popularFilters', 'Popular Filters/Tags')}
          {renderMultiSelect('funThingsToDo', 'Nearby Fun & Activities')}
          {renderMultiSelect('meals', 'Meal Options Available')}
          {renderMultiSelect('facilities', 'On-site Facilities & Services')}
          {renderMultiSelect('bedPreference', 'Bed Preferences/Types Offered')}
          {renderMultiSelect('reservationPolicy', 'Reservation Policies')}
          {renderMultiSelect('brands', 'Associated Brands (if any)')}
          {renderMultiSelect('roomFacilities', 'Standard In-Room Facilities')}
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;