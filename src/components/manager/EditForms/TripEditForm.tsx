import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import ImageUpload from "@/components/cloudinary/ImageUpload";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";
import { Badge as UiBadge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Check,
  Info,
  DollarSign,
  MapPin,
  ListChecks,
  Image as ImageIcon,
  CalendarDays,
  Sparkles,
  Bus,
  Globe,
} from "lucide-react";
import { Trip } from "@/lib/mongodb/models/Trip";
import { Period } from "@/lib/mongodb/models/Components";
import { tripOptions } from "../../../../public/assets/data";


const ChipList: React.FC<{ items: string[]; onRemove?: (item: string) => void; baseColorClass?: string }> = ({ items, onRemove, baseColorClass = "bg-gray-100 text-gray-700" }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-1">
            {items.map(item => (
                <UiBadge key={item} variant="outline" className={`font-normal ${baseColorClass} text-xs inline-flex items-center`}>
                    <span>{item}</span>
                    {onRemove && (
                        <Button type="button" variant="ghost" size="icon" className="h-4 w-4 ml-1.5 text-muted-foreground hover:bg-gray-200 hover:text-destructive p-0" onClick={() => onRemove(item)} aria-label={`Remove ${item}`}>
                            <X size={12} />
                        </Button>
                    )}
                </UiBadge>
            ))}
        </div>
    );
};

// --- Component Definition ---
interface TripEditFormProps {
  item: Trip;
  onSave: (updatedTrip: Trip) => void;
}

const TripEditForm: React.FC<TripEditFormProps> = ({ item, onSave }) => {
  const [formData, setFormData] = useState<Trip>(item);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [newActivity, setNewActivity] = useState('');
  const [newAvailabilityPeriod, setNewAvailabilityPeriod] = useState<Period>({ startDate: '', endDate: '' });

  useEffect(() => {
    const clonedItem = JSON.parse(JSON.stringify(item));
    const initialTripState: Partial<Trip> = {
        title: '',
        description: '',
        type: 'Domestic',
        domain: '',
        destination: { address: '', city: '', state: '', country: '' },
        costing: { price: 0, discountedPrice: 0, currency: 'INR' },
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
    setFormData({ ...initialTripState, ...clonedItem } as Trip);
  }, [item]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      const updated = JSON.parse(JSON.stringify(prev));
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };
  
  const handleAddActivity = () => {
    const activityToAdd = newActivity.trim();
    if (activityToAdd && !formData.activities.includes(activityToAdd)) {
        handleChange('activities', [...formData.activities, activityToAdd]);
        setNewActivity('');
    }
  };

  const handleRemoveActivity = (activityToRemove: string) => {
    handleChange('activities', formData.activities.filter(a => a !== activityToRemove));
  };
  
  const handleAddAvailabilityPeriod = () => {
    const { startDate, endDate } = newAvailabilityPeriod;
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
        alert("Please select a valid start and end date for the availability period.");
        return;
    }
    const currentPeriods = formData.availability || [];
    handleChange('availability', [...currentPeriods, { startDate, endDate }]);
    setNewAvailabilityPeriod({ startDate: '', endDate: '' });
  };
  
  const handleRemoveAvailabilityPeriod = (indexToRemove: number) => {
    const currentPeriods = formData.availability || [];
    handleChange('availability', currentPeriods.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Trip type is required";
    if (!formData.destination?.city?.trim()) newErrors.city = "City is required";
    if (!formData.destination?.state?.trim()) newErrors.state = "State/Province is required";
    if (!formData.destination?.country?.trim()) newErrors.country = "Country is required";
    if (!formData.costing || formData.costing.price <= 0) newErrors.costing = "Base price must be greater than 0";
    if (formData.costing?.discountedPrice > formData.costing?.price) newErrors.costing_discount = "Discounted price cannot be greater than base price";
    if (!formData.activities || formData.activities.length === 0) newErrors.activities = "At least one activity is required";
    if (!formData.bannerImage?.url) newErrors.bannerImage = "Banner image is required";
    if (!formData.detailImages || formData.detailImages.length < 3) newErrors.detailImages = "At least 3 detail images are required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
      alert("Please correct the errors highlighted in the form before saving.");
    }
  };

  const CheckboxGroup: React.FC<{ options: string[], value: string[], onChange: (field: string, value: string[]) => void, label: string, fieldName: string }> = ({ options, value = [], onChange, label, fieldName }) => (
    <div className="mb-4">
      <label className="block mb-1.5 font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`${fieldName}-${option.replace(/\s+/g, '-')}`}
              checked={value.includes(option)}
              onChange={(e) => {
                const newValues = e.target.checked ? [...value, option] : value.filter((item) => item !== option);
                onChange(fieldName, newValues);
              }}
              className="form-checkbox h-4 w-4 text-primary transition duration-150 ease-in-out"
            />
            <label htmlFor={`${fieldName}-${option.replace(/\s+/g, '-')}`} className="text-sm text-gray-600 cursor-pointer">
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white shadow-xl rounded-lg">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><Info className="mr-3 h-6 w-6 text-primary"/>Basic Information</h2>
        <div> <label className="font-medium text-gray-700">Title</label> <Input value={formData.title || ''} onChange={(e) => handleChange("title", e.target.value)} placeholder="Trip Title" /> {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>} </div>
        <div> <label className="font-medium text-gray-700">Description</label> <Textarea value={formData.description || ''} onChange={(e) => handleChange("description", e.target.value)} placeholder="Detailed description of the trip" rows={5} /> {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>} </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-medium text-gray-700">Trip Type</label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Domestic">Domestic</SelectItem>
                <SelectItem value="International">International</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>
          <div>
            <label className="font-medium text-gray-700">Domain (Optional)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <Input value={formData.domain || ''} onChange={(e) => handleChange("domain", e.target.value)} placeholder="e.g., adventure, leisure, spiritual" className="pl-9"/>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><MapPin className="mr-3 h-6 w-6 text-primary"/>Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div> <label className="font-medium text-gray-700">Address / Starting Point</label> <Input value={formData.destination?.address || ''} onChange={(e) => handleChange("destination.address", e.target.value)} placeholder="e.g., Mall Road, Manali" /> </div>
          <div> <label className="font-medium text-gray-700">City</label> <Input value={formData.destination?.city || ''} onChange={(e) => handleChange("destination.city", e.target.value)} placeholder="City" /> {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>} </div>
          <div> <label className="font-medium text-gray-700">State/Province</label> <Input value={formData.destination?.state || ''} onChange={(e) => handleChange("destination.state", e.target.value)} placeholder="State or Province" /> {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>} </div>
          <div> <label className="font-medium text-gray-700">Country</label> <Input value={formData.destination?.country || ''} onChange={(e) => handleChange("destination.country", e.target.value)} placeholder="Country" /> {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>} </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><DollarSign className="mr-3 h-6 w-6 text-primary"/>Costing (Per Person)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div> <label className="font-medium text-gray-700">Base Price</label> <Input type="number" value={formData.costing?.price ?? ''} onChange={(e) => handleChange("costing.price", parseFloat(e.target.value) || 0)} placeholder="0.00" /> {errors.costing && <p className="text-red-500 text-xs mt-1">{errors.costing}</p>} </div>
          <div> <label className="font-medium text-gray-700">Discounted Price</label> <Input type="number" value={formData.costing?.discountedPrice ?? ''} onChange={(e) => handleChange("costing.discountedPrice", parseFloat(e.target.value) || 0)} placeholder="Optional" /> {errors.costing_discount && <p className="text-red-500 text-xs mt-1">{errors.costing_discount}</p>} </div>
          <div> <label className="font-medium text-gray-700">Currency</label> <Select value={formData.costing?.currency} onValueChange={(value) => handleChange("costing.currency", value)}> <SelectTrigger><SelectValue/></SelectTrigger> <SelectContent>{['INR', 'USD', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </div>
        </div>
      </div>
      
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><CalendarDays className="mr-3 h-6 w-6 text-primary"/>Availability Periods</h2>
        {formData.availability && formData.availability.length > 0 && (
            <div className="mb-4 space-y-2">
                {formData.availability.map((period, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border text-sm">
                        <span>{period.startDate} &mdash; {period.endDate}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAvailabilityPeriod(index)}>
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div><label className="text-xs text-muted-foreground">Start Date</label><Input type="date" value={newAvailabilityPeriod.startDate} onChange={(e) => setNewAvailabilityPeriod(p => ({...p, startDate: e.target.value}))} /></div>
            <div><label className="text-xs text-muted-foreground">End Date</label><Input type="date" value={newAvailabilityPeriod.endDate} onChange={(e) => setNewAvailabilityPeriod(p => ({...p, endDate: e.target.value}))} /></div>
        </div>
        <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full mt-3"><Plus size={16} className="mr-1" /> Add Period</Button>
      </div>
      
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><Sparkles className="mr-3 h-6 w-6 text-primary"/>Activities & Services</h2>
        <div>
          <label className="font-medium text-gray-700">Add Activity</label>
          <div className="flex items-end gap-2 mt-1">
              <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="e.g., Paragliding, Trekking" />
              <Button type="button" onClick={handleAddActivity} variant="outline" size="sm" className="px-3 py-2"><Plus size={16} className="mr-1.5" /> Add</Button>
          </div>
          <ChipList items={formData.activities} onRemove={handleRemoveActivity} baseColorClass="bg-yellow-50 text-yellow-700 border-yellow-200" />
          {errors.activities && <p className="text-red-500 text-xs mt-1">{errors.activities}</p>}
        </div>
        <div className="pt-2 flex items-center space-x-2">
            <input type="checkbox" id="pickupService" checked={!!formData.pickupService} onChange={(e) => handleChange("pickupService", e.target.checked)} className="form-checkbox h-4 w-4 text-primary transition duration-150 ease-in-out"/>
            <label htmlFor="pickupService" className="font-medium text-gray-700 cursor-pointer flex items-center"><Bus className="mr-2 h-4 w-4"/>Pickup Service Available</label>
        </div>
      </div>
      
      <div className="pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary"/>Features & Policies</h2>
        <CheckboxGroup options={tripOptions.amenities} value={formData.amenities || []} onChange={handleChange} label="Trip Amenities" fieldName="amenities" />
        <CheckboxGroup options={tripOptions.accessibility} value={formData.accessibility || []} onChange={handleChange} label="Trip Accessibility" fieldName="accessibility" />
        <CheckboxGroup options={tripOptions.popularFilters} value={formData.popularFilters || []} onChange={handleChange} label="Popular Filters" fieldName="popularFilters" />
        <CheckboxGroup options={tripOptions.funThingsToDo} value={formData.funThingsToDo || []} onChange={handleChange} label="Fun Things To Do" fieldName="funThingsToDo" />
        <CheckboxGroup options={tripOptions.meals} value={formData.meals || []} onChange={handleChange} label="Meal Options" fieldName="meals" />
        <CheckboxGroup options={tripOptions.facilities} value={formData.facilities || []} onChange={handleChange} label="On-Trip Facilities" fieldName="facilities" />
        <CheckboxGroup options={tripOptions.reservationPolicy} value={formData.reservationPolicy || []} onChange={handleChange} label="Reservation Policies" fieldName="reservationPolicy" />
        <CheckboxGroup options={tripOptions.brands} value={formData.brands || []} onChange={handleChange} label="Associated Brands" fieldName="brands" />
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><ImageIcon className="mr-3 h-6 w-6 text-primary"/>Images</h2>
        <div> <label className="font-medium text-gray-700">Banner Image</label> <ImageUpload label='banner image' value={formData.bannerImage || null} onChange={(image) => handleChange("bannerImage", image)} /> {errors.bannerImage && <p className="text-red-500 text-xs mt-1">{errors.bannerImage}</p>} </div>
        <div> <label className="font-medium text-gray-700">Detail Images (minimum 3)</label> <MultipleImageUpload label='detail images' value={formData.detailImages || []} onChange={(images) => handleChange("detailImages", images)} maxImages={10} /> {errors.detailImages && <p className="text-red-500 text-xs mt-1">{errors.detailImages}</p>} </div>
      </div>

      <Button type="submit" className="w-full py-3 text-lg font-semibold mt-8">
        <Check className="mr-2 h-5 w-5"/> Save Trip Changes
      </Button>
    </form>
  );
};

export default TripEditForm;