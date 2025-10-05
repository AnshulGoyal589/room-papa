import React, { useState, useEffect } from "react";
import { Property } from "@/lib/mongodb/models/Property";
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
import { Image as ImageType, Period, SeasonalCoasting } from "@/lib/mongodb/models/Components";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";
import { Badge as UiBadge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Edit,
  Check,
  AlertCircle,
  Users,
  Baby,
  DollarSign,
  Home,
  MapPin,
  BedDouble,
  ListChecks,
  Image as ImageIcon,
  Utensils,
  CalendarDays,
  Sparkles,
  Wrench,
} from "lucide-react";
import { HikePricingByOccupancy, StoredRoomCategory } from "@/types/booking";
import { CldImage } from "next-cloudinary";
import { DiscountedPricingByMealPlan, PricingByMealPlan, propertyAmenitiesArray, PropertyType, RoomCategoryPricing } from "@/types/property";
const generateId = () => Math.random().toString(36).substr(2, 9);


const getPrice = (
    priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined | number,
    mealPlan?: keyof PricingByMealPlan
): number => {
    if (typeof priceGroup === 'number') return priceGroup; // Old format
    if (priceGroup && typeof priceGroup === 'object' && mealPlan && mealPlan in priceGroup) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const price = (priceGroup as any)[mealPlan];
        return typeof price === 'number' ? price : 0;
    }
    return 0;
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


const initialNewCategoryState = {
  id: '',
  title: "",
  qty: 1,
  currency: "INR",
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
  unavailableDates: [] as string[],
  // availabilityStartDate: '',
  // availabilityEndDate: '',
  availability: [] as Period[],
  newAvailabilityPeriod: { startDate: '', endDate: '' },
  roomSize: '',
  categoryActivities: [] as string[],
  categoryFacilities: [] as string[],
  seasonalHike: {
    startDate: '',
    endDate: '',
    hikePricing: initialHikePricingState,
  },
  categoryImages: [] as ImageType[],
};


interface PropertyEditFormProps {
  item: Property;
  onSave: (updatedProperty: Property) => void;
}

const MealPlanLabel: React.FC<{ mealPlan: keyof PricingByMealPlan, showIcon?: boolean, className?: string }> = ({ mealPlan, showIcon = true, className="" }) => {
    let text = '';
    switch(mealPlan) {
        case 'noMeal': text = 'Room Only'; break;
        case 'breakfastOnly': text = 'Breakfast Incl.'; break;
        case 'allMeals': text = 'All Meals Incl.'; break;
        default: return null;
    }
    return (
         <span className={`text-xs font-medium text-gray-500 inline-flex items-center ${className}`}>
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

const ChipList: React.FC<{ items: string[]; onRemove?: (item: string) => void; noRemove?: boolean, baseColorClass?: string, icon?: React.ElementType }> = ({ items, onRemove, noRemove, baseColorClass = "bg-gray-100 text-gray-700 border-gray-300", icon: Icon }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-1">
            {items.map(item => (
                <UiBadge key={item} variant="outline" className={`font-normal ${baseColorClass} text-xs inline-flex items-center`}>
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    <span>{item}</span>
                    {!noRemove && onRemove && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1.5 text-muted-foreground hover:bg-gray-200 hover:text-destructive p-0"
                            onClick={() => onRemove(item)}
                            aria-label={`Remove ${item}`}
                        >
                            <X size={12} />
                        </Button>
                    )}
                </UiBadge>
            ))}
        </div>
    );
};

const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ item, onSave }) => {
  // console.log("Type:: ",item.type);
  const [formData, setFormData] = useState<Property>(() => {
      const clonedItem = JSON.parse(JSON.stringify(item));
      if (clonedItem.categoryRooms && Array.isArray(clonedItem.categoryRooms)) {
          clonedItem.categoryRooms = clonedItem.categoryRooms.map((cat: StoredRoomCategory) => ({
              ...cat,
              id: cat.id || generateId(),
              pricing: cat.pricing && typeof cat.pricing.singleOccupancyAdultPrice === 'object'
                  ? cat.pricing
                  : initialNewCategoryState.pricing,
              unavailableDates: Array.isArray(cat.unavailableDates) ? cat.unavailableDates.map(String).sort() : [],
              availability: Array.isArray(cat.availability) ? cat.availability : [],
              // availabilityStartDate: cat.availabilityStartDate || '',
              // availabilityEndDate: cat.availabilityEndDate || '',
              roomSize: cat.roomSize || "Unknown",
              categoryActivities: Array.isArray(cat.categoryActivities) ? cat.categoryActivities.map(String) : [],
              seasonalHike: cat.seasonalHike || undefined,
              categoryFacilities: Array.isArray(cat.categoryFacilities) ? cat.categoryFacilities.map(String) : [],
              categoryImages: Array.isArray(cat.categoryImages) ? cat.categoryImages : [],
          }));
      } else {
          clonedItem.categoryRooms = [];
      }
      return clonedItem;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newCategory, setNewCategory] = useState<typeof initialNewCategoryState>({
    ...initialNewCategoryState,
    currency: item.costing?.currency || "INR",
    newAvailabilityPeriod: { startDate: '', endDate: '' },
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUnavailableDateInput, setCurrentUnavailableDateInput] = useState<string>("");
  const [newCategoryActivityInput, setNewCategoryActivityInput] = useState<string>("");
  const [newCategoryFacilityInput, setNewCategoryFacilityInput] = useState<string>("");


  const accessibilityOptions = ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'];
  const roomAccessibilityOptionsList = ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'];
  const popularFiltersOptions = ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'];
  const funThingsToDoOptions = ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'];
  const mealsOptionsList = ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'];
  const facilitiesOptionsList = Array.from(propertyAmenitiesArray);
  const bedPreferenceOptionsList = ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'];
  const reservationPolicyOptionsList =  ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'];
  const brandsOptionsList =  ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'];
  const roomFacilitiesOptionsList = ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower'];

  useEffect(() => {
    const clonedItem = JSON.parse(JSON.stringify(item));
    if (clonedItem.categoryRooms && Array.isArray(clonedItem.categoryRooms)) {
        clonedItem.categoryRooms = clonedItem.categoryRooms.map((cat: StoredRoomCategory) => ({
            ...cat,
            id: cat.id || generateId(),
            pricing: cat.pricing && typeof cat.pricing.singleOccupancyAdultPrice === 'object'
                ? cat.pricing
                : initialNewCategoryState.pricing,
            unavailableDates: Array.isArray(cat.unavailableDates) ? cat.unavailableDates.map(String).sort() : [],
            seasonalHike: cat.seasonalHike || undefined,
             availability: Array.isArray(cat.availability) ? cat.availability : [],
            // availabilityStartDate: cat.availabilityStartDate || '',
            // availabilityEndDate: cat.availabilityEndDate || '',
            categoryActivities: Array.isArray(cat.categoryActivities) ? cat.categoryActivities.map(String) : [],
            categoryFacilities: Array.isArray(cat.categoryFacilities) ? cat.categoryFacilities.map(String) : [],
            categoryImages: Array.isArray(cat.categoryImages) ? cat.categoryImages : [], // Corrected initialization
        }));
    } else {
        clonedItem.categoryRooms = [];
    }
    setFormData(clonedItem);
  }, [item]);

  useEffect(() => {
    if (!isEditMode) {
        setNewCategory({
            ...initialNewCategoryState,
            currency: formData.costing?.currency || item.costing?.currency || "USD",
        });
        setCurrentUnavailableDateInput("");
        setNewCategoryActivityInput("");
        setNewCategoryFacilityInput("");
    }
  }, [isEditMode, item, formData.costing?.currency]);


//   useEffect(() => {
//     const currentCategories = formData.categoryRooms || [];
//     if (currentCategories && currentCategories.length > 0) {
//       let minOverallPrice = Infinity;
//       let minOverallDiscountedPrice = Infinity;
//       let leadCurrency = currentCategories[0].currency || "USD";
//       const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

//       currentCategories.forEach((cat: StoredRoomCategory) => {
//         const pricing = cat.pricing || initialNewCategoryState.pricing;
//         mealPlans.forEach(mealPlan => {
//             const singleBase = getPrice(pricing.singleOccupancyAdultPrice, mealPlan);
//             const singleDisc = getPrice(pricing.discountedSingleOccupancyAdultPrice, mealPlan);
//             const doubleBase = getPrice(pricing.doubleOccupancyAdultPrice, mealPlan);
//             const doubleDisc = getPrice(pricing.discountedDoubleOccupancyAdultPrice, mealPlan);
//             const tripleBase = getPrice(pricing.tripleOccupancyAdultPrice, mealPlan);
//             const tripleDisc = getPrice(pricing.discountedTripleOccupancyAdultPrice, mealPlan);
//             const pricesPerAdult: number[] = []; const discountedPricesPerAdult: number[] = [];
//             if (singleBase > 0) pricesPerAdult.push(singleBase); if (singleDisc > 0) discountedPricesPerAdult.push(singleDisc); else if (singleBase > 0) discountedPricesPerAdult.push(singleBase);
//             if (doubleBase > 0) pricesPerAdult.push(doubleBase / 2); if (doubleDisc > 0) discountedPricesPerAdult.push(doubleDisc / 2); else if (doubleBase > 0) discountedPricesPerAdult.push(doubleBase / 2);
//             if (tripleBase > 0) pricesPerAdult.push(tripleBase / 3); if (tripleDisc > 0) discountedPricesPerAdult.push(tripleDisc / 3); else if (tripleBase > 0) discountedPricesPerAdult.push(tripleBase / 3);
//             const currentMinForPlan = Math.min(...pricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity); const currentMinDiscountedForPlan = Math.min(...discountedPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);
//              if (currentMinForPlan < minOverallPrice) { minOverallPrice = currentMinForPlan; leadCurrency = cat.currency; }
//              if (currentMinDiscountedForPlan < minOverallDiscountedPrice) { minOverallDiscountedPrice = currentMinDiscountedForPlan; }
//         });
//       });
//       const totalRooms = currentCategories.reduce((sum: number, category: StoredRoomCategory) => sum + (category.qty || 0), 0);
//       let finalDiscountedPrice = minOverallDiscountedPrice === Infinity ? (minOverallPrice === Infinity ? 0 : minOverallPrice) : minOverallDiscountedPrice;
//       if (finalDiscountedPrice >= (minOverallPrice === Infinity ? 0 : minOverallPrice) && minOverallPrice !== Infinity) { finalDiscountedPrice = minOverallPrice; }
//       setFormData(prev => ({ ...prev, costing: { price: minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2)), discountedPrice: parseFloat(finalDiscountedPrice.toFixed(2)), currency: leadCurrency }, rooms: totalRooms }));
//     } else {
//       setFormData(prev => ({ ...prev, costing: { price: 0, discountedPrice: 0, currency: prev.costing?.currency || 'USD' }, rooms: 0 }));
//     }
//   }, [formData.categoryRooms]);

  useEffect(() => {
    const currentCategories = formData.categoryRooms || [];
    // Only proceed if there are categories
    if (currentCategories && currentCategories.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = currentCategories[0].currency || "USD"; // Default to first category's currency or USD

      const mealPlanPriorities: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

      currentCategories.forEach((cat: StoredRoomCategory) => {
        const pricing = cat.pricing || initialNewCategoryState.pricing;

        let categorySinglePrice = 0;
        let categorySingleDiscountedPrice = 0;

        // Find the single occupancy price based on meal plan priority
        for (const mealPlan of mealPlanPriorities) {
          const singleBase = getPrice(pricing.singleOccupancyAdultPrice, mealPlan);
          const singleDisc = getPrice(pricing.discountedSingleOccupancyAdultPrice, mealPlan);

          if (singleBase > 0) {
            categorySinglePrice = singleBase;
            // If discounted price is available and valid, use it, otherwise use base price
            categorySingleDiscountedPrice = (singleDisc > 0 && singleDisc < singleBase) ? singleDisc : singleBase;
            break; // Found a valid price with priority, stop searching meal plans for this category
          }
        }
        
        // Only consider this category's single occupancy price if a valid one was found
        if (categorySinglePrice > 0) {
          if (categorySinglePrice < minOverallPrice) {
            minOverallPrice = categorySinglePrice;
            leadCurrency = cat.currency; // Update currency when a new minimum price is found
          }
          if (categorySingleDiscountedPrice < minOverallDiscountedPrice) {
            minOverallDiscountedPrice = categorySingleDiscountedPrice;
          }
        }
      });

      const totalRooms = currentCategories.reduce((sum: number, category: StoredRoomCategory) => sum + (category.qty || 0), 0);
      
      const newCalculatedPrice = minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2));
      const newCalculatedDiscountedPrice = minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2));

      // Ensure discounted price is never higher than the base price
      const finalDiscountedPrice = (newCalculatedDiscountedPrice > 0 && newCalculatedDiscountedPrice < newCalculatedPrice) 
                                   ? newCalculatedDiscountedPrice 
                                   : newCalculatedPrice; // If no valid discounted price, or it's higher, use the base price

      // Only update if there's a significant change to avoid unnecessary re-renders
      if (
        totalRooms !== formData.rooms ||
        newCalculatedPrice !== formData.costing?.price ||
        finalDiscountedPrice !== formData.costing?.discountedPrice ||
        leadCurrency !== formData.costing?.currency
      ) {
        setFormData(prev => ({ 
          ...prev, 
          costing: { 
            price: newCalculatedPrice, 
            discountedPrice: finalDiscountedPrice, 
            currency: leadCurrency 
          }, 
          rooms: totalRooms 
        }));
      }
    } else {
      // If no categories, reset costing and rooms
      if (formData.costing?.price !== 0 || formData.costing?.discountedPrice !== 0 || formData.rooms !== 0) {
        setFormData(prev => ({ 
          ...prev, 
          costing: { price: 0, discountedPrice: 0, currency: prev.costing?.currency || 'USD' }, // Keep existing currency if possible
          rooms: 0 
        }));
      }
    }
  }, [formData.categoryRooms, formData.costing, formData.rooms, setFormData]); // Added formData.costing and formData.rooms to dependencies

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      const updated = JSON.parse(JSON.stringify(prev)) as Property;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = keys[i + 1].match(/^\d+$/) ? [] : {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleNewCategoryFieldChange = (
    field: keyof Omit<typeof newCategory, 'pricing' | 'id' | 'unavailableDates' | 'categoryActivities' | 'categoryFacilities' | 'categoryImages'>,
    value: string | number
  ) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };

  const handleNewCategoryImagesChange = (images: ImageType[]) => {
    setNewCategory(prev => ({...prev, categoryImages: images}));
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
          if (!updatedPricing[priceField]) { updatedPricing[priceField] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 }; }
          (updatedPricing[priceField] as PricingByMealPlan | DiscountedPricingByMealPlan)[mealPlan] = safeValue;
          return { ...prev, pricing: updatedPricing };
      });
  };

  const handleAddDateToNewCategory = () => {
    if (currentUnavailableDateInput && !newCategory.unavailableDates.includes(currentUnavailableDateInput)) {
        setNewCategory(prev => ({ ...prev, unavailableDates: [...prev.unavailableDates, currentUnavailableDateInput].sort() }));
        setCurrentUnavailableDateInput("");
    } else if (currentUnavailableDateInput && newCategory.unavailableDates.includes(currentUnavailableDateInput)) {
        alert("This date is already marked as unavailable."); setCurrentUnavailableDateInput("");
    } else if (!currentUnavailableDateInput) { alert("Please select a date to add."); }
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

  const handleRemoveDateFromNewCategory = (dateToRemove: string) => {
      setNewCategory(prev => ({ ...prev, unavailableDates: prev.unavailableDates.filter(date => date !== dateToRemove) }));
  };

  const handleRemoveExistingUnavailableDate = (categoryId: string, dateToRemove: string) => {
    setFormData((prev: Property) => ({ ...prev, categoryRooms: (prev.categoryRooms || []).map((cat: StoredRoomCategory) => cat.id === categoryId ? { ...cat, unavailableDates: (cat.unavailableDates || []).filter((d: string) => d !== dateToRemove) } : cat ) }));
  };

  const handleAddCategoryActivity = () => {
    const activity = newCategoryActivityInput.trim();
    if (activity && !newCategory.categoryActivities.includes(activity)) {
        setNewCategory(prev => ({...prev, categoryActivities: [...prev.categoryActivities, activity]}));
        setNewCategoryActivityInput("");
    }
  };

  const handleRemoveCategoryActivity = (activity: string) => {
    setNewCategory(prev => ({...prev, categoryActivities: prev.categoryActivities.filter(a => a !== activity)}));
  };

  const handleAddCategoryFacility = () => {
    const facility = newCategoryFacilityInput.trim();
    if (facility && !newCategory.categoryFacilities.includes(facility)) {
        setNewCategory(prev => ({...prev, categoryFacilities: [...prev.categoryFacilities, facility]}));
        setNewCategoryFacilityInput("");
    }
  };

  const handleRemoveCategoryFacility = (facility: string) => {
    setNewCategory(prev => ({...prev, categoryFacilities: prev.categoryFacilities.filter(f => f !== facility)}));
  };

  const handleRemoveExistingCategoryActivity = (categoryId: string, activityToRemove: string) => {
    setFormData((prev: Property) => ({ ...prev, categoryRooms: (prev.categoryRooms || []).map((cat: StoredRoomCategory) => cat.id === categoryId ? { ...cat, categoryActivities: (cat.categoryActivities || []).filter((a: string) => a !== activityToRemove) } : cat ) }));
  };

  const handleRemoveExistingCategoryFacility = (categoryId: string, facilityToRemove: string) => {
    setFormData((prev: Property) => ({ ...prev, categoryRooms: (prev.categoryRooms || []).map((cat: StoredRoomCategory) => cat.id === categoryId ? { ...cat, categoryFacilities: (cat.categoryFacilities || []).filter((f: string) => f !== facilityToRemove) } : cat ) }));
  };

  const handleAddOrUpdateCategory = () => {
    if (!newCategory.title.trim()) { alert('Category title is required.'); return; }
    if (newCategory.qty <= 0) { alert('Quantity must be greater than 0.'); return; }
    if (newCategory.categoryImages.length < 3) { alert('Please upload at least 3 images for the category.'); return; }
    if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
        alert('Base Price for 1 Adult (Room Only) must be greater than 0.'); return;
    }
    // if (newCategory.availabilityStartDate && newCategory.availabilityEndDate) {
    //     if (new Date(newCategory.availabilityEndDate) < new Date(newCategory.availabilityStartDate)) {
    //         alert('Availability End Date cannot be before Start Date.'); return;
    //     }
    // } else if (newCategory.availabilityEndDate && !newCategory.availabilityStartDate) {
    //     alert('Please provide an Availability Start Date if End Date is set.'); return;
    // }
    const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals']; const priceFieldsToCheck: (keyof RoomCategoryPricing)[] = [ 'singleOccupancyAdultPrice', 'doubleOccupancyAdultPrice', 'tripleOccupancyAdultPrice', 'child5to12Price', ];
    for (const field of priceFieldsToCheck) {
        const basePrices = newCategory.pricing[field]; const discountPricesField = `discounted${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof RoomCategoryPricing; const discountPrices = newCategory.pricing[discountPricesField];
        if (basePrices && discountPrices) {
            for (const mealPlan of mealPlans) { const base = getPrice(basePrices, mealPlan); const disc = getPrice(discountPrices, mealPlan); if (disc > 0 && base > 0 && disc >= base) { alert(`Discounted price for ${field.replace(/([A-Z])/g, ' $1')} (${mealPlan}) must be less than base price.`); return; } }
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

    const categoryData: StoredRoomCategory = {
      id: isEditMode && newCategory.id ? newCategory.id : generateId(),
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: JSON.parse(JSON.stringify(newCategory.pricing)),
      unavailableDates: newCategory.unavailableDates.sort(),
      roomSize: newCategory.roomSize || "Unknown",
      availability: [...newCategory.availability],
      categoryActivities: [...newCategory.categoryActivities],
      categoryFacilities: [...newCategory.categoryFacilities],
      categoryImages: [...newCategory.categoryImages],
      seasonalHike: seasonalHikeToAdd
    };

    if (isEditMode && newCategory.id) {
      setFormData(prev => ({ ...prev, categoryRooms: (prev.categoryRooms || []).map(cat => cat.id === newCategory.id ? categoryData : cat) }));
    } else {
      setFormData(prev => ({ ...prev, categoryRooms: [...(prev.categoryRooms || []), categoryData] }));
    }
    handleCancelEditCategory();
  };

  const handleEditCategory = (category: StoredRoomCategory) => {
    const categoryToEdit = JSON.parse(JSON.stringify(category));
    const fullPricing = { ...initialNewCategoryState.pricing, ...categoryToEdit.pricing };
     Object.keys(initialNewCategoryState.pricing).forEach(key => {
        const pricingKey = key as keyof RoomCategoryPricing;
        if (fullPricing[pricingKey] && typeof fullPricing[pricingKey] === 'object') {
            fullPricing[pricingKey] = { noMeal: getPrice(fullPricing[pricingKey], 'noMeal'), breakfastOnly: getPrice(fullPricing[pricingKey], 'breakfastOnly'), allMeals: getPrice(fullPricing[pricingKey], 'allMeals'), };
        } else { fullPricing[pricingKey] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 }; }
    });
    setNewCategory({
        id: categoryToEdit.id,
        title: categoryToEdit.title,
        qty: categoryToEdit.qty,
        currency: categoryToEdit.currency,
        pricing: fullPricing,
        roomSize: categoryToEdit.roomSize || "Unknown",
        unavailableDates: Array.isArray(categoryToEdit.unavailableDates) ? categoryToEdit.unavailableDates.map(String).sort() : [],
        availability: Array.isArray(categoryToEdit.availability) ? categoryToEdit.availability : [], // ADD THIS
        newAvailabilityPeriod: { startDate: '', endDate: '' },
        // availabilityStartDate: categoryToEdit.availabilityStartDate || '',
        // availabilityEndDate: categoryToEdit.availabilityEndDate || '',
        categoryActivities: Array.isArray(categoryToEdit.categoryActivities) ? categoryToEdit.categoryActivities.map(String) : [],
        categoryFacilities: Array.isArray(categoryToEdit.categoryFacilities) ? categoryToEdit.categoryFacilities.map(String) : [],
        categoryImages: Array.isArray(categoryToEdit.categoryImages) ? categoryToEdit.categoryImages : [],
        seasonalHike: {
            startDate: categoryToEdit.seasonalHike?.startDate || '',
            endDate: categoryToEdit.seasonalHike?.endDate || '',
            hikePricing: categoryToEdit.seasonalHike?.hikePricing
                ? { ...initialHikePricingState, ...categoryToEdit.seasonalHike.hikePricing }
                : initialHikePricingState,
        },
    });
    setCurrentUnavailableDateInput("");
    setNewCategoryActivityInput("");
    setNewCategoryFacilityInput("");
    setIsEditMode(true);
  };

  const handleCancelEditCategory = () => { setIsEditMode(false); };

  const handleRemoveCategory = (idToRemove: string) => {
    if (isEditMode && newCategory.id === idToRemove) { handleCancelEditCategory(); }
    setFormData(prev => ({ ...prev, categoryRooms: (prev.categoryRooms || []).filter(cat => cat.id !== idToRemove) }));
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
          alert("Both Start Date and End Date are required.");
          return;
      }
      if (new Date(endDate) < new Date(startDate)) {
          alert('End Date cannot be before Start Date.');
          return;
      }
      setNewCategory(prev => ({
          ...prev,
          availability: [...prev.availability, { startDate, endDate }],
          newAvailabilityPeriod: { startDate: '', endDate: '' } // Reset form
      }));
  };

  const handleRemoveAvailabilityPeriod = (indexToRemove: number) => {
      setNewCategory(prev => ({
          ...prev,
          availability: prev.availability.filter((_, index) => index !== indexToRemove)
      }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required"; if (!formData.description?.trim()) newErrors.description = "Description is required"; if (!formData.type) newErrors.type = "Property type is required"; if (!formData.location?.address?.trim()) newErrors.address = "Address is required"; if (!formData.location?.city?.trim()) newErrors.city = "City is required"; if (!formData.location?.state?.trim()) newErrors.state = "State/Province is required"; if (!formData.location?.country?.trim()) newErrors.country = "Country is required";
    if (!formData.categoryRooms || formData.categoryRooms.length === 0) { newErrors.categoryRooms = "At least one room category is required."; } else { const invalidCategory = formData.categoryRooms.some(cat => getPrice(cat.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0 && getPrice(cat.pricing.doubleOccupancyAdultPrice, 'noMeal') <= 0 && getPrice(cat.pricing.tripleOccupancyAdultPrice, 'noMeal') <= 0 ); if (invalidCategory) { newErrors.categoryRooms = "One or more room categories has no valid adult pricing for 'Room Only'."; } }
    if (!formData.bannerImage?.url) newErrors.bannerImage = "Banner image is required"; if (!formData.detailImages || formData.detailImages.length < 3 || formData.detailImages.some(img => !img.url)) { newErrors.detailImages = "At least 3 detail images are required"; }
    setErrors(newErrors); return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) { onSave(formData); }
    else { alert("Please correct the errors in the form."); }
  };

  const CheckboxGroup: React.FC<{ options: string[], value: string[], onChange: (field: string, value: string[]) => void, label: string, fieldName: string }> = ({ options, value = [], onChange, label, fieldName }) => (
    <div className="mb-4"> <label className="block mb-1.5 font-medium text-gray-700">{label}</label> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2"> {options.map((option) => ( <div key={option} className="flex items-center space-x-2"> <input type="checkbox" id={`${fieldName}-${option.replace(/\s+/g, '-')}`} checked={value.includes(option)} onChange={(e) => { const newValues = e.target.checked ? [...value, option] : value.filter((item) => item !== option); onChange(fieldName, newValues); }} className="form-checkbox h-4 w-4 text-[#003c95] transition duration-150 ease-in-out"/> <label htmlFor={`${fieldName}-${option.replace(/\s+/g, '-')}`} className="text-sm text-gray-600 capitalize cursor-pointer"> {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} </label> </div> ))} </div> </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white shadow-xl rounded-lg">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><Home className="mr-3 h-6 w-6 text-primary"/>Basic Information</h2>
        <div> <label className="font-medium text-gray-700">Title</label> <Input value={formData.title || ''} onChange={(e) => handleChange("title", e.target.value)} placeholder="Property Title" /> {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>} </div>
        <div> <label className="font-medium text-gray-700">Description</label> <Textarea value={formData.description || ''} onChange={(e) => handleChange("description", e.target.value)} placeholder="Detailed description of the property" rows={5} /> {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>} </div>
        <div>
          <label className="font-medium text-gray-700">Property Type</label>
          <Select value={formData?.type?.toLowerCase() as PropertyType} onValueChange={(value) => handleChange("type", value as PropertyType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>{['Hotel', 'Apartment', 'Villa', 'Hostel', 'Resort' , 'Cottage' , 'Homestay' ].map(type =>
              <SelectItem key={type} value={type.toLowerCase() as PropertyType}>{type}
              </SelectItem>)}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><MapPin className="mr-3 h-6 w-6 text-primary"/>Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label className="font-medium text-gray-700">Address</label> <Input value={formData.location?.address || ''} onChange={(e) => handleChange("location.address", e.target.value)} placeholder="Full Address" /> {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>} </div> <div> <label className="font-medium text-gray-700">City</label> <Input value={formData.location?.city || ''} onChange={(e) => handleChange("location.city", e.target.value)} placeholder="City" /> {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>} </div> <div> <label className="font-medium text-gray-700">State/Province</label> <Input value={formData.location?.state || ''} onChange={(e) => handleChange("location.state", e.target.value)} placeholder="State or Province" /> {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>} </div> <div> <label className="font-medium text-gray-700">Country</label> <Input value={formData.location?.country || ''} onChange={(e) => handleChange("location.country", e.target.value)} placeholder="Country" /> {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>} </div> </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><DollarSign className="mr-3 h-6 w-6 text-primary"/>Property Overview (Calculated)</h2>
        <div className="bg-[#003c95]/70 text-white p-4 rounded-lg border border-[#003c95]">
            <div className="flex items-start gap-2 mb-3">
                <AlertCircle size={25} className="text-white mt-0.5 shrink-0" />
                <p className="text-base font-bold text-white"> The following values are automatically calculated from your room categories. Ensure each category has valid pricing for all meal plans. </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Starting Price (per adult/night)</label> 
                    <Input value={`${formData.costing?.currency || 'N/A'} ${formData.costing?.price.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}`} disabled className="bg-white font-bold text-[#003c95] mt-1" /> 
                </div>
                {(formData.costing?.discountedPrice ?? 0) > 0 && formData.costing.discountedPrice < formData.costing.price && ( 
                    <div> 
                        <label className="text-xs font-bold text-white uppercase tracking-wider">Discounted Start Price</label>
                        <Input value={`${formData.costing.currency} ${formData.costing.discountedPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`} disabled className="bg-white font-bold text-[#003c95] mt-1" />
                    </div> 
                )}
                <div>
                    <label className="text-xs font-bold white uppercase tracking-wider">Total Rooms</label>
                    <Input value={formData.rooms || 0} type="number" disabled className="bg-white font-bold text-[#003c95] mt-1" />
                </div> 
            </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3">Other Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label className="font-medium text-gray-700">Property Rating (Stars)</label> <Input type="number" value={formData.propertyRating || 0} onChange={(e) => handleChange("propertyRating", parseFloat(e.target.value) || 0)} min={0} max={5} step={0.5} /> </div> <div> <label className="font-medium text-gray-700">Google Maps Link (Optional)</label> <Input value={formData.googleMaps || ""} onChange={(e) => handleChange("googleMaps", e.target.value || "")} placeholder="https://maps.app.goo.gl/..." /> </div> </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><BedDouble className="mr-3 h-6 w-6 text-primary"/>Manage Room Categories</h2>
        {errors.categoryRooms && <div className="my-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{errors.categoryRooms}</div>}

        {(formData.categoryRooms || []).length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-xl font-medium text-gray-700">Current Room Categories:</h3>
            {(formData.categoryRooms || []).map((cat: StoredRoomCategory) => {
                const pricing = cat.pricing || initialNewCategoryState.pricing;
                // console.log( "Testing Pricing" , pricing);
                const currency = cat.currency || "USD";
                return (
                <div key={cat.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow">
                    <div className="flex items-start justify-between mb-4 pb-3 border-b">
                        <div> 
                          <p className="font-bold text-gray-800 text-xl">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms)</span></p> <p className="text-sm text-gray-500">Currency: {currency}</p>
                          Room Size: <span className="text-sm text-gray-500">{cat.roomSize || "Unknown"}</span>
                        </div>
                        <div className="flex space-x-2"> <Button variant="outline" size="icon" type="button" onClick={() => handleEditCategory(cat)} disabled={isEditMode && newCategory.id === cat.id} aria-label={`Edit ${cat.title}`}> <Edit size={18} /> </Button> <Button variant="destructive" size="icon" type="button" onClick={() => handleRemoveCategory(cat.id!)} aria-label={`Remove ${cat.title}`}> <X size={18} /> </Button> </div>
                    </div>
                    
                    {cat.categoryImages && cat.categoryImages.length > 0 && (
                        <div className="mb-3">
                            <p className="font-medium text-gray-700 mb-2 flex items-center text-sm"><ImageIcon size={16} className="mr-1.5"/>Images:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
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

                    {cat.availability && cat.availability.length > 0 && (
                        <div className="text-sm mb-3">
                            <p className="font-semibold text-gray-700 flex items-center"><CalendarDays size={14} className="mr-1.5 text-[#003c95]"/>Availability Periods:</p>
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
                        <div> <p className="font-semibold text-gray-700 flex items-center mb-2"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p> {adultPricingConfig.map(occ => ( <div key={occ.label} className="mb-2 pl-2"> <strong className="block text-gray-600">{occ.label}:</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(pricing[occ.baseField as keyof RoomCategoryPricing], mealPlan); const discPrice = getPrice(pricing[occ.discField as keyof RoomCategoryPricing], mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} </div>
                        <div> <p className="font-semibold text-gray-700 flex items-center mb-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p> {childPricingConfig.map(child => ( <div key={child.age} className="mb-2 pl-2"> <strong className="block text-gray-600">Child ({child.age}):</strong> <div className="pl-4 space-y-0.5"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => { const basePrice = getPrice(pricing[child.baseField as keyof RoomCategoryPricing], mealPlan); const discPrice = getPrice(pricing[child.discField as keyof RoomCategoryPricing], mealPlan); if (basePrice > 0) { return ( <div key={mealPlan} className="flex justify-between items-center"> <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/> <span className="text-gray-800"> {currency} {basePrice.toLocaleString()} {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''} </span> </div> ); } return null; })} </div> </div> ))} </div>
                    </div>

                            {cat.seasonalHike && (
                              <div className="mt-4 pt-3 border-t text-sm">
                                  <p className="font-semibold text-gray-700 flex items-center mb-1">
                                      <DollarSign className="inline h-4 w-4 mr-1.5 text-blue-500"/>Seasonal Price Hike:
                                  </p>
                                  <p className="pl-6 text-gray-600 font-medium">
                                      Period: {new Date(cat.seasonalHike.startDate).toLocaleDateString()} - {new Date(cat.seasonalHike.endDate).toLocaleDateString()}
                                  </p>
                                  <div className="pl-2 mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                      <div>
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
                                                                      <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/>
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
                              </div>
                          )}

                    {cat.categoryActivities && cat.categoryActivities.length > 0 && (
                        <div className="mt-3 pt-2 border-t text-xs">
                            <p className="font-medium text-yellow-600 mb-1 flex items-center"><Sparkles size={14} className="mr-1" /> Category Activities:</p>
                            <ChipList
                                items={cat.categoryActivities}
                                onRemove={(!isEditMode || newCategory.id !== cat.id) ? (activity) => handleRemoveExistingCategoryActivity(cat.id!, activity) : undefined}
                                noRemove={isEditMode && newCategory.id === cat.id}
                                baseColorClass="bg-yellow-50 text-yellow-700 border-yellow-200"
                            />
                        </div>
                    )}
                    {cat.categoryFacilities && cat.categoryFacilities.length > 0 && (
                        <div className="mt-3 pt-2 border-t text-xs">
                            <p className="font-medium text-indigo-600 mb-1 flex items-center"><Wrench size={14} className="mr-1" /> Category Facilities:</p>
                             <ChipList
                                items={cat.categoryFacilities}
                                onRemove={(!isEditMode || newCategory.id !== cat.id) ? (facility) => handleRemoveExistingCategoryFacility(cat.id!, facility) : undefined}
                                noRemove={isEditMode && newCategory.id === cat.id}
                                baseColorClass="bg-indigo-50 text-indigo-700 border-indigo-200"
                            />
                        </div>
                    )}

                     {cat.unavailableDates && cat.unavailableDates.length > 0 && (
                        <div className="mt-3 pt-2 border-t text-xs">
                            <p className="font-medium text-red-500 mb-1 flex items-center"><CalendarDays size={14} className="mr-1" /> Unavailable Dates:</p>
                            <ChipList
                                items={cat.unavailableDates}
                                onRemove={(!isEditMode || newCategory.id !== cat.id) ? (date) => handleRemoveExistingUnavailableDate(cat.id!, date) : undefined}
                                noRemove={isEditMode && newCategory.id === cat.id}
                                baseColorClass="bg-red-50 text-red-600 border-red-200"
                            />
                        </div>
                    )}
                </div>
                );
            })}
          </div>
        )}

        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-6 shadow">
            <h3 className="text-xl font-semibold text-gray-700">{isEditMode ? `Editing: ${newCategory.title || 'Category Details'}` : "Add New Room Category"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1"> <label className="font-medium text-gray-700">Category Title</label> <Input value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Double Room" /> </div>
                <div> <label className="font-medium text-gray-700">Quantity (Rooms)</label> <Input type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} /> </div>
                <div> <label className="font-medium text-gray-700">Room Size (Optional)</label> <Input value={newCategory.roomSize} onChange={(e) => handleNewCategoryFieldChange('roomSize', e.target.value)} placeholder="e.g., 25 sqm" /> </div>
                <div> <label className="font-medium text-gray-700">Currency</label> <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}> <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </div>
            </div>

            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><ImageIcon className="inline h-5 w-5 mr-2"/>Manage Category Images</label>
                <MultipleImageUpload
                    label="category images"
                    value={newCategory.categoryImages}
                    onChange={handleNewCategoryImagesChange}
                    minImages={3}
                    maxImages={10}
                />
            </div>

            <div className="pt-4 border-t border-gray-300">
              <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><CalendarDays className="inline h-5 w-5 mr-2"/>Availability Periods (Optional)</label>
              <p className="text-xs text-gray-500 mb-4">If no periods are added, the category is considered always available (unless blocked by unavailable dates).</p>

              {newCategory.availability.length > 0 && (
                  <div className="mb-4 space-y-2">
                      <label className="text-sm font-medium text-gray-600">Added Periods:</label>
                      {newCategory.availability.map((period, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                              <span>{period.startDate} &mdash; {period.endDate}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAvailabilityPeriod(index)}>
                                  <X size={14} />
                              </Button>
                          </div>
                      ))}
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                      <label className="text-xs text-muted-foreground">Start Date</label>
                      <Input type="date" value={newCategory.newAvailabilityPeriod.startDate} onChange={(e) => handleNewAvailabilityPeriodChange('startDate', e.target.value)} />
                  </div>
                  <div>
                      <label className="text-xs text-muted-foreground">End Date</label>
                      <Input type="date" value={newCategory.newAvailabilityPeriod.endDate} onChange={(e) => handleNewAvailabilityPeriodChange('endDate', e.target.value)} />
                  </div>
              </div>
              <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full mt-3">
                  <Plus size={16} className="mr-1" /> Add Availability Period
              </Button>
          </div>

            <div className="pt-4 border-t border-gray-300"> <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price)</label> {adultPricingConfig.map(occ => ( <div key={occ.occupancy} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label}</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <label className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/> </label> <div> <label className="text-xs text-muted-foreground">Base Price</label> <Input type="number" value={getPrice(newCategory.pricing[occ.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </div> <div> <label className="text-xs text-muted-foreground">Discounted</label> <Input type="number" value={getPrice(newCategory.pricing[occ.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(occ.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </div> </div> ))} </div> </div> ))} </div>
            <div className="pt-4 border-t border-gray-300"> <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, sharing)</label> {childPricingConfig.map(child => ( <div key={child.age} className="mb-6 p-3 border rounded bg-white/50"> <p className="text-sm font-semibold mb-3 text-gray-600">Child ({child.age})</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => ( <div key={mealPlan} className="space-y-2"> <label className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/> </label> <div> <label className="text-xs text-muted-foreground">Base Price</label> <Input type="number" value={getPrice(newCategory.pricing[child.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </div> <div> <label className="text-xs text-muted-foreground">Discounted</label> <Input type="number" value={getPrice(newCategory.pricing[child.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(child.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </div> </div> ))} </div> </div> ))} </div>

            <div className="pt-4 border-t border-gray-300">
              <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><DollarSign className="inline h-5 w-5 mr-2"/>Seasonal Price Hike (Optional)</label>
              <p className="text-xs text-gray-500 mb-4">Set a period and additional prices that will be added on top of the base price for those specific dates.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                      <label className="text-xs text-muted-foreground">Hike Start Date</label>
                      <Input type="date" value={newCategory.seasonalHike.startDate}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, seasonalHike: { ...prev.seasonalHike, startDate: e.target.value } }))}
                      />
                  </div>
                  <div>
                      <label className="text-xs text-muted-foreground">Hike End Date</label>
                      <Input type="date" value={newCategory.seasonalHike.endDate}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, seasonalHike: { ...prev.seasonalHike, endDate: e.target.value } }))}
                      />
                  </div>
              </div>
              
              {hikePricingConfig.map(occ => (
                  <div key={occ.field} className="mb-6 p-3 border rounded bg-white/50">
                      <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label} (Additional Hike Price)</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                          {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                              <div key={mealPlan} className="space-y-2">
                                  <label className="text-xs font-medium flex items-center text-gray-600">
                                      <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/>
                                  </label>
                                  <div>
                                      <label className="text-xs text-muted-foreground">Hike Amount</label>
                                      <Input
                                          type="number"
                                          value={getPrice(newCategory.seasonalHike.hikePricing[occ.field], mealPlan) || ''}
                                          onChange={(e) => handleNewCategoryHikePricingChange(occ.field, mealPlan, e.target.value)}
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Sparkles className="inline h-5 w-5 mr-2"/>Manage Category Activities</label>
                <div className="flex items-end gap-2 mb-3">
                    <div className="flex-grow">
                        <label htmlFor="newCategoryActivity" className="text-xs font-medium text-gray-600">Add Activity</label>
                        <Input id="newCategoryActivity" value={newCategoryActivityInput} onChange={(e) => setNewCategoryActivityInput(e.target.value)} placeholder="e.g., Wine Tasting" className="mt-1"/>
                    </div>
                    <Button type="button" onClick={handleAddCategoryActivity} variant="outline" size="sm" className="px-3 py-2">
                        <Plus size={16} className="mr-1.5" /> Add
                    </Button>
                </div>
                <ChipList items={newCategory.categoryActivities} onRemove={handleRemoveCategoryActivity} baseColorClass="bg-yellow-50 text-yellow-700 border-yellow-200" />
                {newCategory.categoryActivities.length === 0 && <p className="text-xs text-gray-500">No activities added for this category yet.</p>}
            </div>

            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Wrench className="inline h-5 w-5 mr-2"/>Manage Category Facilities</label>
                <div className="flex items-end gap-2 mb-3">
                    <div className="flex-grow">
                        <label htmlFor="newCategoryFacility" className="text-xs font-medium text-gray-600">Add Facility</label>
                        <Input id="newCategoryFacility" value={newCategoryFacilityInput} onChange={(e) => setNewCategoryFacilityInput(e.target.value)} placeholder="e.g., Private Jacuzzi" className="mt-1"/>
                    </div>
                    <Button type="button" onClick={handleAddCategoryFacility} variant="outline" size="sm" className="px-3 py-2">
                        <Plus size={16} className="mr-1.5" /> Add
                    </Button>
                </div>
                <ChipList items={newCategory.categoryFacilities} onRemove={handleRemoveCategoryFacility} baseColorClass="bg-indigo-50 text-indigo-700 border-indigo-200" />
                {newCategory.categoryFacilities.length === 0 && <p className="text-xs text-gray-500">No facilities added for this category yet.</p>}
            </div>

            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"> <CalendarDays className="inline h-5 w-5 mr-2"/> Manage Unavailable Dates </label>
                <div className="flex items-end gap-2 mb-3">
                    <div className="flex-grow"> <label htmlFor="newUnavailableDate" className="text-xs font-medium text-gray-600">Add Date</label> <Input id="newUnavailableDate" type="date" value={currentUnavailableDateInput} onChange={(e) => setCurrentUnavailableDateInput(e.target.value)} className="mt-1"/> </div>
                    <Button type="button" onClick={handleAddDateToNewCategory} variant="outline" size="sm" className="px-3 py-2"> <Plus size={16} className="mr-1.5" /> Add </Button>
                </div>
                <ChipList items={newCategory.unavailableDates} onRemove={handleRemoveDateFromNewCategory} baseColorClass="bg-red-50 text-red-600 border-red-200" />
                {newCategory.unavailableDates.length === 0 && <p className="text-xs text-gray-500">No unavailable dates added for this category yet.</p>}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <Button type="button" onClick={handleAddOrUpdateCategory} className="flex-1 py-2.5"> {isEditMode ? <><Check size={18} className="mr-2" /> Update Category</> : <><Plus size={18} className="mr-2" /> Add This Category</>} </Button>
                {isEditMode && ( <Button type="button" variant="outline" onClick={handleCancelEditCategory} className="flex-1 py-2.5"> <X size={18} className="mr-2" /> Cancel Edit </Button> )}
            </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary"/>Property Features & Policies</h2>
        <CheckboxGroup options={accessibilityOptions} value={formData.accessibility || []} onChange={handleChange} label="Property Accessibility" fieldName="accessibility" />
        <CheckboxGroup options={roomAccessibilityOptionsList} value={formData.roomAccessibility || []} onChange={handleChange} label="Room Accessibility" fieldName="roomAccessibility" />
        <CheckboxGroup options={popularFiltersOptions} value={formData.popularFilters || []} onChange={handleChange} label="Popular Filters" fieldName="popularFilters" />
        <CheckboxGroup options={funThingsToDoOptions} value={formData.funThingsToDo || []} onChange={handleChange} label="Fun Things To Do" fieldName="funThingsToDo" />
        <CheckboxGroup options={mealsOptionsList} value={formData.meals || []} onChange={handleChange} label="Meals (Property Wide)" fieldName="meals" />
        <CheckboxGroup options={facilitiesOptionsList} value={formData.facilities || []} onChange={handleChange} label="Facilities" fieldName="facilities" />
        <CheckboxGroup options={bedPreferenceOptionsList} value={formData.bedPreference || []} onChange={handleChange} label="Bed Preferences" fieldName="bedPreference" />
        <CheckboxGroup options={reservationPolicyOptionsList} value={formData.reservationPolicy || []} onChange={handleChange} label="Reservation Policies" fieldName="reservationPolicy" />
        <CheckboxGroup options={brandsOptionsList} value={formData.brands || []} onChange={handleChange} label="Brands" fieldName="brands" />
        <CheckboxGroup options={roomFacilitiesOptionsList} value={formData.roomFacilities || []} onChange={handleChange} label="Room Facilities" fieldName="roomFacilities" />
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><ImageIcon className="mr-3 h-6 w-6 text-primary"/>Images</h2>
        <div> <label className="font-medium text-gray-700">Banner Image</label> <ImageUpload label='banner image' value={formData.bannerImage || null} onChange={(image) => handleChange("bannerImage", image)} /> {errors.bannerImage && <p className="text-red-500 text-xs mt-1">{errors.bannerImage}</p>} </div>
        <div> <label className="font-medium text-gray-700">Detail Images (minimum 3)</label> <MultipleImageUpload label='detail images' key={formData.detailImages?.map(img => img?.publicId || '').join(',') || 'empty-details'} value={formData.detailImages || []} onChange={(images) => handleChange("detailImages", images)} maxImages={10} /> {errors.detailImages && <p className="text-red-500 text-xs mt-1">{errors.detailImages}</p>} </div>
      </div>

      <Button type="submit" className="w-full py-3 text-lg font-semibold mt-8">
        <Check className="mr-2 h-5 w-5"/> Save Property Changes
      </Button>
    </form>
  );
};

export default PropertyEditForm;