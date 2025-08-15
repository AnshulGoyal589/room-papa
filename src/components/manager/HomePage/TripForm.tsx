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
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Label } from '@/components/ui/label'; // Import Label
import { X, Globe, MapPin, DollarSign, Star, ListChecks, Activity, Settings2 } from 'lucide-react'; // Added more icons
import { Trip } from '@/lib/mongodb/models/Trip';
import { TripFormProps } from '@/lib/mongodb/models/Components';

// Define options for each multi-select category (shared or imported if used elsewhere)
const categoryOptions = {
  activities: ['Sightseeing', 'Adventure', 'Relaxation', 'Food Tours', 'Cultural Experience', 'Shopping', 'Hiking', 'Beach Activities', 'Wildlife Safari', 'Historical Tours'],
  amenities: ['WiFi Included', 'Guided Tours', 'Transportation', 'Meals Included', 'Travel Insurance', 'Language Support', '24/7 Support', 'Flexible Itinerary'], // Added some trip-specific amenities
  accessibility: ['Wheelchair Accessible Pickup', 'Accessible Accommodations', 'Sign Language Guides', 'Service Animal Friendly'], // Trip-specific accessibility
  roomAccessibility: ['Accessible Vehicle', 'Ground Floor Access', 'Support for Medical Devices'], // Trip-specific room/transport accessibility
  popularFilters: ['Family Friendly', 'Adventure Focused', 'Luxury', 'Budget-Friendly', 'Eco-tourism', 'Solo Traveler', 'Group Tours', 'All-Inclusive'],
  funThingsToDo: ['Local Markets', 'Cooking Classes', 'Festivals', 'Photography Tours', 'Wine Tasting', 'Scuba Diving', 'City Exploration', 'Nature Walks'],
  meals: ['Breakfast Included', 'Lunch Included', 'Dinner Included', 'All Meals', 'Local Cuisine Focus', 'Vegetarian Options', 'Vegan Options', 'Gluten-Free Options'],
  facilities: ['Airport Transfer', 'Luggage Storage', 'Tour Desk', 'Currency Exchange', 'Emergency Support', 'First Aid Kit'], // Trip specific facilities
  reservationPolicy: ['Free Cancellation', 'Partial Refund', 'Flexible Booking', 'Non-Refundable', 'Book Now Pay Later', 'Deposit Required'],
  brands: ['G Adventures', 'Intrepid Travel', 'Contiki', 'Trafalgar', 'Local Operators', 'Specialized Agencies'], // Travel brands
  // roomFacilities is less relevant for a Trip, perhaps 'equipmentProvided' or similar could be used if needed.
  // For now, I'll remove roomFacilities from the Trip form's multi-selects unless you intend to use it.
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
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
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

  const toggleArrayItem = (field: keyof Trip, item: string) => {
    const currentArray = (tripData[field] as string[] | undefined) || [];
    
    if (currentArray.includes(item)) {
      handleTripChange(field, currentArray.filter(i => i !== item));
    } else {
      handleTripChange(field, [...currentArray, item]);
    }
  };
  
  const handleRemoveItem = (field: keyof Trip, item: string) => {
    const currentArray = (tripData[field] as string[] | undefined) || [];
    handleTripChange(field, currentArray.filter(i => i !== item));
  };

  const renderMultiSelect = (field: keyof Trip, label: string, IconComponent?: React.ElementType) => {
    const selectedValues = (tripData[field] as string[] | undefined) || [];
    const options = categoryOptions[field as keyof typeof categoryOptions] || [];
      
    return (
      <FormItem className="space-y-2">
        <FormLabel className="flex items-center">
          {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />}
          {label}
        </FormLabel>
        
        <Select
          onValueChange={(value) => {
            if (value) {
              toggleArrayItem(field, value);
            }
          }}
          value="" // Keep it empty to act as a selection trigger
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${label.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem 
                key={option} 
                value={option}
                disabled={selectedValues.includes(option)}
                className={selectedValues.includes(option) ? 'text-muted-foreground' : ''}
              >
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
                <button
                  type="button"
                  onClick={() => handleRemoveItem(field, item)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Remove ${item}`}
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

  const ensureTripData = {
    ...initialTripData,
    ...tripData,
    destination: { ...initialTripData.destination, ...(tripData?.destination || {}) },
    costing: { ...initialTripData.costing, ...(tripData?.costing || {}) },
    amenities: tripData?.amenities || [],
    activities: tripData?.activities || [],
  };

  const SectionHeader: React.FC<{ title: string; icon?: React.ElementType, className?: string }> = ({ title, icon: Icon, className }) => (
    <div className={`flex items-center mb-4 ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
      <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
  );


  return (
    <div className="space-y-8 max-h-[70vh] overflow-y-auto p-1 pr-3"> {/* Increased max-h, added pr for scrollbar */}
      
      {/* Section: Trip Overview */}
      <div className="space-y-4">
        <SectionHeader title="Trip Overview" icon={Globe} />
        <FormItem>
          <FormLabel>Domain / Theme</FormLabel>
          <Input 
            value={ensureTripData.domain || ''}
            onChange={(e) => handleTripChange('domain', e.target.value)}
            placeholder="e.g., Adventure Holiday, Cultural Exploration"
          />
        </FormItem>
        <FormItem>
          <FormLabel>Trip Type</FormLabel>
          <Select value={ensureTripData.type} onValueChange={(value) => handleTripChange('type', value)}>
            <SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Domestic">Domestic</SelectItem>
              <SelectItem value="International">International</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>
      
      {/* Section: Destination & Dates */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Destination & Dates" icon={MapPin} />
        <FormItem>
          <FormLabel>Destination City</FormLabel>
          <Input 
            value={ensureTripData.destination.city}
            onChange={(e) => handleTripChange('destination.city', e.target.value)}
            placeholder="e.g., Paris, Kyoto"
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>State/Province (Optional)</FormLabel>
            <Input value={ensureTripData.destination.state} onChange={(e) => handleTripChange('destination.state', e.target.value)} placeholder="e.g., California, Tuscany" />
          </FormItem>
          <FormItem>
            <FormLabel>Country</FormLabel>
            <Input value={ensureTripData.destination.country} onChange={(e) => handleTripChange('destination.country', e.target.value)} placeholder="e.g., France, Japan" />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Start Date</FormLabel>
            <Input type="date" value={ensureTripData.startDate} onChange={(e) => handleTripChange('startDate', e.target.value)} />
          </FormItem>
          <FormItem>
            <FormLabel>End Date</FormLabel>
            <Input type="date" value={ensureTripData.endDate} onChange={(e) => handleTripChange('endDate', e.target.value)} />
          </FormItem>
        </div>
      </div>
      
      {/* Section: Pricing & Rating */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Pricing & Rating" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel>Price</FormLabel>
            <Input type="number" value={ensureTripData.costing.price} onChange={(e) => handleTripChange('costing.price', Math.max(0, Number(e.target.value)))} min={0} placeholder="0.00" />
          </FormItem>
          <FormItem>
            <FormLabel>Discounted Price (Optional)</FormLabel>
            <Input type="number" value={ensureTripData.costing.discountedPrice} onChange={(e) => handleTripChange('costing.discountedPrice', Math.max(0,Number(e.target.value)))} min={0} placeholder="0.00" />
          </FormItem>
          <FormItem>
            <FormLabel>Currency</FormLabel>
            <Select value={ensureTripData.costing.currency} onValueChange={(value) => handleTripChange('costing.currency', value)}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        </div>
        <FormItem>
          <FormLabel className="flex items-center"><Star className="h-4 w-4 mr-1.5 text-amber-500" />Overall Rating (0-5)</FormLabel>
          <Input 
            type="number"
            value={ensureTripData.totalRating || 0}
            onChange={(e) => handleTripChange('totalRating', Math.min(5, Math.max(0, Number(e.target.value))))}
            min={0} max={5} step={0.1} placeholder="e.g., 4.5"
          />
        </FormItem>
      </div>
      
      {/* Section: Key Features (Amenities & Activities) */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Key Features" icon={ListChecks} />
        <FormItem>
          <FormLabel>Included Amenities / Services</FormLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-1">
            {(categoryOptions.amenities || []).map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.replace(/\s+/g, '-')}`} // Create a unique ID
                  checked={ensureTripData.amenities?.includes(amenity)}
                  onCheckedChange={(checked) => {
                    const currentAmenities = ensureTripData.amenities || [];
                    if (checked) {
                      handleTripChange('amenities', [...currentAmenities, amenity]);
                    } else {
                      handleTripChange('amenities', currentAmenities.filter(a => a !== amenity));
                    }
                  }}
                />
                <Label htmlFor={`amenity-${amenity.replace(/\s+/g, '-')}`} className="text-sm font-normal capitalize cursor-pointer">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </FormItem>
        {renderMultiSelect('activities', 'Main Activities', Activity)}
      </div>
      
      {/* Section: Additional Classifications */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications" icon={Settings2} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderMultiSelect('accessibility', 'Accessibility Features')}
          {renderMultiSelect('popularFilters', 'Popular Tags/Filters')}
          {renderMultiSelect('funThingsToDo', 'Highlight Experiences')}
          {renderMultiSelect('meals', 'Meal Plans & Options')}
          {renderMultiSelect('facilities', 'Provided Facilities/Support')}
          {renderMultiSelect('reservationPolicy', 'Booking & Cancellation Policies')}
          {renderMultiSelect('brands', 'Associated Tour Operators/Brands')}
          {/* Removed roomAccessibility, bedPreference, roomFacilities as they are less typical for a general trip. 
              If they are needed for specific trip types (e.g., involving specific accommodation details), they can be added back. */}
        </div>
      </div>
    </div>
  );
};

export default TripForm;