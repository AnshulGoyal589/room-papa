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
import { Plus, X, Home, MapPin, DollarSign, BedDouble, ListChecks, ShieldCheck, Users, Baby, Utensils, CalendarOff, Sparkles, Wrench, CalendarDays } from 'lucide-react';
import { categoryOptions } from '../../../../public/assets/data';

import { DiscountedPricingByMealPlan, PricingByMealPlan } from '@/types';

import { HikePricingByOccupancy, RoomCategoryPricing, StoredRoomCategory } from '@/types/booking';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { ExtendedProperty, Image, Period, PropertyFormProps, SeasonalCoasting } from '@/lib/mongodb/models/Components';
import { propertyAmenitiesArray, PropertyType } from '@/types/property';

const generateId = () => Math.random().toString(36).substr(2, 9);

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

const initialNewCategoryState = {
  title: '',
  qty: 1,
  currency: 'INR',
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
  newUnavailableDate: '',
  currentUnavailableDates: [] as string[],
  newAvailabilityPeriod: { startDate: '', endDate: '' },
  currentAvailabilityPeriods: [] as Period[],
  roomSize: '',
  newCategoryActivity: '',
  currentCategoryActivities: [] as string[],
  newCategoryFacility: '',
  currentCategoryFacilities: [] as string[],
  categoryImages: [] as Image[],
  seasonalHike: {
    startDate: '',
    endDate: '',
    hikePricing: initialHikePricingState,
  },
};


const initialPropertyData: ExtendedProperty = {
  type: 'Hotel' as PropertyType,
  location: {
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
  rooms: 0,
  categoryRooms: [],
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


const getPrice = (pricing: Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    return pricing?.[mealPlan] ?? 0;
};

const PropertyForm: React.FC<PropertyFormProps> = ({
  propertyData = initialPropertyData,
  setPropertyData
}) => {
  const [newCategory, setNewCategory] = useState<typeof initialNewCategoryState>(initialNewCategoryState);

useEffect(() => {
    const { costing, rooms, categoryRooms } = propertyData;
    const currentPrice = costing?.price ?? 0;
    const currentDiscountedPrice = costing?.discountedPrice ?? 0;
    const currentCurrency = costing?.currency ?? 'INR';
    const currentRooms = rooms ?? 0;

    if (categoryRooms && categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = 'INR';

      categoryRooms.forEach(cat => {
        const mealPlanPriorities: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

        let categorySinglePrice = 0;
        let categorySingleDiscountedPrice = 0;

        for (const mealPlan of mealPlanPriorities) {
          const singleBase = getPrice(cat.pricing.singleOccupancyAdultPrice, mealPlan);
          const singleDisc = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, mealPlan);

          if (singleBase > 0) {
            categorySinglePrice = singleBase;
            categorySingleDiscountedPrice = singleDisc > 0 ? singleDisc : singleBase;
            break;
          }
        }
        
        if (categorySinglePrice > 0) {
          if (categorySinglePrice < minOverallPrice) {
            minOverallPrice = categorySinglePrice;
            leadCurrency = cat.currency;
          }
          if (categorySingleDiscountedPrice < minOverallDiscountedPrice) {
            minOverallDiscountedPrice = categorySingleDiscountedPrice;
          }
        }
      });

      const newTotalRooms = categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);
      const newPrice = minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2));
      const newDiscountedPrice = minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2));
      
      if (
        newTotalRooms !== currentRooms ||
        newPrice !== currentPrice ||
        newDiscountedPrice !== currentDiscountedPrice ||
        leadCurrency !== currentCurrency
      ) {
        setPropertyData(prev => ({
          ...prev,
          costing: {
            price: newPrice,
            discountedPrice: newDiscountedPrice,
            currency: leadCurrency
          },
          rooms: newTotalRooms
        }));
      }
    } else {
      // Reset if no categoryRooms are present
      if (currentPrice !== 0 || currentDiscountedPrice !== 0 || currentRooms !== 0) {
        setPropertyData(prev => ({
          ...prev,
          costing: { price: 0, discountedPrice: 0, currency: 'INR' },
          rooms: 0
        }));
      }
    }
  }, [propertyData, setPropertyData]);


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
        alert("Both Start Date and End Date are required.");
        return;
    }
    if (new Date(endDate) < new Date(startDate)) {
        alert('End Date cannot be before Start Date.');
        return;
    }
    setNewCategory(prev => ({
        ...prev,
        currentAvailabilityPeriods: [...prev.currentAvailabilityPeriods, { startDate, endDate }],
        newAvailabilityPeriod: { startDate: '', endDate: '' } // Reset input
    }));
  };

  const handleRemoveAvailabilityPeriod = (indexToRemove: number) => {
    setNewCategory(prev => ({
        ...prev,
        currentAvailabilityPeriods: prev.currentAvailabilityPeriods.filter((_, index) => index !== indexToRemove)
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

  const handlePropertyChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPropertyData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setPropertyData(prev => ({ ...prev, [field]: value as ExtendedProperty[keyof ExtendedProperty] }));
    }
  };

  const toggleArrayItem = (field: keyof ExtendedProperty, item: string) => {
    const currentArray = (propertyData[field] as string[] | undefined) || [];
    if (currentArray.includes(item)) {
      handlePropertyChange(field, currentArray.filter(i => i !== item));
    } else {
      handlePropertyChange(field, [...currentArray, item]);
    }
  };

  const handleRemoveItem = (field: keyof ExtendedProperty, item: string) => {
    const currentArray = (propertyData[field] as string[] | undefined) || [];
    handlePropertyChange(field, currentArray.filter(i => i !== item));
  };

  const handleNewCategoryFieldChange = (field: keyof typeof newCategory, value: string | number) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };

  const handleNewCategoryImagesChange = (images: Image[]) => {
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
          const updatedPricing = { ...prev.pricing };
          const targetPriceGroup = updatedPricing[priceField];
          if (targetPriceGroup) {
              (targetPriceGroup as PricingByMealPlan)[mealPlan] = safeValue;
          } else {
              updatedPricing[priceField] = {
                noMeal: mealPlan === 'noMeal' ? safeValue : 0,
                breakfastOnly: mealPlan === 'breakfastOnly' ? safeValue : 0,
                allMeals: mealPlan === 'allMeals' ? safeValue : 0,
              } as PricingByMealPlan;
          }
          return { ...prev, pricing: updatedPricing };
      });
  };

  const handleNewUnavailableDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCategory(prev => ({ ...prev, newUnavailableDate: e.target.value }));
  };

  const handleAddUnavailableDate = () => {
    const dateToAdd = newCategory.newUnavailableDate;
    if (dateToAdd && !newCategory.currentUnavailableDates.includes(dateToAdd)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToAdd)) {
            alert("Please select a valid date in YYYY-MM-DD format."); return;
        }
        setNewCategory(prev => ({
            ...prev,
            currentUnavailableDates: [...prev.currentUnavailableDates, dateToAdd].sort(),
            newUnavailableDate: ''
        }));
    } else if (newCategory.currentUnavailableDates.includes(dateToAdd)) {
        alert("This date is already marked as unavailable.");
    } else {
        alert("Please select a date to add.");
    }
  };

  const handleRemoveUnavailableDate = (dateToRemove: string) => {
      setNewCategory(prev => ({
          ...prev,
          currentUnavailableDates: prev.currentUnavailableDates.filter(d => d !== dateToRemove)
      }));
  };

  const handleAddCategoryActivity = () => {
    const activityToAdd = newCategory.newCategoryActivity.trim();
    if (activityToAdd && !newCategory.currentCategoryActivities.includes(activityToAdd)) {
        setNewCategory(prev => ({
            ...prev,
            currentCategoryActivities: [...prev.currentCategoryActivities, activityToAdd],
            newCategoryActivity: ''
        }));
    } else if (newCategory.currentCategoryActivities.includes(activityToAdd)) {
        alert("This activity is already added.");
    }
  };

  const handleRemoveCategoryActivity = (activityToRemove: string) => {
      setNewCategory(prev => ({
          ...prev,
          currentCategoryActivities: prev.currentCategoryActivities.filter(a => a !== activityToRemove)
      }));
  };

  const handleAddCategoryFacility = () => {
    const facilityToAdd = newCategory.newCategoryFacility.trim();
    if (facilityToAdd && !newCategory.currentCategoryFacilities.includes(facilityToAdd)) {
        setNewCategory(prev => ({
            ...prev,
            currentCategoryFacilities: [...prev.currentCategoryFacilities, facilityToAdd],
            newCategoryFacility: ''
        }));
    } else if (newCategory.currentCategoryFacilities.includes(facilityToAdd)) {
        alert("This facility is already added.");
    }
  };

  const handleRemoveCategoryFacility = (facilityToRemove: string) => {
      setNewCategory(prev => ({
          ...prev,
          currentCategoryFacilities: prev.currentCategoryFacilities.filter(f => f !== facilityToRemove)
      }));
  };

  const handleAddCategory = () => {
    if (!newCategory.title.trim()) { alert('Category title is required.'); return; }
    if (newCategory.qty <= 0) { alert('Quantity must be greater than 0.'); return; }
    if (newCategory.categoryImages.length < 3) { alert('Please upload at least 3 images for the category.'); return; }
    if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
        alert('Base Price for 1 Adult (No Meal) must be greater than 0.'); return;
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
                const base = getPrice(basePrices as PricingByMealPlan, mealPlan);
                const disc = getPrice(discountPrices as DiscountedPricingByMealPlan, mealPlan);
                if (disc > 0 && base > 0 && disc > base) {
                    alert(`Discounted price for ${field} (${mealPlan}) cannot be greater than base price.`); return;
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
      roomSize: newCategory.roomSize || "Unknown",
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: JSON.parse(JSON.stringify(newCategory.pricing)),
      unavailableDates: [...newCategory.currentUnavailableDates],
      categoryImages: [...newCategory.categoryImages],
      availability: [...newCategory.currentAvailabilityPeriods],
      categoryActivities: [...newCategory.currentCategoryActivities],
      categoryFacilities: [...newCategory.currentCategoryFacilities],
      seasonalHike: seasonalHikeToAdd,
    };

    const updatedCategories = [...(propertyData.categoryRooms || []), categoryToAdd];
    handlePropertyChange('categoryRooms', updatedCategories);
    setNewCategory(initialNewCategoryState);
  };

  const handleRemoveCategory = (id: string) => {
    const updatedCategories = (propertyData.categoryRooms || []).filter(cat => cat.id !== id);
    handlePropertyChange('categoryRooms', updatedCategories);
  };

  const renderMultiSelect = (field: keyof ExtendedProperty, label: string, IconComponent?: React.ElementType) => {
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

   const ensurePropertyData: ExtendedProperty = {
    ...initialPropertyData,
    ...propertyData,
    location: { ...initialPropertyData.location, ...(propertyData?.location || {}) },
    categoryRooms: propertyData?.categoryRooms || [],
    amenities: propertyData?.amenities || [],
  };

  const totalRooms = ensurePropertyData?.categoryRooms?.reduce((sum, category) => sum + (category.qty || 0), 0);

  const SectionHeader: React.FC<{ title: string; icon?: React.ElementType; className?: string }> = ({ title, icon: Icon, className }) => (
    <div className={`flex items-center mb-4 ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
      <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
  );

  const MealPlanLabel: React.FC<{ mealPlan: keyof PricingByMealPlan }> = ({ mealPlan }) => {
      switch(mealPlan) {
          case 'noMeal': return <span className="text-xs font-medium text-gray-500">(Room Only)</span>;
          case 'breakfastOnly': return <span className="text-xs font-medium text-[#003c95]">(+ Breakfast)</span>;
          case 'allMeals': return <span className="text-xs font-medium text-green-600">(+ All Meals)</span>;
          default: return null;
      }
  }

  const ChipList: React.FC<{ items: string[]; onRemove?: (item: string) => void; noRemove?: boolean, colorClass?: string }> = ({ items, onRemove, noRemove, colorClass = "bg-muted text-muted-foreground" }) => {
      if (!items || items.length === 0) return null;
      return (
          <div className="flex flex-wrap gap-1.5 mt-1">
              {items.map(item => (
                  <div key={item} className={`flex items-center ${colorClass} rounded px-2 py-0.5 text-xs`}>
                      <span>{item}</span>
                      {!noRemove && onRemove && (
                          <button
                              type="button"
                              onClick={() => onRemove(item)}
                              className="ml-1.5 text-muted-foreground hover:text-destructive transition-colors"
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
  return (
    <div className="space-y-8  overflow-y-auto p-1 pr-4">
      <div className="space-y-4">
        <SectionHeader title="Property Details" icon={Home} />
        {/* Basic Property Info: Type, Title, Description, Rating, Maps */}
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
              <SelectItem value="Cottage">Cottage</SelectItem>
              <SelectItem value="Homestay">Homestay</SelectItem>
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

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Location" icon={MapPin} />
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
      </div>

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
          {(ensurePropertyData?.categoryRooms ?? []).length > 0 && (
            <FormItem>
              <FormLabel>Property Starting Price (per adult)</FormLabel>
              <div className="p-3 border rounded-md bg-muted text-muted-foreground">
                {ensurePropertyData.costing.currency} {ensurePropertyData.costing.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                {ensurePropertyData.costing.discountedPrice > 0 && ensurePropertyData.costing.discountedPrice < ensurePropertyData.costing.price && (
                  <span className="ml-2 text-green-600 font-semibold">
                    (From: {ensurePropertyData.costing.currency} {ensurePropertyData.costing.discountedPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})
                  </span>
                )}
                <p className="text-xs mt-1">(Lowest effective per-adult price across all categories & meal plans)</p>
              </div>
            </FormItem>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Manage Room Categories" icon={BedDouble} />
        {(ensurePropertyData.categoryRooms ?? []).length > 0 && (
          <div className="mb-6 space-y-4">
            <h4 className="text-md font-medium text-foreground">Added Categories:</h4>
            {(ensurePropertyData.categoryRooms ?? []).map((cat) => (
              <div key={cat.id} className="p-4 bg-muted/50 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground text-lg">{cat.title} <span className="text-sm text-muted-foreground">({cat.qty} rooms)</span></p>
                    <p className="text-xs text-muted-foreground">Currency: {cat.currency}</p>
                  </div>
                  <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveCategory(cat.id)} className="text-destructive hover:text-destructive/80 -mt-2 -mr-2" aria-label={`Remove ${cat.title}`}>
                    <X size={18} />
                  </Button>
                </div>
 
                {/* Availability Period Display */}
                {cat.availability && cat.availability.length > 0 && (
                    <div className="text-sm mb-2 pt-2 border-t mt-2">
                        <p className="font-medium flex items-center"><CalendarDays className="inline h-4 w-4 mr-1 text-primary"/>Availability Periods:</p>
                        <ul className="pl-5 text-xs text-muted-foreground list-disc list-inside">
                            {cat.availability.map((period, index) => (
                                <li key={index}>
                                    {new Date(period.startDate).toLocaleDateString()} to {new Date(period.endDate).toLocaleDateString()}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-3 text-sm border-t pt-3">
                  <p className="font-medium flex items-center"><Users className="inline h-4 w-4 mr-1 text-primary"/>Adult Pricing (Total Room Price):</p>
                  <div className="pl-4 space-y-1">
                    {[
                        { label: '1 Adult', base: cat.pricing.singleOccupancyAdultPrice, disc: cat.pricing.discountedSingleOccupancyAdultPrice },
                        { label: '2 Adults', base: cat.pricing.doubleOccupancyAdultPrice, disc: cat.pricing.discountedDoubleOccupancyAdultPrice },
                        { label: '3 Adults', base: cat.pricing.tripleOccupancyAdultPrice, disc: cat.pricing.discountedTripleOccupancyAdultPrice },
                    ].map(p => (
                        <div key={p.label}>
                          <strong>{p.label}:</strong>
                          {['noMeal', 'breakfastOnly', 'allMeals'].map(mp => {
                              const mealKey = mp as keyof PricingByMealPlan;
                              const basePrice = getPrice(p.base, mealKey);
                              const discPrice = getPrice(p.disc, mealKey);
                              if (basePrice > 0 || discPrice > 0) {
                                  return (
                                      <span key={mealKey} className="ml-2">
                                          <MealPlanLabel mealPlan={mealKey} /> {cat.currency} {basePrice}
                                          {discPrice > 0 && discPrice < basePrice ? ` (Disc: ${discPrice})` : ''}
                                      </span>
                                  )
                              } return null;
                            })}
                        </div>
                    ))}
                  </div>

                  <p className="font-medium flex items-center pt-2"><Baby className="inline h-4 w-4 mr-1 text-primary"/>Child Pricing (Per Child, Sharing):</p>
                   {/* ... (child pricing display as before) ... */}
                  <div className="pl-4 space-y-1">
                     {[ { label: 'Child (5-12 yrs)', base: cat.pricing.child5to12Price, disc: cat.pricing.discountedChild5to12Price } ].map(p => (
                         <div key={p.label}>
                           <strong>{p.label}:</strong>
                           {['noMeal', 'breakfastOnly', 'allMeals'].map(mp => {
                              const mealKey = mp as keyof PricingByMealPlan;
                              const basePrice = getPrice(p.base, mealKey);
                              const discPrice = getPrice(p.disc, mealKey);
                               if (basePrice > 0 || discPrice > 0) {
                                  return ( <span key={mealKey} className="ml-2"> <MealPlanLabel mealPlan={mealKey} /> {cat.currency} {basePrice} {discPrice > 0 && discPrice < basePrice ? ` (Disc: ${discPrice})` : ''}</span> )
                              } return null;
                            })}
                         </div>
                     ))}
                     <p className="text-xs text-muted-foreground italic">Children below 5: Free (implicitly)</p>
                  </div>
                </div>

                {/* Seasonal Hike Display */}
                {cat.seasonalHike && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="font-medium text-sm flex items-center"><DollarSign className="inline h-4 w-4 mr-1 text-blue-500"/>Seasonal Price Hike:</p>
                        <p className="pl-5 text-xs text-muted-foreground font-semibold">
                            Period: {new Date(cat.seasonalHike.startDate).toLocaleDateString()} - {new Date(cat.seasonalHike.endDate).toLocaleDateString()}
                        </p>
                        <div className="pl-5 mt-1 text-xs space-y-1">
                            {[
                                { label: '1 Adult', hike: cat.seasonalHike.hikePricing.singleOccupancyAdultHike },
                                { label: '2 Adults', hike: cat.seasonalHike.hikePricing.doubleOccupancyAdultHike },
                                { label: '3 Adults', hike: cat.seasonalHike.hikePricing.tripleOccupancyAdultHike },
                            ].map(occ => {
                                const hasHikePrice = Object.values(occ.hike).some(price => price > 0);
                                if (!hasHikePrice) return null;
                                return (
                                    <div key={occ.label}>
                                        <strong>{occ.label}:</strong>
                                        {['noMeal', 'breakfastOnly', 'allMeals'].map(mp => {
                                            const mealKey = mp as keyof PricingByMealPlan;
                                            const hikePrice = getPrice(occ.hike, mealKey);
                                            if (hikePrice > 0) {
                                                return (
                                                    <span key={mealKey} className="ml-2 text-blue-600 font-medium">
                                                        <MealPlanLabel mealPlan={mealKey} /> +{cat.currency} {hikePrice}
                                                    </span>
                                                )
                                            } return null;
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Category Activities Display */}
                {cat.categoryActivities && cat.categoryActivities.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="font-medium text-sm flex items-center"><Sparkles className="inline h-4 w-4 mr-1 text-yellow-500"/>Category Activities:</p>
                        <ChipList items={cat.categoryActivities} noRemove colorClass="bg-yellow-100 text-yellow-700"/>
                    </div>
                )}
                {/* Category Facilities Display */}
                {cat.categoryFacilities && cat.categoryFacilities.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="font-medium text-sm flex items-center"><Wrench className="inline h-4 w-4 mr-1 text-[#003c95]"/>Category Facilities:</p>
                        <ChipList items={cat.categoryFacilities} noRemove colorClass="bg-[#003c95] text-[#003c95]"/>
                    </div>
                )}

                 {cat.unavailableDates.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                       <p className="font-medium text-sm flex items-center"><CalendarOff className="inline h-4 w-4 mr-1 text-destructive"/>Unavailable Dates:</p>
                       <ChipList items={cat.unavailableDates} noRemove colorClass="bg-destructive/10 text-destructive"/>
                    </div>
                 )}
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-muted/30 border rounded-lg space-y-6">
          <h4 className="text-md font-medium text-foreground">Add New Room Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem className="md:col-span-1"> <FormLabel>Category Title</FormLabel> <Input value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Room" /> </FormItem>
            <FormItem> <FormLabel>Quantity (Rooms)</FormLabel> <Input type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} /> </FormItem>
            <FormItem> <FormLabel>Currency</FormLabel> <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}> <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['INR', 'EUR', 'GBP', 'USD', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </FormItem>
          </div>

          <div className="pt-4 border-t">
            <MultipleImageUpload
              label="Category Images"
              value={newCategory.categoryImages}
              onChange={handleNewCategoryImagesChange}
              minImages={3}
              maxImages={10}
            />
          </div>

          {/* Availability Period */}
          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center">
                <CalendarDays className="inline h-5 w-5 mr-2 text-primary" /> Availability Periods (Optional)
                </FormLabel>
                <p className="text-xs text-muted-foreground mb-4">
                    If no periods are added, the category is considered always available (unless blocked by unavailable dates).
                </p>

                {newCategory.currentAvailabilityPeriods.length > 0 && (
                    <div className="mb-4 space-y-2">
                        <FormLabel className="text-sm">Added Periods:</FormLabel>
                        {newCategory.currentAvailabilityPeriods.map((period, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-sm">
                                <span>{period.startDate} &mdash; {period.endDate}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAvailabilityPeriod(index)}>
                                    <X size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Start Date</FormLabel>
                        <Input type="date" value={newCategory.newAvailabilityPeriod.startDate} onChange={(e) => handleNewAvailabilityPeriodChange('startDate', e.target.value)} />
                    </FormItem>
                    <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">End Date</FormLabel>
                        <Input type="date" value={newCategory.newAvailabilityPeriod.endDate} onChange={(e) => handleNewAvailabilityPeriodChange('endDate', e.target.value)} />
                    </FormItem>
                </div>
                <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full mt-3">
                    <Plus size={16} className="mr-1" /> Add Availability Period
                </Button>
            </div>


          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2 text-primary" />Adult Pricing (Total Room Price)</FormLabel>
             {[
              { occupancy: 1, baseField: 'singleOccupancyAdultPrice', discField: 'discountedSingleOccupancyAdultPrice', label: '1 Adult' },
              { occupancy: 2, baseField: 'doubleOccupancyAdultPrice', discField: 'discountedDoubleOccupancyAdultPrice', label: '2 Adults' },
              { occupancy: 3, baseField: 'tripleOccupancyAdultPrice', discField: 'discountedTripleOccupancyAdultPrice', label: '3 Adults' },
            ].map(occ => (
                <div key={occ.occupancy} className="mb-6 p-3 border rounded bg-background/50">
                   <p className="text-sm font-semibold mb-3">{occ.label}</p>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                           <div key={mealPlan} className="space-y-2">
                                <FormLabel className="text-xs font-medium flex items-center"> <Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} </FormLabel>
                                <FormItem> <Label className="text-xs text-muted-foreground">Base Price</Label> <Input type="number" value={getPrice(newCategory.pricing[occ.baseField as keyof RoomCategoryPricing], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.baseField as keyof RoomCategoryPricing, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01"/> </FormItem>
                                <FormItem> <Label className="text-xs text-muted-foreground">Discounted</Label> <Input type="number" value={getPrice(newCategory.pricing[occ.discField as keyof RoomCategoryPricing], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.discField as keyof RoomCategoryPricing, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01"/> </FormItem>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2 text-primary" />Child Pricing (Per Child, when sharing)</FormLabel>
            <p className="text-xs text-muted-foreground mb-3">Apply if children share room with adults. Children below 5 usually free.</p>
             {[ { age: '5-12 yrs', baseField: 'child5to12Price', discField: 'discountedChild5to12Price' } ].map(child => (
                <div key={child.age} className="mb-6 p-3 border rounded bg-background/50">
                   <p className="text-sm font-semibold mb-3">Child ({child.age})</p>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                           <div key={mealPlan} className="space-y-2">
                                <FormLabel className="text-xs font-medium flex items-center"> <Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} </FormLabel>
                                <FormItem> <Label className="text-xs text-muted-foreground">Base Price</Label> <Input type="number" value={getPrice(newCategory.pricing[child.baseField as keyof RoomCategoryPricing], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.baseField as keyof RoomCategoryPricing, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01"/> </FormItem>
                                <FormItem> <Label className="text-xs text-muted-foreground">Discounted</Label> <Input type="number" value={getPrice(newCategory.pricing[child.discField as keyof RoomCategoryPricing], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.discField as keyof RoomCategoryPricing, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01"/> </FormItem>
                            </div>
                        ))}
                    </div>
                </div>
             ))}
          </div>

          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><DollarSign className="inline h-5 w-5 mr-2 text-primary" />Seasonal Price Hike (Optional)</FormLabel>
            <p className="text-xs text-muted-foreground mb-4">Add a surcharge for specific high-demand dates. Leave dates blank to disable.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Hike Start Date</FormLabel>
                    <Input type="date" value={newCategory.seasonalHike.startDate}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, seasonalHike: { ...prev.seasonalHike, startDate: e.target.value } }))}
                    />
                </FormItem>
                <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Hike End Date</FormLabel>
                    <Input type="date" value={newCategory.seasonalHike.endDate}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, seasonalHike: { ...prev.seasonalHike, endDate: e.target.value } }))}
                    />
                </FormItem>
            </div>
            
            {hikePricingConfig.map(occ => (
                <div key={occ.field} className="mt-4 p-3 border rounded bg-background/50">
                    <p className="text-sm font-semibold mb-3">{occ.label} (Additional Hike Price)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                            <div key={mealPlan} className="space-y-2">
                                <FormLabel className="text-xs font-medium flex items-center">
                                    <Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </FormLabel>
                                <FormItem>
                                    <Label className="text-xs text-muted-foreground">Hike Amount</Label>
                                    <Input
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
          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Sparkles className="inline h-5 w-5 mr-2 text-primary" />Category Activities</FormLabel>
            <div className="flex flex-col md:flex-row gap-2 items-start">
                <Input
                    value={newCategory.newCategoryActivity}
                    onChange={(e) => handleNewCategoryFieldChange('newCategoryActivity', e.target.value)}
                    placeholder="e.g., Guided Tour, Cooking Class"
                    className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={handleAddCategoryActivity} size="sm" className="w-full md:w-auto">
                    <Plus size={16} className="mr-1" /> Add Activity
                </Button>
            </div>
            <ChipList items={newCategory.currentCategoryActivities} onRemove={handleRemoveCategoryActivity} />
          </div>

          {/* Category Facilities Input */}
          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Wrench className="inline h-5 w-5 mr-2 text-primary" />Category Facilities</FormLabel>
            <div className="flex flex-col md:flex-row gap-2 items-start">
                <Input
                    value={newCategory.newCategoryFacility}
                    onChange={(e) => handleNewCategoryFieldChange('newCategoryFacility', e.target.value)}
                    placeholder="e.g., Private Balcony, Jacuzzi"
                    className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={handleAddCategoryFacility} size="sm" className="w-full md:w-auto">
                    <Plus size={16} className="mr-1" /> Add Facility
                </Button>
            </div>
            <ChipList items={newCategory.currentCategoryFacilities} onRemove={handleRemoveCategoryFacility} />
          </div>


          <div className="pt-4 border-t">
             <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><CalendarOff className="inline h-5 w-5 mr-2 text-primary" />Mark Unavailable Dates (for this category)</FormLabel>
             <div className="flex flex-col md:flex-row gap-2 items-start">
                 <FormItem className="flex-grow"> <Input type="date" value={newCategory.newUnavailableDate} onChange={handleNewUnavailableDateChange} className="w-full md:w-auto"/> </FormItem>
                 <Button type="button" variant="outline" onClick={handleAddUnavailableDate} size="sm" className="w-full md:w-auto"> <Plus size={16} className="mr-1" /> Add Date </Button>
             </div>
             <ChipList items={newCategory.currentUnavailableDates} onRemove={handleRemoveUnavailableDate} />
          </div>

          <Button type="button" onClick={handleAddCategory} className="w-full mt-6">
            <Plus size={18} className="mr-2" /> Add This Room Category
          </Button>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Property Amenities" icon={ListChecks} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3">
          {propertyAmenitiesArray.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox id={`amenity-${amenity}`} checked={(ensurePropertyData.amenities || []).includes(amenity)}
                onCheckedChange={(checked) => {
                  const currentAmenities = ensurePropertyData.amenities || [];
                  if (checked) { handlePropertyChange('amenities', [...currentAmenities, amenity]); }
                  else { handlePropertyChange('amenities', currentAmenities.filter(a => a !== amenity)); }
                }} />
              <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal capitalize cursor-pointer"> {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications & Features" icon={ShieldCheck} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderMultiSelect('accessibility', 'Property Accessibility')}
          {renderMultiSelect('roomAccessibility', 'Room Accessibility Features')}
          {renderMultiSelect('popularFilters', 'Popular Filters/Tags')}
          {renderMultiSelect('funThingsToDo', 'Nearby Fun & Activities')}
          {renderMultiSelect('meals', 'Meal Options Available (Property Wide)')}
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