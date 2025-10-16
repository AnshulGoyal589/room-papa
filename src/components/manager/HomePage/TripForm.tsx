import React, { useState } from 'react';
import {
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// Textarea is imported but not used. It can be removed if not needed.
// import { Textarea } from '@/components/ui/textarea'; 
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
import { Plus, X, Info, MapPin, DollarSign, CalendarDays, Sparkles, ShieldCheck, Bus } from 'lucide-react';
import { tripOptions } from '../../../../public/assets/data';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Period } from '@/lib/mongodb/models/Components';


// --- End of assumed definitions ---

export interface TripFormProps {
  tripData: Partial<Trip>; // Use Partial<Trip> to allow incomplete data from parent
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTripData: React.Dispatch<React.SetStateAction<any>>; // Use `any` for flexibility in parent state
}

const initialTripData: Trip = {
  type: 'Domestic',
  destination: {
    address: '',
    city: '',
    state: '',
    country: '',
  },
  costing: {
    price: 0,
    discountedPrice: 0,
    currency: 'INR',
  },
  activities: [],
  availability: [],
  amenities: [],
  accessibility: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [],
  facilities: [],
  reservationPolicy: [],
  brands: [],
  pickupService: false,
};

const TripForm: React.FC<TripFormProps> = ({
  tripData,
  setTripData
}) => {
  const [newActivity, setNewActivity] = useState('');
  const [newAvailabilityPeriod, setNewAvailabilityPeriod] = useState<Period>({ startDate: '', endDate: '' });

  // --- FIX: Perform a deep merge for nested objects to prevent properties from becoming undefined ---
  const ensureTripData: Trip = {
    ...initialTripData,
    ...tripData,
    destination: {
      ...initialTripData.destination,
      ...(tripData.destination || {}),
    },
    costing: {
      ...initialTripData.costing,
      ...(tripData.costing || {}),
    },
    // Ensure arrays are not undefined
    activities: tripData.activities || [],
    availability: tripData.availability || [],
    amenities: tripData.amenities || [],
    accessibility: tripData.accessibility || [],
    popularFilters: tripData.popularFilters || [],
    funThingsToDo: tripData.funThingsToDo || [],
    meals: tripData.meals || [],
    facilities: tripData.facilities || [],
    reservationPolicy: tripData.reservationPolicy || [],
    brands: tripData.brands || [],
  };

  const handleTripChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTripData((prev: Trip) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Trip] as object),
          [child]: value
        }
      }));
    } else {
      setTripData((prev: Trip) => ({ ...prev, [field]: value as Trip[keyof Trip] }));
    }
  };

  const toggleArrayItem = (field: keyof Trip, item: string) => {
    const currentArray = (ensureTripData[field] as string[] | undefined) || [];
    if (currentArray.includes(item)) {
      handleTripChange(field, currentArray.filter(i => i !== item));
    } else {
      handleTripChange(field, [...currentArray, item]);
    }
  };

  const handleRemoveItem = (field: keyof Trip, item: string) => {
    const currentArray = (ensureTripData[field] as string[] | undefined) || [];
    handleTripChange(field, currentArray.filter(i => i !== item));
  };

  const handleAddAvailabilityPeriod = () => {
    const { startDate, endDate } = newAvailabilityPeriod;
    if (!startDate || !endDate) {
      alert("Both Start Date and End Date are required.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      alert('End Date cannot be before Start Date.');
      return;
    }
    handleTripChange('availability', [...(ensureTripData.availability || []), { startDate, endDate }]);
    setNewAvailabilityPeriod({ startDate: '', endDate: '' }); // Reset
  };

  const handleRemoveAvailabilityPeriod = (indexToRemove: number) => {
    handleTripChange('availability', (ensureTripData.availability || []).filter((_, index) => index !== indexToRemove));
  };

  const handleAddActivity = () => {
    const activityToAdd = newActivity.trim();
    if (activityToAdd && !ensureTripData.activities.includes(activityToAdd)) {
      handleTripChange('activities', [...ensureTripData.activities, activityToAdd]);
      setNewActivity('');
    } else if (ensureTripData.activities.includes(activityToAdd)) {
      alert("This activity is already added.");
    }
  };

  const handleRemoveActivity = (activityToRemove: string) => {
    handleTripChange('activities', ensureTripData.activities.filter(a => a !== activityToRemove));
  };

  const SectionHeader: React.FC<{ title: string; icon?: React.ElementType; className?: string }> = ({ title, icon: Icon, className }) => (
    <div className={`flex items-center mb-4 ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
      <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
  );

  const ChipList: React.FC<{ items: string[]; onRemove: (item: string) => void; }> = ({ items, onRemove }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map(item => (
          <div key={item} className="flex items-center bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
            <span>{item}</span>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="ml-1.5 text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Remove ${item}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMultiSelect = (field: keyof Trip, label: string) => {
    const selectedValues = (ensureTripData[field] as string[]) || [];
    const options = tripOptions[field as keyof typeof tripOptions] || [];
    return (
      <FormItem className="space-y-2">
        <FormLabel>{label}</FormLabel>
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

  return (
    <div className="space-y-8 overflow-y-auto p-1 pr-4">
      {/* Section: Trip Details */}
      <div className="space-y-4">
        <SectionHeader title="Trip Details" icon={Info} />
        <FormItem>
          <FormLabel>Trip Type</FormLabel>
          <Select value={ensureTripData.type} onValueChange={(value) => handleTripChange('type', value as 'Domestic' | 'International')}>
            <SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Domestic">Domestic</SelectItem>
              <SelectItem value="International">International</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>

      {/* Section: Destination */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Destination" icon={MapPin} />
        <FormItem>
          <FormLabel>Address / Starting Point (Optional)</FormLabel>
          {/* FIX: Add fallback `|| ''` to prevent value from ever being undefined */}
          <Input value={ensureTripData.destination.address || ''} onChange={(e) => handleTripChange('destination.address', e.target.value)} placeholder="e.g., 123 Touring St, Main Square" />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem> <FormLabel>City</FormLabel> <Input value={ensureTripData.destination.city || ''} onChange={(e) => handleTripChange('destination.city', e.target.value)} placeholder="e.g., Manali" /> </FormItem>
          <FormItem> <FormLabel>State/Province</FormLabel> <Input value={ensureTripData.destination.state || ''} onChange={(e) => handleTripChange('destination.state', e.target.value)} placeholder="e.g., Himachal Pradesh" /> </FormItem>
          <FormItem> <FormLabel>Country</FormLabel> <Input value={ensureTripData.destination.country || ''} onChange={(e) => handleTripChange('destination.country', e.target.value)} placeholder="e.g., India" /> </FormItem>
        </div>
      </div>
      
      {/* Section: Costing */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Costing (Per Person)" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem> <FormLabel>Base Price</FormLabel> <Input type="number" value={ensureTripData.costing.price || 0} onChange={e => handleTripChange('costing.price', parseFloat(e.target.value) || 0)} placeholder="0.00" min="0" /> </FormItem>
            <FormItem> <FormLabel>Discounted Price</FormLabel> <Input type="number" value={ensureTripData.costing.discountedPrice || 0} onChange={e => handleTripChange('costing.discountedPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" min="0" /> </FormItem>
            <FormItem> <FormLabel>Currency</FormLabel> <Select value={ensureTripData.costing.currency} onValueChange={(value) => handleTripChange('costing.currency', value)}> <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['INR', 'EUR', 'GBP', 'USD', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </FormItem>
        </div>
      </div>
      
      {/* Section: Availability */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Availability Periods" icon={CalendarDays} />
        {ensureTripData.availability && ensureTripData.availability.length > 0 && (
            <div className="mb-4 space-y-2">
                <FormLabel className="text-sm">Added Periods:</FormLabel>
                {ensureTripData.availability.map((period, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-sm">
                        <span>{new Date(period.startDate).toLocaleDateString()} &mdash; {new Date(period.endDate).toLocaleDateString()}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAvailabilityPeriod(index)}> <X size={14} /> </Button>
                    </div>
                ))}
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <FormItem> <FormLabel className="text-xs text-muted-foreground">Start Date</FormLabel> <Input type="date" value={newAvailabilityPeriod.startDate} onChange={(e) => setNewAvailabilityPeriod(p => ({...p, startDate: e.target.value}))} /> </FormItem>
            <FormItem> <FormLabel className="text-xs text-muted-foreground">End Date</FormLabel> <Input type="date" value={newAvailabilityPeriod.endDate} onChange={(e) => setNewAvailabilityPeriod(p => ({...p, endDate: e.target.value}))} /> </FormItem>
        </div>
        <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full mt-3"> <Plus size={16} className="mr-1" /> Add Availability Period </Button>
      </div>

      {/* Section: Activities */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Activities Included" icon={Sparkles} />
        <p className="text-sm text-muted-foreground -mt-3">List the key activities included in the trip package.</p>
        <div className="flex flex-col md:flex-row gap-2 items-start">
            <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="e.g., Paragliding, River Rafting" className="flex-grow" />
            <Button type="button" variant="outline" onClick={handleAddActivity} size="sm" className="w-full md:w-auto"> <Plus size={16} className="mr-1" /> Add Activity </Button>
        </div>
        <ChipList items={ensureTripData.activities} onRemove={handleRemoveActivity} />
      </div>

      {/* Section: Other Details */}
      <div className="space-y-4 pt-6 border-t">
          <SectionHeader title="Other Details" icon={Bus} />
          <div className="flex items-center space-x-2">
              <Checkbox
                  id="pickupService"
                  checked={ensureTripData.pickupService || false}
                  onCheckedChange={(checked) => handleTripChange('pickupService', !!checked)}
              />
              <Label htmlFor="pickupService" className="cursor-pointer">Pickup Service Available</Label>
          </div>
      </div>

      {/* Section: Additional Classifications */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications & Features" icon={ShieldCheck} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderMultiSelect('amenities', 'Trip Amenities')}
          {renderMultiSelect('meals', 'Meal Options Included')}
          {renderMultiSelect('popularFilters', 'Popular Filters/Tags')}
          {renderMultiSelect('funThingsToDo', 'Fun Things To Do Nearby')}
          {renderMultiSelect('facilities', 'On-trip Facilities')}
          {renderMultiSelect('reservationPolicy', 'Reservation Policies')}
          {renderMultiSelect('accessibility', 'Accessibility Features')}
          {renderMultiSelect('brands', 'Associated Brands (if any)')}
        </div>
      </div>
    </div>
  );
};

export default TripForm;