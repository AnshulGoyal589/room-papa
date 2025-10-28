import React, { useEffect } from 'react';
import { MapPin, Users, Tag, Star, X, Plus, Baby, DollarSign as PriceIcon, Utensils, CalendarDays, Sparkles, Wrench, ImageIcon, ClipboardList, Bed } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property'; // Assuming this provides the base structure
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormItem, FormLabel } from '@/components/ui/form';
import GoogleMapsSection from './GoogleMapsSection';
import { Image as ImageType, Period, SeasonalCoasting } from '@/lib/mongodb/models/Components'; // Assuming structure is imported
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { HikePricingByOccupancy } from '@/types/booking'; // Assuming types are used
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { CldImage } from 'next-cloudinary';
import { DiscountedPricingByMealPlan, PricingByMealPlan, RoomCategory, RoomCategoryPricing } from '@/types/property';
import { Checkbox } from '@/components/ui/checkbox';

// Helper function definitions (kept mostly the same)
const generateId = () => Math.random().toString(36).substr(2, 9);

const getPrice = (
    priceGroup: PricingByMealPlan | Partial<PricingByMealPlan> | DiscountedPricingByMealPlan | undefined | number,
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

const emptyMealPlanPricing = (): PricingByMealPlan => ({ noMeal: 0, breakfastOnly: 0, allMeals: 0 });


const initialHouseRulesState = {
    checkInTime: '',
    checkOutTime: '',
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
    additionalRules: [],
};

const initialHikePricingState: HikePricingByOccupancy = {
    singleOccupancyAdultHike: emptyMealPlanPricing(),
    doubleOccupancyAdultHike: emptyMealPlanPricing(),
    tripleOccupancyAdultHike: emptyMealPlanPricing(),
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


// --- UPDATED INITIAL FORM STATE TO INCLUDE PRICING MODEL ---
const initialNewCategoryFormState = {
    title: '',
    qty: 1,
    currency: 'INR',
    pricingModel: 'perOccupancy' as 'perOccupancy' | 'perUnit', // NEW FIELD
    
    // Per Occupancy Pricing
    pricing: {
        singleOccupancyAdultPrice: emptyMealPlanPricing(),
        discountedSingleOccupancyAdultPrice: emptyMealPlanPricing(),
        doubleOccupancyAdultPrice: emptyMealPlanPricing(),
        discountedDoubleOccupancyAdultPrice: emptyMealPlanPricing(),
        tripleOccupancyAdultPrice: emptyMealPlanPricing(),
        discountedTripleOccupancyAdultPrice: emptyMealPlanPricing(),
        child5to12Price: emptyMealPlanPricing(),
        discountedChild5to12Price: emptyMealPlanPricing(),
    } as RoomCategoryPricing,
    
    // Per Unit Pricing (used if pricingModel is 'perUnit')
    totalOccupancy: 2,
    totalOccupancyPrice: emptyMealPlanPricing() as PricingByMealPlan,
    discountedTotalOccupancyPrice: emptyMealPlanPricing() as DiscountedPricingByMealPlan,

    newUnavailablePeriod: { startDate: '', endDate: '' },
    currentUnavailableDates: [] as Period[],

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

// Interface for the state of the new category form

//eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface NewCategoryState extends Omit<typeof initialNewCategoryFormState, 'houseRules'> {}


interface PropertyDetailsProps {
    item: Property;
    isEditable?: boolean;
}

const MealPlanLabel: React.FC<{ mealPlan: keyof PricingByMealPlan, showIcon?: boolean }> = ({ mealPlan, showIcon = true }) => {
    let text = '';
    switch(mealPlan) {
        case 'noMeal': text = 'Room Only (RO)'; break;
        case 'breakfastOnly': text = '+ Breakfast (BB)'; break;
        case 'allMeals': text = '+ All Meals (AP)'; break;
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
        offers: Array.isArray(item.offers) ? item.offers.map(String) : [],
        categoryRooms: Array.isArray(item.categoryRooms) ? item.categoryRooms.map(cat => ({
            ...cat,
            id: cat.id || generateId(),
            pricingModel: cat.pricingModel || 'perOccupancy', // Ensure model exists on existing data
            pricing: cat.pricing || initialNewCategoryFormState.pricing,
            totalOccupancyPrice: cat.totalOccupancyPrice || emptyMealPlanPricing(),
            discountedTotalOccupancyPrice: cat.discountedTotalOccupancyPrice || emptyMealPlanPricing(),
            unavailableDates: cat.unavailableDates || [],
            availability: cat.availability || [],
            roomSize: cat.roomSize || "Unknown",
            categoryActivities: cat.categoryActivities || [],
            categoryFacilities: cat.categoryFacilities || [],
            categoryImages: cat.categoryImages || [],
            seasonalHike: cat.seasonalHike || undefined
        })) : []
    }));

    const [newAdditionalRule, setNewAdditionalRule] = React.useState('');
    const [newOffer, setNewOffer] = React.useState('');

    const [newCategory, setNewCategory] = React.useState<NewCategoryState>(() => ({
        ...initialNewCategoryFormState,
        currency: item.costing?.currency || "INR",
        roomSize: initialNewCategoryFormState.roomSize || "Unknown"
    }));

    useEffect(() => {
        setEnsurePropertyData({
            ...item,
            houseRules: item.houseRules || initialHouseRulesState,
            offers: Array.isArray(item.offers) ? item.offers.map(String) : [],
            categoryRooms: Array.isArray(item.categoryRooms) ? item.categoryRooms.map(cat => ({
                ...cat,
                id: cat.id || generateId(),
                pricingModel: cat.pricingModel || 'perOccupancy',
                pricing: cat.pricing || initialNewCategoryFormState.pricing,
                totalOccupancyPrice: cat.totalOccupancyPrice || emptyMealPlanPricing(),
                discountedTotalOccupancyPrice: cat.discountedTotalOccupancyPrice || emptyMealPlanPricing(),
                unavailableDates: cat.unavailableDates || [],
                availability: cat.availability || [],
                categoryActivities: cat.categoryActivities || [],
                categoryFacilities: cat.categoryFacilities || [],
                categoryImages: cat.categoryImages || [],
                seasonalHike: cat.seasonalHike || undefined
            })) : []
        });
        setNewCategory(prev => ({
            ...initialNewCategoryFormState,
            currency: item.costing?.currency || prev.currency || "INR"
         }));
    }, [item]);

    // Handler for general fields (title, qty, roomSize, pricingModel, totalOccupancy)
    const handleNewCategoryFieldChange = (
        field: keyof NewCategoryState,
        value: string | number
    ) => {
        setNewCategory(prev => ({ ...prev, [field]: value }));
    };

    const handleNewCategoryImagesChange = (images: ImageType[]) => {
        setNewCategory(prev => ({ ...prev, categoryImages: images }));
    };

    // Handler for Per Occupancy Pricing
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
                 updatedPricing[priceField] = emptyMealPlanPricing();
            }
            (updatedPricing[priceField] as PricingByMealPlan | DiscountedPricingByMealPlan)[mealPlan] = safeValue;
            return { ...prev, pricing: updatedPricing };
        });
    };
    
    // Handler for Per Unit Pricing
    const handleNewCategoryPerUnitPricingChange = (
        priceField: 'totalOccupancyPrice' | 'discountedTotalOccupancyPrice',
        mealPlan: keyof PricingByMealPlan,
        value: string | number
    ) => {
        const numericValue = Number(value);
        const safeValue = numericValue < 0 ? 0 : numericValue;
        setNewCategory(prev => {
            const updatedPricing = JSON.parse(JSON.stringify(prev[priceField]));
            updatedPricing[mealPlan] = safeValue;
            return { ...prev, [priceField]: updatedPricing };
        });
    };

    const handleNewUnavailablePeriodChange = (field: 'startDate' | 'endDate', value: string) => {
        setNewCategory(prev => ({
            ...prev,
            newUnavailablePeriod: {
                ...prev.newUnavailablePeriod,
                [field]: value
            }
        }));
    };

    const handleAddUnavailablePeriod = () => {
        const { startDate, endDate } = newCategory.newUnavailablePeriod;
        if (!startDate || !endDate) {
            alert("Both Start Date and End Date are required for an unavailable period.");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            alert('End Date cannot be before Start Date.');
            return;
        }
        setNewCategory(prev => ({
            ...prev,
            currentUnavailableDates: [...prev.currentUnavailableDates, { startDate, endDate }],
            newUnavailablePeriod: { startDate: '', endDate: '' } 
        }));
    };

    const handleRemoveUnavailablePeriod = (indexToRemove: number) => {
        setNewCategory(prev => ({
            ...prev,
            currentUnavailableDates: prev.currentUnavailableDates.filter((_, index) => index !== indexToRemove)
        }));
    };

    // ... (Other handlers like availability, activities, facilities, hike pricing remain the same) ...
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
            newAvailabilityPeriod: { startDate: '', endDate: '' } 
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
                updatedHikePricing[occupancyField] = emptyMealPlanPricing();
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
    // Helper to update top-level property fields (used for House Rules)
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

    const handleAddOffer = () => {
        const offerToAdd = newOffer.trim();
        if (offerToAdd) {
            const currentOffers = ensurePropertyData.offers || [];
            if (!currentOffers.includes(offerToAdd)) {
                handlePropertyChange('offers', [...currentOffers, offerToAdd]);
                setNewOffer('');
            } else {
                alert("This offer is already added.");
            }
        }
    };

    const handleRemoveOffer = (offerToRemove: string) => {
        const currentOffers = ensurePropertyData.offers || [];
        handlePropertyChange('offers', currentOffers.filter(o => o !== offerToRemove));
    };

    // --- UPDATED handleAddCategory LOGIC ---
    const handleAddCategory = () => {
        if (!newCategory.title.trim()) { alert("Category title is required."); return; }
        if (newCategory.qty <= 0) { alert("Quantity must be greater than 0."); return; }
        if (newCategory.categoryImages.length < 3) { alert('Please upload at least 3 images for the category.'); return; }

        const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

        if (newCategory.pricingModel === 'perOccupancy') {
            // Per Occupancy Validation
            if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
                 alert("Base Price for 1 Adult (Room Only) must be greater than 0 for perOccupancy model."); return;
            }
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
        } else if (newCategory.pricingModel === 'perUnit') {
            // Per Unit Validation
            if (newCategory.totalOccupancy <= 0) {
                alert("Maximum Occupancy must be greater than 0 for perUnit model."); return;
            }
            if (getPrice(newCategory.totalOccupancyPrice, 'noMeal') <= 0) {
                alert("Base Room Price (Room Only) must be greater than 0 for perUnit model."); return;
            }
            for (const mealPlan of mealPlans) {
                const base = getPrice(newCategory.totalOccupancyPrice, mealPlan);
                const disc = getPrice(newCategory.discountedTotalOccupancyPrice, mealPlan);
                if (disc > 0 && base > 0 && disc >= base) {
                    alert(`Discounted total room price (${mealPlan}) must be less than base price.`); return;
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

        const categoryToAdd: RoomCategory = {
            id: generateId(),
            title: newCategory.title,
            qty: newCategory.qty,
            currency: newCategory.currency,
            unavailableDates: [...newCategory.currentUnavailableDates],
            availability: [...newCategory.currentAvailabilityPeriods],
            roomSize: newCategory.roomSize || "Unknown",
            categoryActivities: [...newCategory.currentCategoryActivities],
            categoryFacilities: [...newCategory.currentCategoryFacilities],
            categoryImages: [...newCategory.categoryImages],
            seasonalHike: seasonalHikeToAdd,

            // Pricing Model specific fields
            pricingModel: newCategory.pricingModel,
            
            // Per Occupancy fields (only populated if perOccupancy)
            pricing: newCategory.pricingModel === 'perOccupancy' ? JSON.parse(JSON.stringify(newCategory.pricing)) : initialNewCategoryFormState.pricing,
            
            // Per Unit fields (only populated if perUnit)
            totalOccupancy: newCategory.pricingModel === 'perUnit' ? newCategory.totalOccupancy : undefined,
            totalOccupancyPrice: newCategory.pricingModel === 'perUnit' ? JSON.parse(JSON.stringify(newCategory.totalOccupancyPrice)) : undefined,
            discountedTotalOccupancyPrice: newCategory.pricingModel === 'perUnit' ? JSON.parse(JSON.stringify(newCategory.discountedTotalOccupancyPrice)) : undefined,
        };

        setEnsurePropertyData((prev) => ({
            ...prev,
            categoryRooms: [...(prev.categoryRooms || []), categoryToAdd]
        }));
        setNewCategory({ ...initialNewCategoryFormState, currency: newCategory.currency, pricingModel: newCategory.pricingModel });
    };
    

    const handleRemoveCategory = (idToRemove: string) => {
        const updatedCategories = (ensurePropertyData.categoryRooms || []).filter((cat: RoomCategory) => cat.id !== idToRemove);
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
        emptyMsg: string,
        icon: React.ElementType | null = null
      ) => {
        const hasData = data && data.length > 0 && !(data.length === 1 && !data[0]?.trim());
        if (!hasData && !isEditable) return null;
        return (
          <div className="border-t pt-6 mt-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                {icon && React.createElement(icon, { className: "w-5 h-5 mr-2 text-gray-600" })}
                {sectionTitle}
            </h4>
            {renderBadges(data, isEditable && !hasData ? `No ${sectionTitle.toLowerCase()} added yet.` : emptyMsg)}
          </div>
        );
      };

    const displayPrice = ensurePropertyData.costing?.price || 0;
    const displayDiscountedPrice = ensurePropertyData.costing?.discountedPrice || 0;
    const displayCurrency = ensurePropertyData.costing?.currency || 'INR';
    let displayTotalRooms = ensurePropertyData.rooms || 0;

    const currentCategories = ensurePropertyData.categoryRooms || [];

    if (Array.isArray(currentCategories) && currentCategories.length > 0) {
        displayTotalRooms = currentCategories.reduce((sum: number, category: RoomCategory) => sum + (category.qty || 0), 0);
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">{ensurePropertyData?.title || "Property Details"}</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
                <div className="flex items-start space-x-3"> <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Location</p> <p className="text-base text-gray-700">{getFormattedAddress()}</p> </div> </div>
                <div className="flex items-start space-x-3"> <PriceIcon className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Starting Price (per adult/night)</p> <p className="text-base text-gray-700 font-semibold"> {displayCurrency} {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {displayDiscountedPrice > 0 && displayDiscountedPrice < displayPrice && ( <span className="ml-2 text-green-600"> (From: {displayCurrency} {displayDiscountedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}) </span> )} </p> <p className="text-xs text-gray-500">Lowest rate across rooms & meal plans.</p> </div> </div>
                <div className="flex items-start space-x-3"> <Users className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Total Rooms Available</p> <p className="text-base text-gray-700">{displayTotalRooms}</p> </div> </div>
                <div className="flex items-start space-x-3"> <Tag className="w-5 h-5 text-gray-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Type</p> <p className="text-base text-gray-700">{formatPropertyType(ensurePropertyData.type)}</p> </div> </div>
                <div className="flex items-start space-x-3"> <Star className="w-5 h-5 text-yellow-500 shrink-0 mt-1" /> <div> <p className="text-sm font-medium text-gray-500">Property Rating</p> <p className="text-base text-gray-700"> {ensurePropertyData.propertyRating ? `${ensurePropertyData.propertyRating.toString()} / 5 Stars` : 'Not rated yet'} </p> </div> </div>
            </div>

            <GoogleMapsSection item={ensurePropertyData} />

            {/* House Rules Section */}
            <div className="border-t pt-8 mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <ClipboardList className="w-6 h-6 mr-2 text-gray-600" />
                    House Rules
                </h3>
                 {/* ... (House Rules Edit/Display logic remains the same) ... */}
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

            {isEditable && (
                <div className="border-t pt-8 mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <Tag className="w-6 h-6 mr-2 text-gray-600" />
                        Special Offers
                    </h3>
                    <div>
                        <FormLabel>Add an Offer</FormLabel>
                        <div className="flex flex-col sm:flex-row gap-2 items-start mt-2">
                            <Input
                                value={newOffer}
                                onChange={(e) => setNewOffer(e.target.value)}
                                placeholder="e.g., Free Airport Transfer"
                                className="flex-grow"
                            />
                            <Button type="button" variant="outline" onClick={handleAddOffer} size="sm" className="w-full sm:w-auto">
                                <Plus size={16} className="mr-1" /> Add Offer
                            </Button>
                        </div>
                        <ChipListDisplay
                            items={ensurePropertyData.offers}
                            onRemove={handleRemoveOffer}
                            baseColorClass="bg-green-100 text-green-700 border-green-300"
                        />
                    </div>
                </div>
            )}


            {(isEditable || (currentCategories && currentCategories.length > 0)) && (
                <div className="border-t pt-8 mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Room Categories & Pricing</h3>
                     {currentCategories && currentCategories.length > 0 && (
                        <div className="mb-6 space-y-4">
                             {currentCategories.map((cat: RoomCategory) => {
                                // Determine pricing data based on model
                                const isPerUnit = cat.pricingModel === 'perUnit';
                                const pricing = cat?.pricing || initialNewCategoryFormState.pricing;
                                const unitPrice = cat.totalOccupancyPrice;
                                const discountedUnitPrice = cat.discountedTotalOccupancyPrice;
                                const maxOccupancy = cat.totalOccupancy || 'N/A';
                                const currency = cat.currency || 'INR';

                                return (
                                    <div key={cat.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4 pb-3 border-b">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms)</span></p>
                                                <p className="text-sm text-gray-500">Room Size: {cat.roomSize || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">Pricing Model: <Badge variant="secondary" className='font-normal py-0'>{isPerUnit ? 'Per Unit/Room' : 'Per Occupancy/Person'}</Badge></p>
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
                                                            key={img.url || index}
                                                            src={img.url}
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

                                        {/* --- PRICING DISPLAY BASED ON MODEL --- */}
                                        {isPerUnit ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                                <div>
                                                    <p className="font-semibold text-gray-700 flex items-center mb-2"><Users className="inline h-4 w-4 mr-1.5"/>Total Room Price (Max Occupancy: {maxOccupancy}):</p>
                                                    <div className="pl-4 space-y-0.5">
                                                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => {
                                                            const basePrice = getPrice(unitPrice, mealPlan);
                                                            const discPrice = getPrice(discountedUnitPrice, mealPlan);
                                                            if (basePrice > 0) {
                                                                return (
                                                                    <div key={mealPlan} className="flex justify-between items-center">
                                                                        <MealPlanLabel mealPlan={mealPlan} />
                                                                        <span className="text-gray-800">
                                                                            {currency} {basePrice.toLocaleString()}
                                                                            {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="text-gray-500 italic pt-6 md:pt-0">
                                                    <p className="font-semibold text-gray-700 mb-2">Note:</p>
                                                    <p className="text-xs">This rate is fixed for the room regardless of the number of guests (up to {maxOccupancy}). Seasonal hike (if applicable) is added to these rates.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                                <div> 
                                                    <p className="font-semibold text-gray-700 flex items-center mb-2"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p> 
                                                    {adultPricingConfig.map(occ => ( <div key={occ.label} className="mb-2 pl-2"> <strong className="block text-gray-600">{occ.label}:</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(pricing[occ.baseField], mealPlan); const discPrice = getPrice(pricing[occ.discField], mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} /> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} 
                                                </div>
                                                <div> 
                                                    <p className="font-semibold text-gray-700 flex items-center mb-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p> 
                                                    {childPricingConfig.map(child => ( <div key={child.age} className="mb-2 pl-2"> <strong className="block text-gray-600">Child ({child.age}):</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(pricing[child.baseField], mealPlan); const discPrice = getPrice(pricing[child.discField], mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} /> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} 
                                                    <p className="text-xs text-gray-500 mt-1 pl-2 italic">Children below 5 typically free.</p> 
                                                </div>
                                            </div>
                                        )}


                                        {/* Display Seasonal Hike Info (Applies to both models, hike amount is added) */}
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

                                        {/* Display Category Activities and Facilities */}
                                        {cat.categoryActivities && cat.categoryActivities.length > 0 && (
                                            <div className="mt-4 pt-3 border-t text-sm">
                                                <p className="font-semibold text-gray-700 flex items-center mb-1"><Sparkles className="inline h-4 w-4 mr-1.5 text-yellow-500"/>Category Activities:</p>
                                                <ChipListDisplay items={cat.categoryActivities} noRemove baseColorClass="bg-yellow-100 text-yellow-700 border-yellow-300" />
                                            </div>
                                        )}

                                        {cat.categoryFacilities && cat.categoryFacilities.length > 0 && (
                                            <div className="mt-3 pt-3 border-t text-sm">
                                                <p className="font-semibold text-gray-700 flex items-center mb-1"><Wrench className="inline h-4 w-4 mr-1.5 text-indigo-500"/>Category Facilities:</p>
                                                <ChipListDisplay items={cat.categoryFacilities} noRemove baseColorClass="bg-indigo-100 text-indigo-700 border-indigo-300" />
                                            </div>
                                        )}

                                        {cat.unavailableDates && (cat.unavailableDates as Period[]).length > 0 && (
                                            <div className="mt-4 pt-3 border-t text-sm">
                                                <p className="font-semibold text-red-600 mb-1">Unavailable Periods for this Category:</p>
                                                <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700">
                                                    {(cat.unavailableDates as Period[]).map((period, index) => (
                                                        <li key={index}>{period.startDate} to {period.endDate}</li>
                                                    ))}
                                                </ul>
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
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormItem className="md:col-span-1"> <FormLabel htmlFor={`new-cat-title-${ensurePropertyData._id || 'new'}`}>Category Title</FormLabel> <Input id={`new-cat-title-${ensurePropertyData._id || 'new'}`} value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g. Deluxe Room" /> </FormItem>
                                <FormItem> <FormLabel htmlFor={`new-cat-qty-${ensurePropertyData._id || 'new'}`}>Quantity</FormLabel> <Input id={`new-cat-qty-${ensurePropertyData._id || 'new'}`} type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} /> </FormItem>
                                <FormItem> <FormLabel htmlFor={`new-cat-curr-${ensurePropertyData._id || 'new'}`}>Currency</FormLabel> <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}> <SelectTrigger id={`new-cat-curr-${ensurePropertyData._id || 'new'}`}><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </FormItem>
                                
                                {/* NEW: Pricing Model Selector */}
                                <FormItem>
                                    <FormLabel htmlFor={`new-cat-pricing-model`}>Pricing Model</FormLabel>
                                    <Select value={newCategory.pricingModel} onValueChange={(value) => handleNewCategoryFieldChange('pricingModel', value as 'perOccupancy' | 'perUnit')}>
                                        <SelectTrigger id={`new-cat-pricing-model`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="perOccupancy">Per Occupancy (Per Person)</SelectItem>
                                            <SelectItem value="perUnit">Per Unit (Fixed Room Price)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
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

                            {/* Availability Period Inputs (Remains the same) */}
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


                            {/* --- CONDITIONAL PRICING INPUTS --- */}
                            {newCategory.pricingModel === 'perOccupancy' ? (
                                <>
                                     {/* PER OCCUPANCY PRICING */}
                                    <div className="pt-4 border-t border-gray-300"> <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price, Per Person)</FormLabel> {adultPricingConfig.map(occ => ( <div key={occ.occupancy} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label}</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} showIcon={false} /> </FormLabel> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.baseField}-${mealPlan}`}>Base Price</Label> <Input id={`new-cat-${occ.baseField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[occ.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </FormItem> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${occ.discField}-${mealPlan}`}>Discounted</Label> <Input id={`new-cat-${occ.discField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[occ.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(occ.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </FormItem> </div> ))} </div> </div> ))} </div>
                                    <div className="pt-4 border-t border-gray-300"> <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, sharing)</FormLabel> {childPricingConfig.map(child => ( <div key={child.age} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">Child ({child.age})</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} showIcon={false} /> </FormLabel> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${child.baseField}-${mealPlan}`}>Base Price</Label> <Input id={`new-cat-${child.baseField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[child.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </FormItem> <FormItem> <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-${child.discField}-${mealPlan}`}>Discounted</Label> <Input id={`new-cat-${child.discField}-${mealPlan}`} type="number" value={getPrice(newCategory.pricing[child.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(child.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </FormItem> </div> ))} </div> </div> ))} </div>
                                </>
                            ) : (
                                 // PER UNIT PRICING
                                <>
                                    <div className="pt-4 border-t border-gray-300"> 
                                        <FormLabel className="text-md font-semibold text-gray-700 mb-3 block flex items-center"><Bed className="inline h-5 w-5 mr-2"/>Room/Unit Pricing (Fixed Rate)</FormLabel> 
                                        
                                        <FormItem className="mb-4">
                                            <FormLabel htmlFor={`new-cat-max-occupancy`}>Maximum Occupancy (Adults + Children)</FormLabel>
                                            <Input id={`new-cat-max-occupancy`} type="number" value={newCategory.totalOccupancy} onChange={(e) => handleNewCategoryFieldChange('totalOccupancy', Number(e.target.value))} min={1} max={10} />
                                            <p className="text-xs text-gray-500 mt-1">This rate covers all guests up to this maximum limit.</p>
                                        </FormItem>

                                        <div className="mb-6 p-3 border rounded bg-white/50"> 
                                            <p className="text-sm font-semibold mb-3 text-gray-600">Fixed Price per Unit</p> 
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> 
                                                {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( 
                                                    <div key={mealPlan} className="space-y-2"> 
                                                        <FormLabel className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} showIcon={false} /> </FormLabel> 
                                                        <FormItem> 
                                                            <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-unit-base-${mealPlan}`}>Base Price</Label> 
                                                            <Input id={`new-cat-unit-base-${mealPlan}`} type="number" value={getPrice(newCategory.totalOccupancyPrice, mealPlan)} onChange={(e) => handleNewCategoryPerUnitPricingChange('totalOccupancyPrice', mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> 
                                                        </FormItem> 
                                                        <FormItem> 
                                                            <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-unit-disc-${mealPlan}`}>Discounted</Label> 
                                                            <Input id={`new-cat-unit-disc-${mealPlan}`} type="number" value={getPrice(newCategory.discountedTotalOccupancyPrice, mealPlan) || ''} onChange={(e) => handleNewCategoryPerUnitPricingChange('discountedTotalOccupancyPrice', mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> 
                                                        </FormItem> 
                                                    </div> 
                                                ))} 
                                            </div> 
                                        </div> 
                                    </div>
                                </>
                            )}
                             

                            {/* Seasonal Hike Pricing Inputs (Remains the same, applies to whichever pricing is active) */}
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
                                                        <MealPlanLabel mealPlan={mealPlan} showIcon={false} />
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

                            {/* Category Activities Input (Remains the same) */}
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

                            {/* Category Facilities Input (Remains the same) */}
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

                            <div className="pt-4 border-t border-gray-300">
                                <FormLabel className="text-md font-semibold text-gray-700 mb-2 block flex items-center">
                                    <CalendarDays className="inline h-5 w-5 mr-2"/> Unavailable Periods
                                </FormLabel>
                                <p className="text-xs text-gray-500 mb-3">
                                    Block out specific date ranges when this category cannot be booked.
                                </p>

                                {newCategory.currentUnavailableDates.length > 0 && (
                                    <div className="mb-4 space-y-2">
                                        <Label className="text-sm text-gray-600">Added Unavailable Periods:</Label>
                                        {newCategory.currentUnavailableDates.map((period, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                                <span>{period.startDate} &mdash; {period.endDate}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveUnavailablePeriod(index)}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-unavail-start`}>Start Date</Label>
                                        <Input id={`new-cat-unavail-start`} type="date" value={newCategory.newUnavailablePeriod.startDate} onChange={(e) => handleNewUnavailablePeriodChange('startDate', e.target.value)} />
                                    </FormItem>
                                    <FormItem>
                                        <Label className="text-xs text-muted-foreground" htmlFor={`new-cat-unavail-end`}>End Date</Label>
                                        <Input id={`new-cat-unavail-end`} type="date" value={newCategory.newUnavailablePeriod.endDate} onChange={(e) => handleNewUnavailablePeriodChange('endDate', e.target.value)} />
                                    </FormItem>
                                </div>
                                <Button type="button" variant="outline" onClick={handleAddUnavailablePeriod} size="sm" className="w-full mt-3">
                                    <Plus size={16} className="mr-1" /> Add Unavailable Period
                                </Button>
                            </div>

                            <button type="button" onClick={handleAddCategory} className="flex items-center justify-center w-full py-2.5 bg-[#003c95] text-white rounded-md hover:bg-[#003c95] transition-colors focus:outline-none focus:ring-2 focus:ring-[#003c95] focus:ring-offset-2"> <Plus size={18} className="mr-2" /> Add This Category </button>
                            
                        </div>
                    )}
                </div>
            )}

            {renderSection("Special Offers", ensurePropertyData.offers, 'No special offers are currently available.', Tag)}
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
