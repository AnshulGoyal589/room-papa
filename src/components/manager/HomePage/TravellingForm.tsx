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
import { X, Plane, Train, Bus, Car, Ship, MapPin, DollarSign, Star, Settings2, Armchair, Wifi } from 'lucide-react'; // Added more icons
import { Travelling } from '@/lib/mongodb/models/Travelling';
import { TransportationType } from '@/types';
import { categoryOptions } from '../../../../public/assets/data'; // Assuming this has all necessary keys
import { TravellingFormProps } from '@/lib/mongodb/models/Components';


// Default/initial state for TravellingData
const initialTravellingData: Travelling = {
  transportation: {
    type: 'Flight' as TransportationType,
    arrivalTime: '',
    departureTime: '',
    from: '',
    to: '',
  },
  costing: {
    price: 0,
    discountedPrice: 0,
    currency: 'USD',
  },
  amenities: [],
  accessibility: [], // Renamed to vehicleAccessibility in renderMultiSelect call
  popularFilters: [],
  // funThingsToDo: [], // Often less relevant for a ticket
  meals: [],
  facilities: [], // Renamed to onBoardServices in renderMultiSelect call
  reservationPolicy: [],
  brands: [],
  // New travel-specific fields (if you add them to your model)
  // seatingOptions: [], 
  // baggagePolicy: [],

  totalRating: 0,
};

// Specific amenities for travelling
const travelAmenitiesOptions = [
  { id: 'wifi', label: 'WiFi Onboard' },
  { id: 'powerOutlet', label: 'Power Outlet / Charging' },
  { id: 'inflightEntertainment', label: 'Entertainment System' },
  { id: 'mealIncluded', label: 'Meal Included' },
  { id: 'beverages', label: 'Beverages Available' },
  { id: 'recliningSeat', label: 'Reclining Seat' },
  { id: 'extraLegroom', label: 'Extra Legroom Option' },
  { id: 'restroom', label: 'Restroom Access' },
  { id: 'blanketPillow', label: 'Blanket & Pillow' },
  { id: 'priorityBoarding', label: 'Priority Boarding' },
  { id: 'petCarrier', label: 'Pet Carrier Allowed' },
  { id: 'accessibleSeating', label: 'Accessible Seating' },
];


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

  const toggleArrayItem = (field: keyof Travelling, item: string) => {
    const currentArray = (travellingData[field] as string[] | undefined) || [];
    if (currentArray.includes(item)) {
      handleTravellingChange(field, currentArray.filter(i => i !== item));
    } else {
      handleTravellingChange(field, [...currentArray, item]);
    }
  };
  
  const handleRemoveItem = (field: keyof Travelling, item: string) => {
    const currentArray = (travellingData[field] as string[] | undefined) || [];
    handleTravellingChange(field, currentArray.filter(i => i !== item));
  };

  const renderMultiSelect = (field: keyof Travelling, label: string, IconComponent?: React.ElementType) => {
    const selectedValues = (travellingData[field] as string[] | undefined) || [];
    // Ensure categoryOptions has the key 'field'
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
            {options.map((option: string) => ( // Explicitly type option as string
              <SelectItem 
                key={option} 
                value={option}
                disabled={selectedValues.includes(option)}
                className={selectedValues.includes(option) ? 'text-muted-foreground' : ''}
              >
                {option}
              </SelectItem>
            ))}
            {options.length === 0 && <SelectItem value="no-options" disabled>No options available for {label}</SelectItem>}
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

  const ensureTravellingData: Travelling = { // Ensure type is correct
    ...initialTravellingData,
    ...travellingData,
    transportation: { ...initialTravellingData.transportation, ...(travellingData?.transportation || {}) },
    costing: { ...initialTravellingData.costing, ...(travellingData?.costing || {}) },
    amenities: travellingData?.amenities || [],
  };

  const SectionHeader: React.FC<{ title: string; icon?: React.ElementType, className?: string }> = ({ title, icon: Icon, className }) => (
    <div className={`flex items-center mb-4 ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
      <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
  );
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTransportationIcon = (type:any) => {
    switch(type) {
      case 'Flight': return Plane;
      case 'Train': return Train;
      case 'Bus': return Bus;
      case 'Car': return Car;
      case 'Ship': return Ship;
      default: return Plane;
    }
  };

  return (
    <div className="space-y-8 max-h-[70vh] overflow-y-auto p-1 pr-3">
      
      {/* Section: Transportation Details */}
      <div className="space-y-4">
        <SectionHeader title="Transportation Details" icon={getTransportationIcon(ensureTravellingData.transportation.type)} />
        <FormItem>
          <FormLabel>Transportation Type</FormLabel>
          <Select
            value={ensureTravellingData.transportation.type}
            onValueChange={(value) => handleTravellingChange('transportation.type', value as TransportationType)}
          >
            <SelectTrigger><SelectValue placeholder="Select transportation type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Flight"><Plane className="inline h-4 w-4 mr-2" />Flight</SelectItem>
              <SelectItem value="Train"><Train className="inline h-4 w-4 mr-2" />Train</SelectItem>
              <SelectItem value="Bus"><Bus className="inline h-4 w-4 mr-2" />Bus</SelectItem>
              <SelectItem value="Car"><Car className="inline h-4 w-4 mr-2" />Car Rental/Ride</SelectItem>
              <SelectItem value="Ship"><Ship className="inline h-4 w-4 mr-2" />Ship/Ferry</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>
      
      {/* Section: Route & Schedule */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Route & Schedule" icon={MapPin} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>From (Departure Location)</FormLabel>
            <Input value={ensureTravellingData.transportation.from} onChange={(e) => handleTravellingChange('transportation.from', e.target.value)} placeholder="e.g., JFK Airport, Grand Central" />
          </FormItem>
          <FormItem>
            <FormLabel>To (Arrival Location)</FormLabel>
            <Input value={ensureTravellingData.transportation.to} onChange={(e) => handleTravellingChange('transportation.to', e.target.value)} placeholder="e.g., LAX Airport, Union Station" />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Departure Date & Time</FormLabel>
            <Input type="datetime-local" value={ensureTravellingData.transportation.departureTime} onChange={(e) => handleTravellingChange('transportation.departureTime', e.target.value)} />
          </FormItem>
          <FormItem>
            <FormLabel>Arrival Date & Time</FormLabel>
            <Input type="datetime-local" value={ensureTravellingData.transportation.arrivalTime} onChange={(e) => handleTravellingChange('transportation.arrivalTime', e.target.value)} />
          </FormItem>
        </div>
      </div>
      
      {/* Section: Pricing & Rating */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Pricing & Rating" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel>Price</FormLabel>
            <Input type="number" value={ensureTravellingData.costing.price} onChange={(e) => handleTravellingChange('costing.price', Math.max(0, Number(e.target.value)))} min={0} placeholder="0.00"/>
          </FormItem>
          <FormItem>
            <FormLabel>Discounted Price (Optional)</FormLabel>
            <Input type="number" value={ensureTravellingData.costing.discountedPrice} onChange={(e) => handleTravellingChange('costing.discountedPrice', Math.max(0,Number(e.target.value)))} min={0} placeholder="0.00"/>
          </FormItem>
          <FormItem>
            <FormLabel>Currency</FormLabel>
            <Select value={ensureTravellingData.costing.currency} onValueChange={(value) => handleTravellingChange('costing.currency', value)}>
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
            value={ensureTravellingData.totalRating || 0}
            onChange={(e) => handleTravellingChange('totalRating', Math.min(5, Math.max(0, Number(e.target.value))))}
            min={0} max={5} step={0.1} placeholder="e.g., 4.2"
          />
        </FormItem>
      </div>
      
      {/* Section: On-board Features */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="On-board Features / Amenities" icon={Armchair} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {travelAmenitiesOptions.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={ensureTravellingData.amenities?.includes(amenity.id)}
                onCheckedChange={(checked) => {
                  const currentAmenities = ensureTravellingData.amenities || [];
                  if (checked) {
                    handleTravellingChange('amenities', [...currentAmenities, amenity.id]);
                  } else {
                    handleTravellingChange('amenities', currentAmenities.filter(a => a !== amenity.id));
                  }
                }}
              />
              <Label htmlFor={`amenity-${amenity.id}`} className="text-sm font-normal cursor-pointer">
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Section: Additional Classifications */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications" icon={Settings2} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Assuming 'vehicleAccessibility' key exists in your imported categoryOptions */}
          {renderMultiSelect('accessibility', 'Vehicle Accessibility Features', Armchair)} 
          {renderMultiSelect('popularFilters', 'Popular Travel Tags/Filters')}
          {renderMultiSelect('meals', 'Meal & Beverage Options')}
          {/* Assuming 'onBoardServices' key exists in your imported categoryOptions */}
          {renderMultiSelect('facilities', 'On-board Services & Facilities', Wifi)}
          {renderMultiSelect('reservationPolicy', 'Booking & Cancellation Policies')}
          {renderMultiSelect('brands', 'Carrier/Brand (e.g., Airline, Train Co.)')}
          {/* Fields like roomAccessibility, bedPreference, funThingsToDo, roomFacilities are typically less relevant for a travel ticket form. */}
          {/* If you have specific use cases, ensure keys like 'seatingOptions', 'baggagePolicy' are in categoryOptions and your model */}
          {/* Example: renderMultiSelect('seatingOptions', 'Seating Options (e.g., Window, Aisle)')} */}
          {/* Example: renderMultiSelect('baggagePolicy', 'Baggage Policy Highlights')} */}
        </div>
      </div>
    </div>
  );
};

export default TravellingForm;