// src/components/PropertyDetails.tsx
import React, { useEffect } from 'react';
import { MapPin, Users, Tag, Star, Calendar, X, Plus, Baby, DollarSign as PriceIcon, Utensils, CalendarDays, Sparkles, Wrench, ImageIcon } from 'lucide-react'; // Added CalendarDays, Sparkles, Wrench
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property'; // Base Property type
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel } from '@/components/ui/form';
import GoogleMapsSection from './GoogleMapsSection';
import { Image as ImageType } from '@/lib/mongodb/models/Components'; 

// --- Assuming these types are defined correctly in '@/types' based on previous updates ---
import {
    PricingByMealPlan,
    DiscountedPricingByMealPlan
} from '@/types';
import { Label } from '@/components/ui/label'; // Label is used in the form
import { Button } from '@/components/ui/button'; // Button is used in the form
import { RoomCategoryPricing, StoredRoomCategory } from '@/types/booking'; // StoredRoomCategory should have the new fields
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { CldImage } from 'next-cloudinary';
// --- End Type Assumption ---

// Helper to generate unique IDs if adding categories locally
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to get price safely from nested structure
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


// Initial state for the new category form
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
    // New fields for availability, activities, facilities
    availabilityStartDate: '',
    availabilityEndDate: '',
    newCategoryActivity: '',
    currentCategoryActivities: [] as string[],
    newCategoryFacility: '',
    currentCategoryFacilities: [] as string[],
    categoryImages: [] as ImageType[],
};


interface PropertyDetailsProps {
    item: Property;
    isEditable?: boolean;
    // onUpdate?: (updatedProperty: Property) => void;
}

// Helper Component for Meal Plan labels
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

// Configuration for Adult Pricing Form Section
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

// Configuration for Child Pricing Form Section
interface ChildPricingRowConfig {
    age: string;
    baseField: keyof RoomCategoryPricing;
    discField: keyof RoomCategoryPricing;
}

const childPricingConfig: ChildPricingRowConfig[] = [
    { age: '5-12 yrs', baseField: 'child5to12Price', discField: 'discountedChild5to12Price' },
];

// Chip List component (can be moved to a shared location if used elsewhere)
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
        categoryRooms: Array.isArray(item.categoryRooms) ? item.categoryRooms.map(cat => ({
            ...cat,
            id: cat.id || generateId(),
            pricing: cat.pricing || initialNewCategoryFormState.pricing,
            unavailableDates: cat.unavailableDates || [],
            availabilityStartDate: cat.availabilityStartDate || '',
            availabilityEndDate: cat.availabilityEndDate || '',
            categoryActivities: cat.categoryActivities || [],
            categoryFacilities: cat.categoryFacilities || [],
            categoryImages: cat.categoryImages || [], // Ensure images are initialized
        })) : []
    }));

    const [newCategory, setNewCategory] = React.useState<{
        title: string;
        qty: number;
        currency: string;
        pricing: RoomCategoryPricing;
        availabilityStartDate: string;
        availabilityEndDate: string;
        newCategoryActivity: string;
        currentCategoryActivities: string[];
        newCategoryFacility: string;
        currentCategoryFacilities: string[];
        categoryImages: ImageType[]; // <-- Add this line
    }>({
        ...initialNewCategoryFormState,
        currency: item.costing?.currency || "USD"
    });

    useEffect(() => {
        setEnsurePropertyData({
            ...item,
            categoryRooms: Array.isArray(item.categoryRooms) ? item.categoryRooms.map(cat => ({
                ...cat,
                id: cat.id || generateId(),
                pricing: cat.pricing || initialNewCategoryFormState.pricing,
                unavailableDates: cat.unavailableDates || [],
                availabilityStartDate: cat.availabilityStartDate || '',
                availabilityEndDate: cat.availabilityEndDate || '',
                categoryActivities: cat.categoryActivities || [],
                categoryFacilities: cat.categoryFacilities || [],
                categoryImages: cat.categoryImages || [], // Ensure images are initialized on update
            })) : []
        });
        setNewCategory(prev => ({
            ...initialNewCategoryFormState,
            currency: item.costing?.currency || prev.currency || "USD"
         }));
    }, [item]);

    // Adjusted to cover all simple string/number fields in newCategory
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

    // Handlers for category-specific activities in the form
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

    // Handlers for category-specific facilities in the form
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


    const handleAddCategory = () => {
        if (!newCategory.title.trim()) { alert("Category title is required."); return; }
        if (newCategory.qty <= 0) { alert("Quantity must be greater than 0."); return; }
        if (newCategory.categoryImages.length < 3) { alert('Please upload at least 3 images for the category.'); return; } // Validation for images
        if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
            alert("Base Price for 1 Adult (Room Only) must be greater than 0."); return;
        }
        if (newCategory.availabilityStartDate && newCategory.availabilityEndDate) {
            if (new Date(newCategory.availabilityEndDate) < new Date(newCategory.availabilityStartDate)) {
                alert('Availability End Date cannot be before Start Date.'); return;
            }
        } else if (newCategory.availabilityEndDate && !newCategory.availabilityStartDate) {
             alert('Please provide an Availability Start Date if End Date is set.'); return;
        }

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

        const categoryToAdd: StoredRoomCategory = {
            id: generateId(),
            title: newCategory.title,
            qty: newCategory.qty,
            currency: newCategory.currency,
            pricing: JSON.parse(JSON.stringify(newCategory.pricing)),
            unavailableDates: [], // New categories start with no unavailable dates from this form
            availabilityStartDate: newCategory.availabilityStartDate || undefined,
            availabilityEndDate: newCategory.availabilityEndDate || undefined,
            categoryActivities: [...newCategory.currentCategoryActivities],
            categoryFacilities: [...newCategory.currentCategoryFacilities],
        };

        setEnsurePropertyData((prev) => ({
            ...prev,
            categoryRooms: [...(prev.categoryRooms || []), categoryToAdd]
        }));
        setNewCategory({ ...initialNewCategoryFormState, currency: newCategory.currency }); // Reset form
        // If onUpdate prop is used:
        // const updatedProperty = { ...ensurePropertyData, categoryRooms: [...(ensurePropertyData.categoryRooms || []), categoryToAdd] };
        // onUpdate?.(updatedProperty);
    };

    const handleRemoveCategory = (idToRemove: string) => {
        const updatedCategories = (ensurePropertyData.categoryRooms || []).filter((cat: StoredRoomCategory) => cat.id !== idToRemove);
        setEnsurePropertyData((prev) => ({
            ...prev,
            categoryRooms: updatedCategories
        }));
        // If onUpdate prop is used:
        // const updatedProperty = { ...ensurePropertyData, categoryRooms: updatedCategories };
        // onUpdate?.(updatedProperty);
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

    let displayPrice = ensurePropertyData.costing?.price || 0;
    let displayDiscountedPrice = ensurePropertyData.costing?.discountedPrice || 0;
    let displayCurrency = ensurePropertyData.costing?.currency || 'USD';
    let displayTotalRooms = ensurePropertyData.rooms || 0;

    const currentCategories = ensurePropertyData.categoryRooms || [];

    if (Array.isArray(currentCategories) && currentCategories.length > 0) {
        let minOverallPrice = Infinity;
        let minOverallDiscountedPrice = Infinity;
        let leadCurrency = currentCategories[0].currency || "INR";
        const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

        currentCategories.forEach((cat: StoredRoomCategory) => {
            const pricing = cat.pricing || initialNewCategoryFormState.pricing;
            // This calculation doesn't filter by category availability dates for the *overall* property price
            mealPlans.forEach(mealPlan => {
                // ... (price calculation logic remains the same)
                const singleBase = getPrice(pricing.singleOccupancyAdultPrice, mealPlan);
                const singleDisc = getPrice(pricing.discountedSingleOccupancyAdultPrice, mealPlan);
                const doubleBase = getPrice(pricing.doubleOccupancyAdultPrice, mealPlan);
                const doubleDisc = getPrice(pricing.discountedDoubleOccupancyAdultPrice, mealPlan);
                const tripleBase = getPrice(pricing.tripleOccupancyAdultPrice, mealPlan);
                const tripleDisc = getPrice(pricing.discountedTripleOccupancyAdultPrice, mealPlan);

                const pricesPerAdult: number[] = [];
                const discountedPricesPerAdult: number[] = [];

                if (singleBase > 0) pricesPerAdult.push(singleBase);
                if (singleDisc > 0) discountedPricesPerAdult.push(singleDisc); else if (singleBase > 0) discountedPricesPerAdult.push(singleBase);
                if (doubleBase > 0) pricesPerAdult.push(doubleBase / 2);
                if (doubleDisc > 0) discountedPricesPerAdult.push(doubleDisc / 2); else if (doubleBase > 0) discountedPricesPerAdult.push(doubleBase / 2);
                if (tripleBase > 0) pricesPerAdult.push(tripleBase / 3);
                if (tripleDisc > 0) discountedPricesPerAdult.push(tripleDisc / 3); else if (tripleBase > 0) discountedPricesPerAdult.push(tripleBase / 3);

                const currentMinForPlan = Math.min(...pricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);
                const currentMinDiscountedForPlan = Math.min(...discountedPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);

                 if (currentMinForPlan < minOverallPrice) { minOverallPrice = currentMinForPlan; leadCurrency = cat.currency; }
                 if (currentMinDiscountedForPlan < minOverallDiscountedPrice) { minOverallDiscountedPrice = currentMinDiscountedForPlan; }
            });
        });

        displayTotalRooms = currentCategories.reduce((sum: number, category: StoredRoomCategory) => sum + (category.qty || 0), 0);
        displayPrice = minOverallPrice === Infinity ? (ensurePropertyData.costing?.price || 0) : parseFloat(minOverallPrice.toFixed(2));
        displayDiscountedPrice = minOverallDiscountedPrice !== Infinity ? parseFloat(minOverallDiscountedPrice.toFixed(2)) : (minOverallPrice !== Infinity ? parseFloat(minOverallPrice.toFixed(2)) : (ensurePropertyData.costing?.discountedPrice || 0));
        if (displayDiscountedPrice >= displayPrice && displayPrice > 0) displayDiscountedPrice = displayPrice; else if (displayDiscountedPrice === 0 && displayPrice > 0) displayDiscountedPrice = displayPrice;
        displayCurrency = leadCurrency;
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{ensurePropertyData.title || "Property Details"}</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
                {/* ... (existing property summary display) ... */}
                <div className="flex items-start space-x-3"> <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Location</p> <p className="text-base text-gray-700">{getFormattedAddress()}</p> </div> </div>
                <div className="flex items-start space-x-3"> <PriceIcon className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Starting Price (per adult/night)</p> <p className="text-base text-gray-700 font-semibold"> {displayCurrency} {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {displayDiscountedPrice > 0 && displayDiscountedPrice < displayPrice && ( <span className="ml-2 text-green-600"> (From: {displayCurrency} {displayDiscountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) </span> )} </p> <p className="text-xs text-gray-500">Lowest rate across rooms & meal plans.</p> </div> </div>
                <div className="flex items-start space-x-3"> <Users className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Total Rooms Available</p> <p className="text-base text-gray-700">{displayTotalRooms}</p> </div> </div>
                <div className="flex items-start space-x-3"> <Tag className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Type</p> <p className="text-base text-gray-700">{formatPropertyType(ensurePropertyData.type)}</p> </div> </div>
                <div className="flex items-start space-x-3"> <Star className="w-5 h-5 text-yellow-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Property Rating</p> <p className="text-base text-gray-700"> {ensurePropertyData.propertyRating ? `${ensurePropertyData.propertyRating.toString()} / 5 Stars` : 'Not rated yet'} </p> </div> </div>
                <div className="flex items-start space-x-3"> <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Overall Availability</p> <p className="text-base text-gray-700"> {ensurePropertyData.startDate ? new Date(ensurePropertyData.startDate).toLocaleDateString() : 'N/A'} - {ensurePropertyData.endDate ? new Date(ensurePropertyData.endDate).toLocaleDateString() : 'N/A'} </p> </div> </div>
            </div>

            <GoogleMapsSection item={ensurePropertyData} />

             {(isEditable || (currentCategories && currentCategories.length > 0)) && (
                <div className="border-t pt-8 mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Room Categories & Pricing</h3>
                     {currentCategories && currentCategories.length > 0 && (
                        <div className="mb-6 space-y-4">
                             {currentCategories.map((cat: StoredRoomCategory) => {
                                const pricing = cat.pricing || initialNewCategoryFormState.pricing;
                                const currency = cat.currency || 'USD';
                                return (
                                    <div key={cat.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4 pb-3 border-b">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms)</span></p>
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
                                        {(cat.availabilityStartDate || cat.availabilityEndDate) && (
                                            <div className="text-sm mb-3">
                                                <p className="font-semibold text-gray-700 flex items-center"><CalendarDays className="inline h-4 w-4 mr-1.5 text-blue-500"/>Availability:</p>
                                                <p className="pl-6 text-gray-600">
                                                    {cat.availabilityStartDate ? new Date(cat.availabilityStartDate).toLocaleDateString() : 'Open Start'} - {cat.availabilityEndDate ? new Date(cat.availabilityEndDate).toLocaleDateString() : 'Open End'}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                            {/* ... (Adult and Child Pricing display remains the same) ... */}
                                            <div> <p className="font-semibold text-gray-700 flex items-center mb-2"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p> {[{ label: '1 Adult', base: pricing.singleOccupancyAdultPrice, disc: pricing.discountedSingleOccupancyAdultPrice }, { label: '2 Adults', base: pricing.doubleOccupancyAdultPrice, disc: pricing.discountedDoubleOccupancyAdultPrice }, { label: '3 Adults', base: pricing.tripleOccupancyAdultPrice, disc: pricing.discountedTripleOccupancyAdultPrice }, ].map(occ => ( <div key={occ.label} className="mb-2 pl-2"> <strong className="block text-gray-600">{occ.label}:</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(occ.base, mealPlan); const discPrice = getPrice(occ.disc, mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} /> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} </div>
                                            <div> <p className="font-semibold text-gray-700 flex items-center mb-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p> {[{ label: '5-12 yrs', base: pricing.child5to12Price, disc: pricing.discountedChild5to12Price }, ].map(child => ( <div key={child.label} className="mb-2 pl-2"> <strong className="block text-gray-600">Child ({child.label}):</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(child.base, mealPlan); const discPrice = getPrice(child.disc, mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} /> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} <p className="text-xs text-gray-500 mt-1 pl-2 italic">Children below 5 typically free.</p> </div>
                                        </div>

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
                                <FormLabel className="text-md font-semibold text-gray-700 mb-2 block flex items-center"><CalendarDays className="inline h-5 w-5 mr-2"/>Availability Period (Optional)</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-avail-start-${ensurePropertyData._id || 'new'}`}>Start Date</Label>
                                        <Input id={`new-cat-avail-start-${ensurePropertyData._id || 'new'}`} type="date" value={newCategory.availabilityStartDate} onChange={(e) => handleNewCategoryFieldChange('availabilityStartDate', e.target.value)} />
                                    </FormItem>
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-avail-end-${ensurePropertyData._id || 'new'}`}>End Date</Label>
                                        <Input id={`new-cat-avail-end-${ensurePropertyData._id || 'new'}`} type="date" value={newCategory.availabilityEndDate} onChange={(e) => handleNewCategoryFieldChange('availabilityEndDate', e.target.value)} />
                                    </FormItem>
                                </div>
                            </div>

                             {/* Adult and Child Pricing forms remain the same */}
                             <div className="pt-4 border-t border-gray-300"> <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price)</FormLabel> {adultPricingConfig.map(occ => ( <div key={occ.occupancy} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label}</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} /> </FormLabel> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.baseField}-${mealPlan}`}>Base Price</Label> <Input id={`new-cat-${occ.baseField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[occ.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </FormItem> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.discField}-${mealPlan}`}>Discounted (Opt.)</Label> <Input id={`new-cat-${occ.discField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[occ.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(occ.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </FormItem> </div> ))} </div> </div> ))} </div>
                             <div className="pt-4 border-t border-gray-300"> <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, sharing)</FormLabel> {childPricingConfig.map(child => ( <div key={child.age} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">Child ({child.age})</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} /> </FormLabel> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${child.baseField}-${mealPlan}`}>Base Price</Label> <Input id={`new-cat-${child.baseField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[child.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </FormItem> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${child.discField}-${mealPlan}`}>Discounted (Opt.)</Label> <Input id={`new-cat-${child.discField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[child.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(child.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </FormItem> </div> ))} </div> </div> ))} </div>

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

                            <button type="button" onClick={handleAddCategory} className="flex items-center justify-center w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"> <Plus size={18} className="mr-2" /> Add This Category </button>
                        </div>
                    )}
                </div>
            )}

            {/* ... (renderSection calls for other property details remain the same) ... */}
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