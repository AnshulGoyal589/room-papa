import React, { useState, useEffect } from 'react';
import { 
    Info, MapPin, DollarSign, CalendarDays, Sparkles, ShieldCheck, Bus, 
    X, Image as ImageIcon, Tag, Star
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Trip } from '@/lib/mongodb/models/Trip';



const SectionHeader: React.FC<{ title: string; icon?: React.ElementType; }> = ({ title, icon: Icon }) => (
    <div className="flex items-center mb-4">
      {Icon && <Icon className="h-5 w-5 mr-2 text-gray-600" />}
      <h3 className="text-lg font-semibold text-gray-800 tracking-tight">{title}</h3>
    </div>
);

const ChipListDisplay: React.FC<{ items: string[] | undefined; onRemove?: (item: string) => void; noRemove?: boolean, baseColorClass?: string }> = ({ items, onRemove, noRemove, baseColorClass = "bg-gray-100 text-gray-700" }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {items.map(item => (
                <div key={item} className={`flex items-center ${baseColorClass} rounded-md px-2 py-0.5 text-xs font-medium`}>
                    <span>{item}</span>
                    {!noRemove && onRemove && (
                        <button type="button" onClick={() => onRemove(item)} className="ml-1.5 text-gray-500 hover:text-red-500 transition-colors" aria-label={`Remove ${item}`}>
                            <X size={12} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

interface TripDetailsProps {
    item: Trip;
    // isEditable?: boolean;
}

const initialTripData: Trip = {
  title: '',
  description: '',
  type: 'Domestic',
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

const TripDetails: React.FC<TripDetailsProps> = ({ item }) => {
    
    const [ensureTripData, setEnsureTripData] = useState<Trip>(initialTripData);
    // const [newActivity, setNewActivity] = useState('');
    // const [newAvailabilityPeriod, setNewAvailabilityPeriod] = useState<Period>({ startDate: '', endDate: '' });

    useEffect(() => {
        setEnsureTripData({
            ...initialTripData,
            ...item,
            destination: { ...initialTripData.destination, ...(item.destination || {}) },
            costing: { ...initialTripData.costing, ...(item.costing || {}) },
            activities: item.activities || [],
            availability: item.availability || [],
            amenities: item.amenities || [],
            accessibility: item.accessibility || [],
            popularFilters: item.popularFilters || [],
            funThingsToDo: item.funThingsToDo || [],
            meals: item.meals || [],
            facilities: item.facilities || [],
            reservationPolicy: item.reservationPolicy || [],
            brands: item.brands || [],
        });
    }, [item]);

    const handleTripChange = (field: string, value: unknown) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setEnsureTripData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof typeof prev] as object),
                    [child]: value
                }
            }));
        } else {
            setEnsureTripData(prev => ({ ...prev, [field]: value as Trip[keyof Trip] }));
        }
    };
    
    // const toggleArrayItem = (field: keyof Trip, item: string) => {
    //     const currentArray = (ensureTripData[field] as string[] | undefined) || [];
    //     if (currentArray.includes(item)) {
    //         handleTripChange(field, currentArray.filter(i => i !== item));
    //     } else {
    //         handleTripChange(field, [...currentArray, item]);
    //     }
    // };

    const handleRemoveArrayItem = (field: keyof Trip, item: string) => {
        const currentArray = (ensureTripData[field] as string[] | undefined) || [];
        handleTripChange(field, currentArray.filter(i => i !== item));
    };

    // const handleAddActivity = () => {
    //     const activityToAdd = newActivity.trim();
    //     if (activityToAdd && !ensureTripData.activities.includes(activityToAdd)) {
    //         handleTripChange('activities', [...ensureTripData.activities, activityToAdd]);
    //         setNewActivity('');
    //     }
    // };

    // const handleAddAvailabilityPeriod = () => {
    //     const { startDate, endDate } = newAvailabilityPeriod;
    //     if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
    //         alert("Please select a valid start and end date."); return;
    //     }
    //     handleTripChange('availability', [...(ensureTripData.availability || []), { startDate, endDate }]);
    //     setNewAvailabilityPeriod({ startDate: '', endDate: '' });
    // };

    // const handleRemoveAvailabilityPeriod = (indexToRemove: number) => {
    //     handleTripChange('availability', (ensureTripData.availability || []).filter((_, index) => index !== indexToRemove));
    // };

    const renderMultiSelect = (field: keyof Trip, label: string) => {
        const selectedValues = (ensureTripData[field] as string[]) || [];
        // const options = tripOptions[field as keyof typeof tripOptions] || [];
        return (
          // --- FIXED: Replaced FormItem with a div ---
          <div className="space-y-2">
            <Label>{label}</Label>
            {/* <Select onValueChange={(value) => { if (value) toggleArrayItem(field, value); }} value="">
              <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}...`} /></SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option} value={option} disabled={selectedValues.includes(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <ChipListDisplay items={selectedValues}/>
          </div>
        );
      };

    const getFormattedAddress = () => [ensureTripData.destination.city, ensureTripData.destination.state, ensureTripData.destination.country].filter(Boolean).join(', ');

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg space-y-8">
            <div>
                {/* {isEditable ? (
                    <Input value={ensureTripData.title || ''} onChange={e => handleTripChange('title', e.target.value)} placeholder="Trip Title" className="text-2xl md:text-3xl font-bold text-gray-800 h-auto p-2"/>
                ) : ( */}
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{ensureTripData.title || "Trip Details"}</h2>
                {/* )} */}
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                    <div className="flex items-center"> <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> {getFormattedAddress() || 'Destination not set'} </div>
                    <div className="flex items-center"> <Tag className="w-4 h-4 mr-1.5 text-gray-500" /> {ensureTripData.type} </div>
                    <div className="flex items-center"> <Star className="w-4 h-4 mr-1.5 text-yellow-500" /> {ensureTripData.totalRating ? `${ensureTripData.totalRating.toFixed(1)} stars` : 'Not rated'} </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <SectionHeader title="Trip Details" icon={Info} />
                <div className="space-y-4">
                    {/* --- FIXED: Replaced FormItem with div and FormLabel with Label --- */}
                    <div className="space-y-2">
                        <Label>Trip Type</Label>
                        <p className="text-gray-700">{ensureTripData.type}</p>
                    </div>
                     <div className="space-y-2">
                        <Label>Description</Label>
                        <p className="text-gray-700 whitespace-pre-wrap">{ensureTripData.description || 'No description provided.'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
                <div>
                    <SectionHeader title="Destination" icon={MapPin} />
                    <div className="space-y-3">
                        {/* --- FIXED: Replaced all FormItem/FormLabel with div/Label --- */}
                        <div className="space-y-2"><Label>Address / Starting Point</Label><p className="text-gray-700">{ensureTripData.destination.address || 'N/A'}</p></div>
                        <div className="space-y-2"><Label>City</Label><p className="text-gray-700">{ensureTripData.destination.city || 'N/A'}</p></div>
                        <div className="space-y-2"><Label>State</Label><p className="text-gray-700">{ensureTripData.destination.state || 'N/A'}</p></div>
                        <div className="space-y-2"><Label>Country</Label><p className="text-gray-700">{ensureTripData.destination.country || 'N/A'}</p></div>
                    </div>
                </div>
                <div>
                    <SectionHeader title="Costing (Per Person)" icon={DollarSign} />
                    <div className="space-y-3">
                        <div className="space-y-2"><Label>Base Price</Label><p className="text-gray-700">{ensureTripData.costing.price.toLocaleString()}</p></div>
                        <div className="space-y-2"><Label>Discounted Price</Label><p className="text-green-600 font-semibold">{ensureTripData.costing.discountedPrice > 0 ? ensureTripData.costing.discountedPrice.toLocaleString() : 'No discount'}</p></div>
                        <div className="space-y-2"><Label>Currency</Label><p className="text-gray-700">{ensureTripData.costing.currency}</p></div>
                    </div>
                </div>
            </div>
            
            <div className="border-t pt-6">
                <SectionHeader title="Availability Periods" icon={CalendarDays} />
                {(ensureTripData.availability && ensureTripData.availability.length > 0) ? (
                    <div className="space-y-2">
                        {ensureTripData.availability.map((period, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                                <span>{new Date(period.startDate).toLocaleDateString()} &mdash; {new Date(period.endDate).toLocaleDateString()}</span>
                                {/* {isEditable && <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveAvailabilityPeriod(index)}> <X size={14} /> </Button>} */}
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500">No specific availability periods set.</p>}
                {/* {isEditable && (
                    <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2"> <Label className="text-xs">Start Date</Label> <Input type="date" value={newAvailabilityPeriod.startDate} onChange={e => setNewAvailabilityPeriod(p => ({...p, startDate: e.target.value}))} /> </div>
                            <div className="space-y-2"> <Label className="text-xs">End Date</Label> <Input type="date" value={newAvailabilityPeriod.endDate} onChange={e => setNewAvailabilityPeriod(p => ({...p, endDate: e.target.value}))} /> </div>
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full"> <Plus size={16} className="mr-1" /> Add Period </Button>
                    </div>
                )} */}
            </div>

            <div className="border-t pt-6">
                <SectionHeader title="Activities Included" icon={Sparkles} />
                <ChipListDisplay items={ensureTripData.activities} onRemove={(item) => handleRemoveArrayItem('activities', item)} noRemove={true} baseColorClass="bg-yellow-100 text-yellow-800" />
                {/* {isEditable && (
                    <div className="flex gap-2 items-start mt-4">
                        <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="e.g., Paragliding" className="flex-grow" />
                        <Button type="button" variant="outline" onClick={handleAddActivity} size="sm"> <Plus size={16} className="mr-1" /> Add </Button>
                    </div>
                )} */}
            </div>
            
            <div className="border-t pt-6">
                <SectionHeader title="Other Details" icon={Bus} />
                <div className="flex items-center space-x-2">
                    {/* {isEditable ? (
                        <>
                            <Checkbox id="pickupService" checked={!!ensureTripData.pickupService} onCheckedChange={(checked) => handleTripChange('pickupService', !!checked)} />
                            <Label htmlFor="pickupService">Pickup Service Available</Label>
                        </>
                    ) : ( */}
                        <p className="text-gray-700">Pickup Service: {ensureTripData.pickupService ? 'Available' : 'Not Available'}</p>
                    {/* )} */}
                </div>
            </div>

            <div className="border-t pt-6">
                 <SectionHeader title="Features & Classifications" icon={ShieldCheck} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {renderMultiSelect('amenities', 'Amenities')}
                    {renderMultiSelect('meals', 'Meal Options')}
                    {renderMultiSelect('popularFilters', 'Popular Filters')}
                    {renderMultiSelect('funThingsToDo', 'Fun Things To Do')}
                    {renderMultiSelect('facilities', 'On-Trip Facilities')}
                    {renderMultiSelect('reservationPolicy', 'Reservation Policies')}
                    {renderMultiSelect('accessibility', 'Trip Difficulty/Accessibility')}
                    {renderMultiSelect('brands', 'Associated Brands')}
                 </div>
            </div>

            {ensureTripData.bannerImage?.url && (
                <div className="border-t pt-6">
                    <SectionHeader title="Banner Image" icon={ImageIcon} />
                    <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
                        <Image fill src={ensureTripData.bannerImage.url} alt={ensureTripData.bannerImage.alt || ensureTripData.title || "Trip banner"} className="object-cover" priority />
                    </div>
                </div>
            )}
            {ensureTripData.detailImages && ensureTripData.detailImages.length > 0 && (
                <div className="border-t pt-6">
                    <SectionHeader title="Photo Gallery" icon={ImageIcon} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {ensureTripData.detailImages.map((image, index) => (
                            <div key={image.publicId || index} className="relative aspect-video rounded-lg overflow-hidden">
                                <Image fill src={image.url} alt={image.alt || `Trip image ${index + 1}`} className="object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDetails;