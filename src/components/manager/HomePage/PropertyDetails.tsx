import React, { useEffect } from 'react';
import { MapPin, Users, Tag, Star, X, Plus, Baby, DollarSign as PriceIcon, Utensils, CalendarDays, Sparkles, Wrench, ImageIcon, ClipboardList } from 'lucide-react'; // Added CalendarDays, Sparkles, Wrench
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel } from '@/components/ui/form';
import GoogleMapsSection from './GoogleMapsSection';
import { Image as ImageType, Period, SeasonalCoasting } from '@/lib/mongodb/models/Components'; 
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { HikePricingByOccupancy, StoredRoomCategory } from '@/types/booking';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { CldImage } from 'next-cloudinary';
import { DiscountedPricingByMealPlan, PricingByMealPlan, RoomCategoryPricing } from '@/types/property';
import { Checkbox } from '@/components/ui/checkbox';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getPrice = (
    priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined | number,
    mealPlan?: keyof PricingByMealPlan
): number => {
    if (typeof priceGroup === 'number') {
        return priceGroup;
    }
    if (priceGroup && typeof priceGroup === 'object' && mealPlan && mealPlan in priceGroup) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const price = (priceGroup as any)[mealPlan];
        return typeof price === 'number' ? price : 0;
    }
    return 0;
};

const initialHouseRulesState = {
    checkInTime: '',
    checkOutTime: '',
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
    additionalRules: [],
};

const initialHikePricingState: HikePricingByOccupancy = {
    singleOccupancyAdultHike: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    doubleOccupancyAdultHike: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    tripleOccupancyAdultHike: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
};

interface HikePricingRowConfig {
    occupancy: number;
    field: keyof HikePricingByOccupancy;
    label: string;
}

const hikePricingConfig: HikePricingRowConfig[] = [
    { occupancy: 1, field: 'singleOccupancyAdultHike', label: '1 Adult' },
    { occupancy: 2, field: 'doubleOccupancyAdultHike', label: '2 Adults' },
    { occupancy: 3, field: 'tripleOccupancyAdultHike', label: '3 Adults' },
];


const initialNewCategoryFormState = {
    title: '',
    qty: 1,
    currency: 'USD',
    pricing: {
        singleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        discountedSingleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        doubleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        discountedDoubleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        tripleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        discountedTripleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        child5to12Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
        discountedChild5to12Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    } as RoomCategoryPricing,
    // availabilityStartDate: '',
    // availabilityEndDate: '',
    newAvailabilityPeriod: { startDate: '', endDate: '' },
    currentAvailabilityPeriods: [] as Period[],
    roomSize: '',
    newCategoryActivity: '',
    currentCategoryActivities: [] as string[],
    newCategoryFacility: '',
    currentCategoryFacilities: [] as string[],
    categoryImages: [] as ImageType[],
    seasonalHike: {
        startDate: '',
        endDate: '',
        hikePricing: initialHikePricingState,
    },
    houseRules: initialHouseRulesState
};


interface PropertyDetailsProps {
    item: Property;
    isEditable?: boolean;
}

const MealPlanLabel: React.FC<{ mealPlan: keyof PricingByMealPlan, showIcon?: boolean }> = ({ mealPlan, showIcon = true }) => {
    let text = '';
    switch(mealPlan) {
        case 'noMeal': text = 'Room Only'; break;
        case 'breakfastOnly': text = '+ Breakfast'; break;
        case 'allMeals': text = '+ All Meals'; break;
        default: return null;
    }
    return (
         <span className="text-xs font-medium text-gray-500 inline-flex items-center">
            {showIcon && <Utensils className="h-3 w-3 mr-1 text-gray-400"/>}
            {text}
         </span>
    );
}

interface AdultPricingRowConfig {
    occupancy: number;
    baseField: keyof RoomCategoryPricing;
    discField: keyof RoomCategoryPricing;
    label: string;
}

const adultPricingConfig: AdultPricingRowConfig[] = [
    { occupancy: 1, baseField: 'singleOccupancyAdultPrice', discField: 'discountedSingleOccupancyAdultPrice', label: '1 Adult' },
    { occupancy: 2, baseField: 'doubleOccupancyAdultPrice', discField: 'discountedDoubleOccupancyAdultPrice', label: '2 Adults' },
    { occupancy: 3, baseField: 'tripleOccupancyAdultPrice', discField: 'discountedTripleOccupancyAdultPrice', label: '3 Adults' },
];

interface ChildPricingRowConfig {
    age: string;
    baseField: keyof RoomCategoryPricing;
    discField: keyof RoomCategoryPricing;
}

const childPricingConfig: ChildPricingRowConfig[] = [
    { age: '5-12 yrs', baseField: 'child5to12Price', discField: 'discountedChild5to12Price' },
];

const ChipListDisplay: React.FC<{ items: string[] | undefined; onRemove?: (item: string) => void; noRemove?: boolean, baseColorClass?: string, icon?: React.ElementType }> = ({ items, onRemove, noRemove, baseColorClass = "bg-gray-100 text-gray-700 border-gray-300", icon: Icon }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-1">
            {items.map(item => (
                <div key={item} className={`flex items-center ${baseColorClass} rounded-md px-2 py-0.5 text-xs`}>
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    <span>{item}</span>
                    {!noRemove && onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(item)}
                            className="ml-1.5 text-gray-500 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${item}`}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};


const PropertyDetails: React.FC<PropertyDetailsProps> = ({ item, isEditable = false }) => {

    const [ensurePropertyData, setEnsurePropertyData] = React.useState<Property>(() => ({
        ...item,
        houseRules: item.houseRules || initialHouseRulesState,
        categoryRooms: Array.isArray(item.categoryRooms) ? item.categoryRooms.map(cat => ({
            ...cat,
            id: cat.id || generateId(),
            pricing: cat.pricing || initialNewCategoryFormState.pricing,
            unavailableDates: cat.unavailableDates || [],
            // availabilityStartDate: cat.availabilityStartDate || '',
            // availabilityEndDate: cat.availabilityEndDate || '',
            availability: cat.availability || [],
            roomSize: cat.roomSize || "Unknown",
            categoryActivities: cat.categoryActivities || [],
            categoryFacilities: cat.categoryFacilities || [],
            categoryImages: cat.categoryImages || [],
            seasonalHike: cat.seasonalHike || undefined
        })) : []
    }));

    const [newAdditionalRule, setNewAdditionalRule] = React.useState('');

    const [newCategory, setNewCategory] = React.useState<{
        title: string;
        qty: number;
        currency: string;
        pricing: RoomCategoryPricing;
        // availabilityStartDate: string;
        // availabilityEndDate: string;
        newAvailabilityPeriod: { startDate: string, endDate: string };
        currentAvailabilityPeriods: Period[];
        newCategoryActivity: string;
        currentCategoryActivities: string[];
        roomSize: string;
        newCategoryFacility: string;
        currentCategoryFacilities: string[];
        categoryImages: ImageType[]; 
        seasonalHike: {
            startDate: string;
            endDate: string;
            hikePricing: HikePricingByOccupancy;
        };
    }>({
        ...initialNewCategoryFormState,
        currency: item.costing?.currency || "USD",
        roomSize: initialNewCategoryFormState.roomSize || "Unknown"
    });

    useEffect(() => {
        setEnsurePropertyData({
            ...item,
            houseRules: item.houseRules || initialHouseRulesState,
            categoryRooms: Array.isArray(item.categoryRooms) ? item.categoryRooms.map(cat => ({
                ...cat,
                id: cat.id || generateId(),
                pricing: cat.pricing || initialNewCategoryFormState.pricing,
                unavailableDates: cat.unavailableDates || [],
                // availabilityStartDate: cat.availabilityStartDate || '',
                // availabilityEndDate: cat.availabilityEndDate || '',
                availability: cat.availability || [],
                categoryActivities: cat.categoryActivities || [],
                categoryFacilities: cat.categoryFacilities || [],
                categoryImages: cat.categoryImages || [],
                seasonalHike: cat.seasonalHike || undefined
            })) : []
        });
        setNewCategory(prev => ({
            ...initialNewCategoryFormState,
            currency: item.costing?.currency || prev.currency || "USD"
         }));
    }, [item]);

    const handlePropertyChange = (field: string, value: unknown) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setEnsurePropertyData(prev => ({
                ...prev,
                [parent]: {
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...((prev as any)[parent] as object),
                    [child]: value
                }
            }));
        } else {
            setEnsurePropertyData(prev => ({ ...prev, [field]: value as Property[keyof Property] }));
        }
    };

    const handleAddAdditionalRule = () => {
        const ruleToAdd = newAdditionalRule.trim();
        if (ruleToAdd) {
            const currentRules = ensurePropertyData.houseRules?.additionalRules || [];
            if (!currentRules.includes(ruleToAdd)) {
                handlePropertyChange('houseRules.additionalRules', [...currentRules, ruleToAdd]);
                setNewAdditionalRule('');
            } else {
                alert("This rule is already added.");
            }
        }
    };

    const handleRemoveAdditionalRule = (ruleToRemove: string) => {
        const currentRules = ensurePropertyData.houseRules?.additionalRules || [];
        handlePropertyChange('houseRules.additionalRules', currentRules.filter(r => r !== ruleToRemove));
    };

    const handleNewCategoryFieldChange = (
        field: keyof Omit<typeof newCategory, 'pricing' | 'currentCategoryActivities' | 'currentCategoryFacilities'>,
        value: string | number
    ) => {
        setNewCategory(prev => ({ ...prev, [field]: value }));
    };

    const handleNewCategoryImagesChange = (images: ImageType[]) => {
        setNewCategory(prev => ({ ...prev, categoryImages: images }));
    };

    const handleNewCategoryPricingChange = (
        priceField: keyof RoomCategoryPricing,
        mealPlan: keyof PricingByMealPlan,
        value: string | number
    ) => {
        const numericValue = Number(value);
        const safeValue = numericValue < 0 ? 0 : numericValue;
        setNewCategory(prev => {
            const updatedPricing = JSON.parse(JSON.stringify(prev.pricing));
            if (!updatedPricing[priceField]) {
                 updatedPricing[priceField] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 };
            }
            (updatedPricing[priceField] as PricingByMealPlan | DiscountedPricingByMealPlan)[mealPlan] = safeValue;
            return { ...prev, pricing: updatedPricing };
        });
    };
    const handleNewAvailabilityPeriodChange = (field: 'startDate' | 'endDate', value: string) => {
        setNewCategory(prev => ({
            ...prev,
            newAvailabilityPeriod: {
                ...prev.newAvailabilityPeriod,
                [field]: value
            }
        }));
    };

    const handleAddAvailabilityPeriod = () => {
        const { startDate, endDate } = newCategory.newAvailabilityPeriod;
        if (!startDate || !endDate) {
            alert("Both Start Date and End Date are required for an availability period.");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            alert('End Date cannot be before Start Date.');
            return;
        }
        setNewCategory(prev => ({
            ...prev,
            currentAvailabilityPeriods: [...prev.currentAvailabilityPeriods, { startDate, endDate }],
            newAvailabilityPeriod: { startDate: '', endDate: '' } // Reset form
        }));
    };

    const handleRemoveAvailabilityPeriod = (indexToRemove: number) => {
        setNewCategory(prev => ({
            ...prev,
            currentAvailabilityPeriods: prev.currentAvailabilityPeriods.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleAddCategoryActivityFromForm = () => {
        const activityToAdd = newCategory.newCategoryActivity.trim();
        if (activityToAdd && !newCategory.currentCategoryActivities.includes(activityToAdd)) {
            setNewCategory(prev => ({
                ...prev,
                currentCategoryActivities: [...prev.currentCategoryActivities, activityToAdd],
                newCategoryActivity: ''
            }));
        } else if (newCategory.currentCategoryActivities.includes(activityToAdd)) {
            alert("This activity is already added for the new category.");
        }
    };
    const handleRemoveCategoryActivityFromForm = (activityToRemove: string) => {
        setNewCategory(prev => ({
            ...prev,
            currentCategoryActivities: prev.currentCategoryActivities.filter(a => a !== activityToRemove)
        }));
    };

    const handleAddCategoryFacilityFromForm = () => {
        const facilityToAdd = newCategory.newCategoryFacility.trim();
        if (facilityToAdd && !newCategory.currentCategoryFacilities.includes(facilityToAdd)) {
            setNewCategory(prev => ({
                ...prev,
                currentCategoryFacilities: [...prev.currentCategoryFacilities, facilityToAdd],
                newCategoryFacility: ''
            }));
        } else if (newCategory.currentCategoryFacilities.includes(facilityToAdd)) {
            alert("This facility is already added for the new category.");
        }
    };
    const handleRemoveCategoryFacilityFromForm = (facilityToRemove: string) => {
        setNewCategory(prev => ({
            ...prev,
            currentCategoryFacilities: prev.currentCategoryFacilities.filter(f => f !== facilityToRemove)
        }));
    };

     const handleNewCategoryHikePricingChange = (
        occupancyField: keyof HikePricingByOccupancy,
        mealPlan: keyof PricingByMealPlan,
        value: string | number
    ) => {
        const numericValue = Number(value);
        const safeValue = numericValue < 0 ? 0 : numericValue;
        setNewCategory(prev => {
            const updatedHikePricing = JSON.parse(JSON.stringify(prev.seasonalHike.hikePricing));
            if (!updatedHikePricing[occupancyField]) {
                updatedHikePricing[occupancyField] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 };
            }
            (updatedHikePricing[occupancyField] as PricingByMealPlan)[mealPlan] = safeValue;
            return {
                ...prev,
                seasonalHike: {
                    ...prev.seasonalHike,
                    hikePricing: updatedHikePricing
                }
            };
        });
    };


    const handleAddCategory = () => {
        if (!newCategory.title.trim()) { alert("Category title is required."); return; }
        if (newCategory.qty <= 0) { alert("Quantity must be greater than 0."); return; }
        if (newCategory.categoryImages.length < 3) { alert('Please upload at least 3 images for the category.'); return; } // Validation for images
        if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
            alert("Base Price for 1 Adult (Room Only) must be greater than 0."); return;
        }
        // if (newCategory.availabilityStartDate && newCategory.availabilityEndDate) {
        //     if (new Date(newCategory.availabilityEndDate) < new Date(newCategory.availabilityStartDate)) {
        //         alert('Availability End Date cannot be before Start Date.'); return;
        //     }
        // } else if (newCategory.availabilityEndDate && !newCategory.availabilityStartDate) {
        //      alert('Please provide an Availability Start Date if End Date is set.'); return;
        // }

        const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];
        const priceFieldsToCheck: (keyof RoomCategoryPricing)[] = [
            'singleOccupancyAdultPrice', 'doubleOccupancyAdultPrice', 'tripleOccupancyAdultPrice',
            'child5to12Price',
        ];
        for (const field of priceFieldsToCheck) {
            const basePrices = newCategory.pricing[field];
            const discountPricesField = `discounted${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof RoomCategoryPricing;
            const discountPrices = newCategory.pricing[discountPricesField];
            if (basePrices && discountPrices) {
                for (const mealPlan of mealPlans) {
                    const base = getPrice(basePrices, mealPlan);
                    const disc = getPrice(discountPrices, mealPlan);
                    if (disc > 0 && base > 0 && disc >= base) {
                        alert(`Discounted price for ${field.replace(/([A-Z])/g, ' $1')} (${mealPlan}) must be less than base price.`); return;
                    }
                }
            }
        }

         const { seasonalHike } = newCategory;
        let seasonalHikeToAdd: SeasonalCoasting | undefined = undefined;

        if (seasonalHike.startDate && seasonalHike.endDate) {
            if (new Date(seasonalHike.endDate) < new Date(seasonalHike.startDate)) {
                alert('Seasonal Hike End Date cannot be before Start Date.');
                return;
            }
            seasonalHikeToAdd = {
                startDate: seasonalHike.startDate,
                endDate: seasonalHike.endDate,
                hikePricing: JSON.parse(JSON.stringify(seasonalHike.hikePricing)),
            };
        } else if (seasonalHike.startDate || seasonalHike.endDate) {
            alert('Both Start and End dates are required for a seasonal hike. To disable it, leave both fields empty.');
            return;
        }

        const categoryToAdd: StoredRoomCategory = {
            id: generateId(),
            title: newCategory.title,
            qty: newCategory.qty,
            currency: newCategory.currency,
            pricing: JSON.parse(JSON.stringify(newCategory.pricing)),
            unavailableDates: [],
            // availabilityStartDate: newCategory.availabilityStartDate || undefined,
            // availabilityEndDate: newCategory.availabilityEndDate || undefined,
            availability: [...newCategory.currentAvailabilityPeriods],
            roomSize: newCategory.roomSize || "Unknown",
            categoryActivities: [...newCategory.currentCategoryActivities],
            categoryFacilities: [...newCategory.currentCategoryFacilities],
            seasonalHike: seasonalHikeToAdd,
        };

        setEnsurePropertyData((prev) => ({
            ...prev,
            categoryRooms: [...(prev.categoryRooms || []), categoryToAdd]
        }));
        setNewCategory({ ...initialNewCategoryFormState, currency: newCategory.currency });
    };
    

    const handleRemoveCategory = (idToRemove: string) => {
        const updatedCategories = (ensurePropertyData.categoryRooms || []).filter((cat: StoredRoomCategory) => cat.id !== idToRemove);
        setEnsurePropertyData((prev) => ({
            ...prev,
            categoryRooms: updatedCategories
        }));
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
            {renderBadges(data, isEditable && !hasData ? `No ${sectionTitle.toLowerCase()} added yet.` : emptyMsg)}
          </div>
        );
      };

    const displayPrice = ensurePropertyData.costing?.price || 0;
    const displayDiscountedPrice = ensurePropertyData.costing?.discountedPrice || 0;
    const displayCurrency = ensurePropertyData.costing?.currency || 'USD';
    let displayTotalRooms = ensurePropertyData.rooms || 0;

    const currentCategories = ensurePropertyData.categoryRooms || [];

    if (Array.isArray(currentCategories) && currentCategories.length > 0) {
        displayTotalRooms = currentCategories.reduce((sum: number, category: StoredRoomCategory) => sum + (category.qty || 0), 0);
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{ensurePropertyData?.title || "Property Details"}</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
                <div className="flex items-start space-x-3"> <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Location</p> <p className="text-base text-gray-700">{getFormattedAddress()}</p> </div> </div>
                <div className="flex items-start space-x-3"> <PriceIcon className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Starting Price (per adult/night)</p> <p className="text-base text-gray-700 font-semibold"> {displayCurrency} {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {displayDiscountedPrice > 0 && displayDiscountedPrice < displayPrice && ( <span className="ml-2 text-green-600"> (From: {displayCurrency} {displayDiscountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) </span> )} </p> <p className="text-xs text-gray-500">Lowest rate across rooms & meal plans.</p> </div> </div>
                <div className="flex items-start space-x-3"> <Users className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Total Rooms Available</p> <p className="text-base text-gray-700">{displayTotalRooms}</p> </div> </div>
                <div className="flex items-start space-x-3"> <Tag className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Type</p> <p className="text-base text-gray-700">{formatPropertyType(ensurePropertyData.type)}</p> </div> </div>
                <div className="flex items-start space-x-3"> <Star className="w-5 h-5 text-yellow-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Property Rating</p> <p className="text-base text-gray-700"> {ensurePropertyData.propertyRating ? `${ensurePropertyData.propertyRating.toString()} / 5 Stars` : 'Not rated yet'} </p> </div> </div>
                {/* <div className="flex items-start space-x-3"> <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Overall Availability</p> <p className="text-base text-gray-700"> {ensurePropertyData.startDate ? new Date(ensurePropertyData.startDate).toLocaleDateString() : 'N/A'} - {ensurePropertyData.endDate ? new Date(ensurePropertyData.endDate).toLocaleDateString() : 'N/A'} </p> </div> </div> */}
            </div>

            <GoogleMapsSection item={ensurePropertyData} />

            <div className="border-t pt-8 mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <ClipboardList className="w-6 h-6 mr-2 text-gray-600" />
                    House Rules
                </h3>

                {!isEditable ? (
                    // --- DISPLAY MODE ---
                    <div className="space-y-4 text-gray-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold">Check-in Time:</p>
                                <p>{ensurePropertyData.houseRules?.checkInTime || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Check-out Time:</p>
                                <p>{ensurePropertyData.houseRules?.checkOutTime || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <p><span className="font-semibold">Smoking:</span> {ensurePropertyData.houseRules?.smokingAllowed ? 'Allowed' : 'Not Allowed'}</p>
                            <p><span className="font-semibold">Pets:</span> {ensurePropertyData.houseRules?.petsAllowed ? 'Allowed' : 'Not Allowed'}</p>
                            <p><span className="font-semibold">Parties/Events:</span> {ensurePropertyData.houseRules?.partiesAllowed ? 'Allowed' : 'Not Allowed'}</p>
                        </div>
                        {ensurePropertyData.houseRules?.additionalRules && ensurePropertyData.houseRules.additionalRules.length > 0 && (
                            <div>
                                <p className="font-semibold mb-2">Additional Rules:</p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    {ensurePropertyData.houseRules.additionalRules.map((rule, index) => (
                                        <li key={index}>{rule}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    // --- EDIT MODE ---
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel>Check-in Time</FormLabel>
                                <Input
                                    type="time"
                                    value={ensurePropertyData.houseRules?.checkInTime || ''}
                                    onChange={(e) => handlePropertyChange('houseRules.checkInTime', e.target.value)}
                                />
                            </FormItem>
                            <FormItem>
                                <FormLabel>Check-out Time</FormLabel>
                                <Input
                                    type="time"
                                    value={ensurePropertyData.houseRules?.checkOutTime || ''}
                                    onChange={(e) => handlePropertyChange('houseRules.checkOutTime', e.target.value)}
                                />
                            </FormItem>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="smokingAllowed" checked={ensurePropertyData.houseRules?.smokingAllowed} onCheckedChange={(checked) => handlePropertyChange('houseRules.smokingAllowed', !!checked)} />
                                <Label htmlFor="smokingAllowed">Smoking Allowed</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="petsAllowed" checked={ensurePropertyData.houseRules?.petsAllowed} onCheckedChange={(checked) => handlePropertyChange('houseRules.petsAllowed', !!checked)} />
                                <Label htmlFor="petsAllowed">Pets Allowed</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="partiesAllowed" checked={ensurePropertyData.houseRules?.partiesAllowed} onCheckedChange={(checked) => handlePropertyChange('houseRules.partiesAllowed', !!checked)} />
                                <Label htmlFor="partiesAllowed">Parties/Events Allowed</Label>
                            </div>
                        </div>
                        <div>
                            <FormLabel>Additional Rules</FormLabel>
                            <div className="flex flex-col sm:flex-row gap-2 items-start mt-2">
                                <Input value={newAdditionalRule} onChange={(e) => setNewAdditionalRule(e.target.value)} placeholder="e.g., Quiet hours after 10 PM" className="flex-grow" />
                                <Button type="button" variant="outline" onClick={handleAddAdditionalRule} size="sm" className="w-full sm:w-auto">
                                    <Plus size={16} className="mr-1" /> Add Rule
                                </Button>
                            </div>
                            <ChipListDisplay items={ensurePropertyData.houseRules?.additionalRules} onRemove={handleRemoveAdditionalRule} />
                        </div>
                    </div>
                )}
            </div>

            {(isEditable || (currentCategories && currentCategories.length > 0)) && (
                <div className="border-t pt-8 mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Room Categories & Pricing</h3>
                     {currentCategories && currentCategories.length > 0 && (
                        <div className="mb-6 space-y-4">
                             {currentCategories.map((cat: StoredRoomCategory) => {
                                const pricing = cat?.pricing || initialNewCategoryFormState.pricing;
                                const currency = cat.currency || 'USD';
                                return (
                                    <div key={cat.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4 pb-3 border-b">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms)</span></p>
                                                <p className="text-sm text-gray-500">Room Size: {cat.roomSize || 'Unknown'}</p>
                                                <p className="text-sm text-gray-500">Currency: {currency}</p>
                                            </div>
                                            {isEditable && (
                                                <button type="button" onClick={() => cat.id && handleRemoveCategory(cat.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 transition-colors -mt-1 -mr-1" aria-label={`Remove ${cat.title}`}> <X size={20} /> </button>
                                            )}
                                        </div>

                                        
                                        {/* Display Category Images */}
                                        {cat.categoryImages && cat.categoryImages.length > 0 && (
                                            <div className="mb-3">
                                                <p className="font-semibold text-gray-700 flex items-center mb-2"><ImageIcon className="inline h-4 w-4 mr-1.5 text-gray-500"/>Images:</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                    {cat.categoryImages.map((img, index) => (
                                                        <CldImage
                                                            key={img.publicId || index}
                                                            src={img.publicId || img.url}
                                                            width={150}
                                                            height={100}
                                                            crop="fill"
                                                            alt={img.alt || cat.title}
                                                            className="rounded-md object-cover w-full h-auto aspect-[4/3]"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Display Availability Period */}
                                        {/* {(cat.availabilityStartDate || cat.availabilityEndDate) && (
                                            <div className="text-sm mb-3">
                                                <p className="font-semibold text-gray-700 flex items-center"><CalendarDays className="inline h-4 w-4 mr-1.5 text-[#003c95]"/>Availability:</p>
                                                <p className="pl-6 text-gray-600">
                                                    {cat.availabilityStartDate ? new Date(cat.availabilityStartDate).toLocaleDateString() : 'Open Start'} - {cat.availabilityEndDate ? new Date(cat.availabilityEndDate).toLocaleDateString() : 'Open End'}
                                                </p>
                                            </div>
                                        )} */}
                                        {cat.availability && cat.availability.length > 0 && (
                                            <div className="text-sm mb-3">
                                                <p className="font-semibold text-gray-700 flex items-center"><CalendarDays className="inline h-4 w-4 mr-1.5 text-[#003c95]"/>Availability Periods:</p>
                                                <ul className="pl-6 text-gray-600 list-disc list-inside space-y-1">
                                                    {cat.availability.map((period, index) => (
                                                        <li key={index}>
                                                            {new Date(period.startDate).toLocaleDateString()} to {new Date(period.endDate).toLocaleDateString()}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                            <div> <p className="font-semibold text-gray-700 flex items-center mb-2"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p> {[{ label: '1 Adult', base: pricing.singleOccupancyAdultPrice, disc: pricing.discountedSingleOccupancyAdultPrice }, { label: '2 Adults', base: pricing.doubleOccupancyAdultPrice, disc: pricing.discountedDoubleOccupancyAdultPrice }, { label: '3 Adults', base: pricing.tripleOccupancyAdultPrice, disc: pricing.discountedTripleOccupancyAdultPrice }, ].map(occ => ( <div key={occ.label} className="mb-2 pl-2"> <strong className="block text-gray-600">{occ.label}:</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(occ.base, mealPlan); const discPrice = getPrice(occ.disc, mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} /> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} </div>
                                            <div> <p className="font-semibold text-gray-700 flex items-center mb-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p> {[{ label: '5-12 yrs', base: pricing.child5to12Price, disc: pricing.discountedChild5to12Price }, ].map(child => ( <div key={child.label} className="mb-2 pl-2"> <strong className="block text-gray-600">Child ({child.label}):</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(child.base, mealPlan); const discPrice = getPrice(child.disc, mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} /> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} <p className="text-xs text-gray-500 mt-1 pl-2 italic">Children below 5 typically free.</p> </div>
                                        </div>
                                        {/* Display Seasonal Hike Info */}

                                        {cat.seasonalHike && (
                                            <div className="mt-4 pt-3 border-t text-sm">
                                                <p className="font-semibold text-gray-700 flex items-center mb-1">
                                                    <PriceIcon className="inline h-4 w-4 mr-1.5 text-blue-500"/>Seasonal Price Hike:
                                                </p>
                                                <p className="pl-6 text-gray-600 font-medium">
                                                    Period: {new Date(cat.seasonalHike.startDate).toLocaleDateString()} - {new Date(cat.seasonalHike.endDate).toLocaleDateString()}
                                                </p>
                                                <div className="pl-2 mt-2">
                                                    {[{ label: '1 Adult', hike: cat.seasonalHike.hikePricing.singleOccupancyAdultHike },
                                                    { label: '2 Adults', hike: cat.seasonalHike.hikePricing.doubleOccupancyAdultHike },
                                                    { label: '3 Adults', hike: cat.seasonalHike.hikePricing.tripleOccupancyAdultHike },
                                                    ].map(occ => {
                                                        // Check if there are any non-zero hike prices for this occupancy
                                                        const hasHikePrice = Object.values(occ.hike).some(price => price > 0);
                                                        if (!hasHikePrice) return null;

                                                        return (
                                                            <div key={occ.label} className="mb-2">
                                                                <strong className="block text-gray-600">{occ.label} (Additional Price):</strong>
                                                                <div className="pl-4 space-y-0.5">
                                                                    {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => {
                                                                        const hikePrice = getPrice(occ.hike, mealPlan);
                                                                        if (hikePrice > 0) {
                                                                            return (
                                                                                <div key={mealPlan} className="flex justify-between items-center">
                                                                                    <MealPlanLabel mealPlan={mealPlan} />
                                                                                    <span className="text-blue-600 font-medium">
                                                                                        + {currency} {hikePrice.toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Display Category Activities */}
                                        {cat.categoryActivities && cat.categoryActivities.length > 0 && (
                                            <div className="mt-4 pt-3 border-t text-sm">
                                                <p className="font-semibold text-gray-700 flex items-center mb-1"><Sparkles className="inline h-4 w-4 mr-1.5 text-yellow-500"/>Category Activities:</p>
                                                <ChipListDisplay items={cat.categoryActivities} noRemove baseColorClass="bg-yellow-100 text-yellow-700 border-yellow-300" />
                                            </div>
                                        )}

                                        {/* Display Category Facilities */}
                                        {cat.categoryFacilities && cat.categoryFacilities.length > 0 && (
                                            <div className="mt-3 pt-3 border-t text-sm">
                                                <p className="font-semibold text-gray-700 flex items-center mb-1"><Wrench className="inline h-4 w-4 mr-1.5 text-indigo-500"/>Category Facilities:</p>
                                                <ChipListDisplay items={cat.categoryFacilities} noRemove baseColorClass="bg-indigo-100 text-indigo-700 border-indigo-300" />
                                            </div>
                                        )}

                                        {cat.unavailableDates && cat.unavailableDates.length > 0 && (
                                            <div className="mt-4 pt-3 border-t text-sm">
                                                <p className="font-semibold text-red-600 mb-1">Unavailable Dates for this Category:</p>
                                                <div className="flex flex-wrap gap-1"> {cat.unavailableDates.map((date: string) => ( <Badge key={date} variant="destructive" className='font-normal'>{date}</Badge> ))} </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                     {isEditable && (
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-md space-y-6">
                            <h4 className="text-lg font-semibold text-gray-700">Add New Room Category:</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* ... (Title, Qty, Currency inputs remain the same) ... */}
                                <FormItem className="md:col-span-1"> <FormLabel htmlFor={`new-cat-title-${ensurePropertyData._id || 'new'}`}>Category Title</FormLabel> <Input id={`new-cat-title-${ensurePropertyData._id || 'new'}`} value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g. Deluxe Room" /> </FormItem>
                                <FormItem> <FormLabel htmlFor={`new-cat-qty-${ensurePropertyData._id || 'new'}`}>Quantity</FormLabel> <Input id={`new-cat-qty-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} /> </FormItem>
                                <FormItem> <FormLabel htmlFor={`new-cat-curr-${ensurePropertyData._id || 'new'}`}>Currency</FormLabel> <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}> <SelectTrigger id={`new-cat-curr-${ensurePropertyData._id || 'new'}`}><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </FormItem>
                            </div>

                             <div className="pt-4 border-t border-gray-300">
                                <MultipleImageUpload
                                    label="Category Images"
                                    value={newCategory.categoryImages}
                                    onChange={handleNewCategoryImagesChange}
                                    minImages={3}
                                    maxImages={10}
                                />
                            </div>

                            {/* Availability Period Inputs */}
                            <div className="pt-4 border-t border-gray-300">
                                <FormLabel className="text-md font-semibold text-gray-700 mb-2 block flex items-center">
                                    <CalendarDays className="inline h-5 w-5 mr-2"/> Availability Periods (Optional)
                                </FormLabel>
                                <p className="text-xs text-gray-500 mb-3">
                                    If no periods are set, this category is available year-round unless specific dates are blocked as unavailable.
                                </p>

                                {newCategory.currentAvailabilityPeriods.length > 0 && (
                                    <div className="mb-4 space-y-2">
                                        <Label className="text-sm text-gray-600">Added Periods:</Label>
                                        {newCategory.currentAvailabilityPeriods.map((period, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                                <span>{period.startDate} &mdash; {period.endDate}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveAvailabilityPeriod(index)}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-avail-start-${ensurePropertyData._id || 'new'}`}>Start Date</Label>
                                        <Input id={`new-cat-avail-start-${ensurePropertyData._id || 'new'}`} type="date" value={newCategory.newAvailabilityPeriod.startDate} onChange={(e) => handleNewAvailabilityPeriodChange('startDate', e.target.value)} />
                                    </FormItem>
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-avail-end-${ensurePropertyData._id || 'new'}`}>End Date</Label>
                                        <Input id={`new-cat-avail-end-${ensurePropertyData._id || 'new'}`} type="date" value={newCategory.newAvailabilityPeriod.endDate} onChange={(e) => handleNewAvailabilityPeriodChange('endDate', e.target.value)} />
                                    </FormItem>
                                </div>
                                <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full mt-3">
                                    <Plus size={16} className="mr-1" /> Add Availability Period
                                </Button>
                            </div>


                             {/* Adult and Child Pricing forms remain the same */}
                             <div className="pt-4 border-t border-gray-300"> <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price)</FormLabel> {adultPricingConfig.map(occ => ( <div key={occ.occupancy} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label}</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} /> </FormLabel> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.baseField}-${mealPlan}`}>Base Price</Label> <Input id={`new-cat-${occ.baseField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[occ.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </FormItem> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.discField}-${mealPlan}`}>Discounted</Label> <Input id={`new-cat-${occ.discField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[occ.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(occ.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </FormItem> </div> ))} </div> </div> ))} </div>
                             <div className="pt-4 border-t border-gray-300"> <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, sharing)</FormLabel> {childPricingConfig.map(child => ( <div key={child.age} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">Child ({child.age})</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} /> </FormLabel> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${child.baseField}-${mealPlan}`}>Base Price</Label> <Input id={`new-cat-${child.baseField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[child.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </FormItem> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${child.discField}-${mealPlan}`}>Discounted</Label> <Input id={`new-cat-${child.discField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[child.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(child.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </FormItem> </div> ))} </div> </div> ))} </div>

                            {/* Seasonal Hike Pricing Inputs */}
                            <div className="pt-4 border-t border-gray-300">
                                <FormLabel className="text-md font-semibold text-gray-700 mb-2 block flex items-center"><PriceIcon className="inline h-5 w-5 mr-2"/>Seasonal Price Hike (Optional)</FormLabel>
                                <p className="text-xs text-gray-500 mb-3">Set a period and additional prices that will be added on top of the base price for those specific dates.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-hike-start-${ensurePropertyData._id || 'new'}`}>Hike Start Date</Label>
                                        <Input id={`new-cat-hike-start-${ensurePropertyData._id || 'new'}`} type="date" value={newCategory.seasonalHike.startDate}
                                            onChange={(e) => setNewCategory(prev => ({ ...prev, seasonalHike: { ...prev.seasonalHike, startDate: e.target.value } }))}
                                        />
                                    </FormItem>
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-hike-end-${ensurePropertyData._id || 'new'}`}>Hike End Date</Label>
                                        <Input id={`new-cat-hike-end-${ensurePropertyData._id || 'new'}`} type="date" value={newCategory.seasonalHike.endDate}
                                            onChange={(e) => setNewCategory(prev => ({ ...prev, seasonalHike: { ...prev.seasonalHike, endDate: e.target.value } }))}
                                        />
                                    </FormItem>
                                </div>
                                
                                {hikePricingConfig.map(occ => (
                                    <div key={occ.field} className="mb-6 p-3 border rounded bg-white/50">
                                        <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label} (Additional Hike Price)</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                                            {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                                                <div key={mealPlan} className="space-y-2">
                                                    <FormLabel className="text-xs font-medium flex items-center text-gray-600">
                                                        <MealPlanLabel mealPlan={mealPlan} />
                                                    </FormLabel>
                                                    <FormItem>
                                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.field}-${mealPlan}`}>Hike Amount</Label>
                                                        <Input
                                                            id={`new-cat-${occ.field}-${mealPlan}`}
                                                            type="number"
                                                            value={getPrice(newCategory.seasonalHike.hikePricing[occ.field], mealPlan) || ''}
                                                            onChange={(e) => handleNewCategoryHikePricingChange(occ.field, mealPlan, e.target.value)}
                                                            placeholder="0.00"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </FormItem>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Category Activities Input */}
                            <div className="pt-4 border-t border-gray-300">
                                <FormLabel className="text-md font-semibold text-gray-700 mb-2 block flex items-center"><Sparkles className="inline h-5 w-5 mr-2"/>Category Activities</FormLabel>
                                <div className="flex flex-col sm:flex-row gap-2 items-start mb-2">
                                    <Input
                                        id={`new-cat-activity-input-${ensurePropertyData._id || 'new'}`}
                                        value={newCategory.newCategoryActivity}
                                        onChange={(e) => handleNewCategoryFieldChange('newCategoryActivity', e.target.value)}
                                        placeholder="e.g., Guided Tour"
                                        className="flex-grow"
                                    />
                                    <Button type="button" variant="outline" onClick={handleAddCategoryActivityFromForm} size="sm" className="w-full sm:w-auto">
                                        <Plus size={16} className="mr-1" /> Add Activity
                                    </Button>
                                </div>
                                <ChipListDisplay items={newCategory.currentCategoryActivities} onRemove={handleRemoveCategoryActivityFromForm} baseColorClass="bg-yellow-100 text-yellow-700 border-yellow-300" />
                            </div>

                            {/* Category Facilities Input */}
                            <div className="pt-4 border-t border-gray-300">
                                <FormLabel className="text-md font-semibold text-gray-700 mb-2 block flex items-center"><Wrench className="inline h-5 w-5 mr-2"/>Category Facilities</FormLabel>
                                <div className="flex flex-col sm:flex-row gap-2 items-start mb-2">
                                    <Input
                                        id={`new-cat-facility-input-${ensurePropertyData._id || 'new'}`}
                                        value={newCategory.newCategoryFacility}
                                        onChange={(e) => handleNewCategoryFieldChange('newCategoryFacility', e.target.value)}
                                        placeholder="e.g., Private Balcony"
                                        className="flex-grow"
                                    />
                                    <Button type="button" variant="outline" onClick={handleAddCategoryFacilityFromForm} size="sm" className="w-full sm:w-auto">
                                        <Plus size={16} className="mr-1" /> Add Facility
                                    </Button>
                                </div>
                                <ChipListDisplay items={newCategory.currentCategoryFacilities} onRemove={handleRemoveCategoryFacilityFromForm} baseColorClass="bg-indigo-100 text-indigo-700 border-indigo-300" />
                            </div>

                            <button type="button" onClick={handleAddCategory} className="flex items-center justify-center w-full py-2.5 bg-[#003c95] text-white rounded-md hover:bg-[#003c95] transition-colors focus:outline-none focus:ring-2 focus:ring-[#003c95] focus:ring-offset-2"> <Plus size={18} className="mr-2" /> Add This Category </button>
                        </div>
                    )}
                </div>
            )}

            {renderSection("Amenities", ensurePropertyData.amenities, 'No specific amenities listed.')}
            {renderSection("Property Accessibility", ensurePropertyData.accessibility, 'No property-wide accessibility features detailed.')}
            {renderSection("Room Accessibility Features", ensurePropertyData.roomAccessibility, 'No specific room accessibility features detailed.')}
            {renderSection("Popular Filters", ensurePropertyData.popularFilters, 'No popular filters listed.')}
            {renderSection("Nearby Fun & Activities", ensurePropertyData.funThingsToDo, 'No nearby activities listed.')}
            {renderSection("Meal Options (Property-wide)", ensurePropertyData.meals, 'No general meal options listed.')}
            {renderSection("On-site Facilities & Services", ensurePropertyData.facilities, 'No specific facilities listed.')}
            {renderSection("Bed Preferences / Types", ensurePropertyData.bedPreference, 'No bed preferences listed.')}
            {renderSection("Reservation Policies", ensurePropertyData.reservationPolicy, 'No specific reservation policies listed.')}
            {renderSection("Associated Brands", ensurePropertyData.brands, 'No associated brands listed.')}
            {renderSection("Standard In-Room Facilities", ensurePropertyData.roomFacilities, 'No standard in-room facilities listed.')}


             {ensurePropertyData.bannerImage?.url && ( <div className="border-t pt-8 mt-8"> <h3 className="text-xl font-semibold text-gray-800 mb-4">Banner Image</h3> <div className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-xl"> <Image fill src={ensurePropertyData.bannerImage.url} alt={ensurePropertyData.bannerImage.alt || ensurePropertyData.title || "Property banner"} className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority /> </div> </div> )}
             {ensurePropertyData.detailImages && ensurePropertyData.detailImages.length > 0 && ( <div className="border-t pt-8 mt-8"> <h3 className="text-xl font-semibold text-gray-800 mb-4">Photo Gallery</h3> <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"> {ensurePropertyData.detailImages.map((image: { url: string; alt?: string; public_id?: string }, index: number) => ( <div key={image.public_id || image.url || index} className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"> <Image fill src={image.url} alt={image.alt || `Property image ${index + 1}`} className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px" /> </div> ))} </div> </div> )}
        </div>
    );
};

export default PropertyDetails;