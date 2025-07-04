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
import { Plus, X, Home, MapPin, DollarSign, BedDouble, ListChecks, ShieldCheck, Users, Baby, Utensils, CalendarOff, Sparkles, Wrench, CalendarDays } from 'lucide-react'; // Added Sparkles, Wrench, CalendarDays
import { Property } from '@/lib/mongodb/models/Property'; // Assuming this is your base Property type
import { categoryOptions } from '../../../../public/assets/data';

import { DiscountedPricingByMealPlan, PricingByMealPlan, PropertyType } from '@/types'; // Assuming these are correctly defined


// Ensure Property type reflects the changes (no top-level start/end dates)
// Using your provided ExtendedProperty interface
import { ObjectId } from "mongodb"; // Assuming you have mongodb installed or use a mock
import { RoomCategoryPricing, StoredRoomCategory } from '@/types/booking';
// Mock Image type if not available
// interface Image { url: string; public_id: string; }

export interface ExtendedProperty extends Omit<Property, 'categoryRooms' | 'costing' | 'rooms' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
    _id?: ObjectId;
    type: PropertyType;
    location: {
        address: string;
        state: string;
        city: string;
        country: string;
    };
    costing: {
        price: number;
        discountedPrice: number;
        currency: string;
    };
    rooms: number;
    categoryRooms: StoredRoomCategory[]; // Uses the updated StoredRoomCategory
    amenities: string[];
    accessibility?: string[];
    roomAccessibility?: string[];
    popularFilters?: string[];
    funThingsToDo?: string[];
    meals?: string[];
    facilities?: string[];
    bedPreference?: string[];
    reservationPolicy?: string[];
    brands?: string[];
    roomFacilities?: string[];
    propertyRating?: number;
    googleMaps?: string;

    // These were in your provided ExtendedProperty, ensure they are intended
    // If these are top-level and distinct from category availability, they can remain
    startDate?: string;
    endDate?: string;
    createdAt?: Date;
    updatedAt?: Date;
    userId?: string;
    title?: string;
    description?: string;
    totalRating?: number;
    review?: {
        userId?: string;
        userName?: string;
        comment: string;
        rating: number;
        createdAt?: Date;
    }[];
    // bannerImage?: Image;
    // detailImages?: Image[];
}
// --- END MOCK TYPES ---


// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state for the form to add a new room category
const initialNewCategoryState = {
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
  newUnavailableDate: '',
  currentUnavailableDates: [] as string[],
  // New fields for availability, activities, facilities
  availabilityStartDate: '',
  availabilityEndDate: '',
  newCategoryActivity: '',
  currentCategoryActivities: [] as string[],
  newCategoryFacility: '',
  currentCategoryFacilities: [] as string[],
};


// Create a default/initial state for PropertyData
const initialPropertyData: ExtendedProperty = {
  type: 'Hotel' as PropertyType, // Adjusted default type
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
  },
  costing: {
    price: 0,
    discountedPrice: 0,
    currency: 'USD',
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

interface PropertyFormProps {
  propertyData: ExtendedProperty;
  setPropertyData: React.Dispatch<React.SetStateAction<ExtendedProperty>>;
}

const getPrice = (pricing: Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    return pricing?.[mealPlan] ?? 0;
};

const PropertyForm: React.FC<PropertyFormProps> = ({
  propertyData = initialPropertyData,
  setPropertyData
}) => {
  const [newCategory, setNewCategory] = useState<{
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing;
    newUnavailableDate: string;
    currentUnavailableDates: string[];
    availabilityStartDate: string;
    availabilityEndDate: string;
    newCategoryActivity: string;
    currentCategoryActivities: string[];
    newCategoryFacility: string;
    currentCategoryFacilities: string[];
  }>(initialNewCategoryState);

  // useEffect(() => {
  //   if (propertyData.categoryRooms && propertyData.categoryRooms.length > 0) {
  //     let minOverallPrice = Infinity;
  //     let minOverallDiscountedPrice = Infinity;
  //     let leadCurrency = propertyData.categoryRooms[0].currency || 'USD';

  //     propertyData.categoryRooms.forEach(cat => {
  //       // Note: This calculation does not currently factor in category availability dates.
  //       // It reflects the lowest possible price if the category *were* available.
  //       const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];
  //       const categoryPricesPerAdult: number[] = [];
  //       const categoryDiscountedPricesPerAdult: number[] = [];

  //       mealPlans.forEach(mealPlan => {
  //           const singleBase = getPrice(cat.pricing.singleOccupancyAdultPrice, mealPlan);
  //           const singleDisc = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, mealPlan);
  //           if (singleBase > 0) categoryPricesPerAdult.push(singleBase);
  //           if (singleDisc > 0) categoryDiscountedPricesPerAdult.push(singleDisc);
  //           else if (singleBase > 0) categoryDiscountedPricesPerAdult.push(singleBase);

  //           const doubleBase = getPrice(cat.pricing.doubleOccupancyAdultPrice, mealPlan);
  //           const doubleDisc = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, mealPlan);
  //           if (doubleBase > 0) categoryPricesPerAdult.push(doubleBase / 2);
  //           if (doubleDisc > 0) categoryDiscountedPricesPerAdult.push(doubleDisc / 2);
  //           else if (doubleBase > 0) categoryDiscountedPricesPerAdult.push(doubleBase / 2);

  //           const tripleBase = getPrice(cat.pricing.tripleOccupancyAdultPrice, mealPlan);
  //           const tripleDisc = getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, mealPlan);
  //           if (tripleBase > 0) categoryPricesPerAdult.push(tripleBase / 3);
  //           if (tripleDisc > 0) categoryDiscountedPricesPerAdult.push(tripleDisc / 3);
  //           else if (tripleBase > 0) categoryDiscountedPricesPerAdult.push(tripleBase / 3);
  //       });
        
  //       const currentCatMinPrice = Math.min(...categoryPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);
  //       const currentCatMinDiscountedPrice = Math.min(...categoryDiscountedPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);

  //       if (currentCatMinPrice < minOverallPrice) {
  //         minOverallPrice = currentCatMinPrice;
  //         leadCurrency = cat.currency;
  //       }
  //       if (currentCatMinDiscountedPrice < minOverallDiscountedPrice) {
  //         minOverallDiscountedPrice = currentCatMinDiscountedPrice;
  //       }
  //     });

  //     const totalRooms = propertyData.categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);

  //     setPropertyData(prev => ({
  //       ...prev,
  //       costing: {
  //         price: minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2)),
  //         discountedPrice: minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2)),
  //         currency: leadCurrency
  //       },
  //       rooms: totalRooms
  //     }));
  //   } else {
  //     setPropertyData(prev => ({
  //       ...prev,
  //       costing: { price: 0, discountedPrice: 0, currency: 'USD' },
  //       rooms: 0
  //     }));
  //   }
  // }, [propertyData.categoryRooms, propertyData.costing, propertyData.rooms , setPropertyData]);


  // Replace this entire useEffect block in your code
useEffect(() => {
    // Get the current summary values from the propertyData prop
    const { costing, rooms, categoryRooms } = propertyData;
    const currentPrice = costing?.price ?? 0;
    const currentDiscountedPrice = costing?.discountedPrice ?? 0;
    const currentCurrency = costing?.currency ?? 'USD';
    const currentRooms = rooms ?? 0;

    if (categoryRooms && categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = categoryRooms[0].currency || 'USD';

      categoryRooms.forEach(cat => {
        const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];
        const categoryPricesPerAdult: number[] = [];
        const categoryDiscountedPricesPerAdult: number[] = [];

        mealPlans.forEach(mealPlan => {
            const singleBase = getPrice(cat.pricing.singleOccupancyAdultPrice, mealPlan);
            const singleDisc = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, mealPlan);
            if (singleBase > 0) categoryPricesPerAdult.push(singleBase);
            if (singleDisc > 0) categoryDiscountedPricesPerAdult.push(singleDisc);
            else if (singleBase > 0) categoryDiscountedPricesPerAdult.push(singleBase);

            const doubleBase = getPrice(cat.pricing.doubleOccupancyAdultPrice, mealPlan);
            const doubleDisc = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, mealPlan);
            if (doubleBase > 0) categoryPricesPerAdult.push(doubleBase / 2);
            if (doubleDisc > 0) categoryDiscountedPricesPerAdult.push(doubleDisc / 2);
            else if (doubleBase > 0) categoryDiscountedPricesPerAdult.push(doubleBase / 2);

            const tripleBase = getPrice(cat.pricing.tripleOccupancyAdultPrice, mealPlan);
            const tripleDisc = getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, mealPlan);
            if (tripleBase > 0) categoryPricesPerAdult.push(tripleBase / 3);
            if (tripleDisc > 0) categoryDiscountedPricesPerAdult.push(tripleDisc / 3);
            else if (tripleBase > 0) categoryDiscountedPricesPerAdult.push(tripleBase / 3);
        });
        
        const currentCatMinPrice = Math.min(...categoryPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);
        const currentCatMinDiscountedPrice = Math.min(...categoryDiscountedPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);

        if (currentCatMinPrice < minOverallPrice) {
          minOverallPrice = currentCatMinPrice;
          leadCurrency = cat.currency;
        }
        if (currentCatMinDiscountedPrice < minOverallDiscountedPrice) {
          minOverallDiscountedPrice = currentCatMinDiscountedPrice;
        }
      });

      const newTotalRooms = categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);
      const newPrice = minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2));
      const newDiscountedPrice = minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2));
      
      // *** THE FIX: Only update state if the calculated values have changed ***
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
      // Handle the case with no rooms: reset if necessary
      if (currentPrice !== 0 || currentDiscountedPrice !== 0 || currentRooms !== 0) {
        setPropertyData(prev => ({
          ...prev,
          costing: { price: 0, discountedPrice: 0, currency: 'USD' },
          rooms: 0
        }));
      }
    }
    // *** THE FIX: Update dependency array to include all compared values ***
  }, [propertyData.categoryRooms, propertyData.costing, propertyData.rooms, setPropertyData]);

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

  // Handlers for category-specific activities
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

  // Handlers for category-specific facilities
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
    if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
        alert('Base Price for 1 Adult (No Meal) must be greater than 0.'); return;
    }

    // Date validation for availability period
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
                const base = getPrice(basePrices as PricingByMealPlan, mealPlan);
                const disc = getPrice(discountPrices as DiscountedPricingByMealPlan, mealPlan);
                if (disc > 0 && base > 0 && disc > base) {
                    alert(`Discounted price for ${field} (${mealPlan}) cannot be greater than base price.`); return;
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
      unavailableDates: [...newCategory.currentUnavailableDates],
      // Add new fields
      availabilityStartDate: newCategory.availabilityStartDate || undefined, // Store as undefined if empty
      availabilityEndDate: newCategory.availabilityEndDate || undefined, // Store as undefined if empty
      categoryActivities: [...newCategory.currentCategoryActivities],
      categoryFacilities: [...newCategory.currentCategoryFacilities],
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
          case 'breakfastOnly': return <span className="text-xs font-medium text-blue-600">(+ Breakfast)</span>;
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
    <div className="space-y-8 max-h-[75vh] overflow-y-auto p-1 pr-4">
      <div className="space-y-4">
        <SectionHeader title="Property Details" icon={Home} />
        {/* Basic Property Info: Type, Title, Description, Rating, Maps */}
        {/* <FormItem>
            <FormLabel>Property Title</FormLabel>
            <Input
                value={ensurePropertyData.title || ''}
                onChange={(e) => handlePropertyChange('title', e.target.value)}
                placeholder="e.g., The Grand Hotel"
            />
        </FormItem>
        <FormItem>
            <FormLabel>Property Description</FormLabel>
            <Input // Or use Textarea from shadcn
                value={ensurePropertyData.description || ''}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                placeholder="Brief description of the property"
            />
        </FormItem> */}
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
                {(cat.availabilityStartDate || cat.availabilityEndDate) && (
                    <div className="text-sm mb-2 pt-2 border-t mt-2">
                        <p className="font-medium flex items-center"><CalendarDays className="inline h-4 w-4 mr-1 text-primary"/>Availability Period:</p>
                        <p className="pl-5 text-xs text-muted-foreground">
                            {cat.availabilityStartDate ? cat.availabilityStartDate : 'Open Start'} - {cat.availabilityEndDate ? cat.availabilityEndDate : 'Open End'}
                        </p>
                    </div>
                )}

                <div className="space-y-3 text-sm border-t pt-3">
                  <p className="font-medium flex items-center"><Users className="inline h-4 w-4 mr-1 text-primary"/>Adult Pricing (Total Room Price):</p>
                  {/* ... (pricing display as before) ... */}
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
                        <p className="font-medium text-sm flex items-center"><Wrench className="inline h-4 w-4 mr-1 text-blue-500"/>Category Facilities:</p>
                        <ChipList items={cat.categoryFacilities} noRemove colorClass="bg-blue-100 text-blue-700"/>
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
            <FormItem> <FormLabel>Currency</FormLabel> <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}> <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </FormItem>
          </div>

          {/* Availability Period */}
          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><CalendarDays className="inline h-5 w-5 mr-2 text-primary" />Availability Period (Optional)</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Start Date</FormLabel>
                    <Input type="date" value={newCategory.availabilityStartDate} onChange={(e) => handleNewCategoryFieldChange('availabilityStartDate', e.target.value)} />
                </FormItem>
                <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">End Date</FormLabel>
                    <Input type="date" value={newCategory.availabilityEndDate} onChange={(e) => handleNewCategoryFieldChange('availabilityEndDate', e.target.value)} />
                </FormItem>
            </div>
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
                                <FormItem> <Label className="text-xs text-muted-foreground">Discounted (Opt.)</Label> <Input type="number" value={getPrice(newCategory.pricing[occ.discField as keyof RoomCategoryPricing], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.discField as keyof RoomCategoryPricing, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01"/> </FormItem>
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
                                <FormItem> <Label className="text-xs text-muted-foreground">Discounted (Opt.)</Label> <Input type="number" value={getPrice(newCategory.pricing[child.discField as keyof RoomCategoryPricing], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.discField as keyof RoomCategoryPricing, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01"/> </FormItem>
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
          {['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfastIncluded', 'petFriendly', 'roomService', 'barLounge', 'laundryService'].map((amenity) => (
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