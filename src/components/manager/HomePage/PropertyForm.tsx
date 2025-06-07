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
import { Plus, X, Home, MapPin, DollarSign, BedDouble, ListChecks, ShieldCheck, Users, Baby, Utensils, CalendarOff } from 'lucide-react';
import { Property } from '@/lib/mongodb/models/Property';
// Assuming types are updated in your types file:
// import { PropertyType,  } from '@/types';
import { categoryOptions } from '../../../../public/assets/data'; // Adjust path if needed

// --- MOCK TYPES (Replace with your actual types file import) ---
import { PropertyType } from '@/types';
import { StoredRoomCategory } from '@/types/booking';

interface PricingByMealPlan {
  noMeal: number;
  breakfastOnly: number;
  allMeals: number; // Represents Breakfast + Lunch/Dinner
}

interface DiscountedPricingByMealPlan {
  noMeal?: number;
  breakfastOnly?: number;
  allMeals?: number;
}

interface RoomCategoryPricing {
  singleOccupancyAdultPrice: PricingByMealPlan;
  discountedSingleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
  doubleOccupancyAdultPrice: PricingByMealPlan;
  discountedDoubleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
  tripleOccupancyAdultPrice: PricingByMealPlan;
  discountedTripleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
  child5to12Price: PricingByMealPlan;
  discountedChild5to12Price?: DiscountedPricingByMealPlan;
  // child12to18Price: PricingByMealPlan;
  // discountedChild12to18Price?: DiscountedPricingByMealPlan;
}



// Ensure Property type reflects the changes (no top-level start/end dates)
interface ExtendedProperty extends Omit<Property, 'startDate' | 'endDate' | 'costing' | 'rooms' | 'categoryRooms'> {
  type: PropertyType;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  costing: { // Calculated overview
    price: number;
    discountedPrice: number;
    currency: string;
  };
  rooms: number; // Calculated total
  categoryRooms?: StoredRoomCategory[]; // Use the updated type
  // Other fields remain the same
  amenities: string[];
  accessibility?: string[];
  roomAccessibility?: string[];
  popularFilters?: string[];
  funThingsToDo?: string[];
  meals?: string[]; // Property-level meal info (e.g., "Restaurant On Site")
  facilities?: string[];
  bedPreference?: string[];
  reservationPolicy?: string[];
  brands?: string[];
  roomFacilities?: string[];
  propertyRating?: number;
  googleMaps?: string;
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
    // child12to18Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    // discountedChild12to18Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
  } as RoomCategoryPricing, // Explicit cast might be needed depending on TS setup
  newUnavailableDate: '', // Input for adding a single unavailable date
  currentUnavailableDates: [] as string[], // List of dates for the category being added
};


// Create a default/initial state for PropertyData
const initialPropertyData: ExtendedProperty = {
  type: 'hotel' as PropertyType,
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
  },
  // startDate and endDate removed
  costing: { // This will be calculated
    price: 0,
    discountedPrice: 0,
    currency: 'USD',
  },
  rooms: 0, // Will be calculated from room categories qty

  categoryRooms: [], // Array of StoredRoomCategory
  amenities: [],
  accessibility: [],
  roomAccessibility: [],
  popularFilters: [],
  funThingsToDo: [],
  meals: [], // Still useful for property-level info (e.g., Restaurant On-Site)
  facilities: [],
  bedPreference: [],
  reservationPolicy: [],
  brands: [],
  roomFacilities: [],

  propertyRating: 0,
  googleMaps: '',
};

interface PropertyFormProps {
  propertyData: ExtendedProperty; // Use the extended type
  setPropertyData: React.Dispatch<React.SetStateAction<ExtendedProperty>>;
}

// Helper function to get nested pricing values safely
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
  }>(initialNewCategoryState);

  useEffect(() => {
    // Calculate overall property starting price based on the lowest per-adult rate across all categories and meal plans
    if (propertyData.categoryRooms && propertyData.categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = propertyData.categoryRooms[0].currency || 'USD';

      propertyData.categoryRooms.forEach(cat => {
        const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];
        
        // --- Calculate effective per-adult prices for this category across all meal plans ---
        const categoryPricesPerAdult: number[] = [];
        const categoryDiscountedPricesPerAdult: number[] = [];

        mealPlans.forEach(mealPlan => {
            // Single Occupancy
            const singleBase = getPrice(cat.pricing.singleOccupancyAdultPrice, mealPlan);
            const singleDisc = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, mealPlan);
            if (singleBase > 0) categoryPricesPerAdult.push(singleBase);
            if (singleDisc > 0) categoryDiscountedPricesPerAdult.push(singleDisc);
            else if (singleBase > 0) categoryDiscountedPricesPerAdult.push(singleBase); // Use base if no discount

            // Double Occupancy (Per Person)
            const doubleBase = getPrice(cat.pricing.doubleOccupancyAdultPrice, mealPlan);
            const doubleDisc = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, mealPlan);
            if (doubleBase > 0) categoryPricesPerAdult.push(doubleBase / 2);
            if (doubleDisc > 0) categoryDiscountedPricesPerAdult.push(doubleDisc / 2);
            else if (doubleBase > 0) categoryDiscountedPricesPerAdult.push(doubleBase / 2);

            // Triple Occupancy (Per Person)
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
          leadCurrency = cat.currency; // Update currency based on the category with the overall min price
        }
        if (currentCatMinDiscountedPrice < minOverallDiscountedPrice) {
          minOverallDiscountedPrice = currentCatMinDiscountedPrice;
           // Optional: update leadCurrency here too if discount is primary driver
        }
      });

      const totalRooms = propertyData.categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);

      setPropertyData(prev => ({
        ...prev,
        costing: {
          price: minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2)),
          discountedPrice: minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2)),
          currency: leadCurrency
        },
        rooms: totalRooms
      }));
    } else { // No room categories
      setPropertyData(prev => ({
        ...prev,
        costing: {
          price: 0,
          discountedPrice: 0,
          currency: 'USD'
        },
        rooms: 0
      }));
    }
  }, [propertyData.categoryRooms, setPropertyData]);

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

  // Updated handler for nested pricing structure
  const handleNewCategoryPricingChange = (
      priceField: keyof RoomCategoryPricing, // e.g., 'singleOccupancyAdultPrice'
      mealPlan: keyof PricingByMealPlan, // e.g., 'noMeal'
      value: string | number
  ) => {
      const numericValue = Number(value);
      const safeValue = numericValue < 0 ? 0 : numericValue;

      setNewCategory(prev => {
          const updatedPricing = { ...prev.pricing };
          const targetPriceGroup = updatedPricing[priceField]; // e.g., prev.pricing.singleOccupancyAdultPrice

          if (targetPriceGroup) {
              // Update the specific meal plan price within the group
              (targetPriceGroup as PricingByMealPlan)[mealPlan] = safeValue; // Cast needed if type is union/optional
          } else {
              // If the group (e.g., discounted) doesn't exist yet, create it
              updatedPricing[priceField] = {
                noMeal: mealPlan === 'noMeal' ? safeValue : 0,
                breakfastOnly: mealPlan === 'breakfastOnly' ? safeValue : 0,
                allMeals: mealPlan === 'allMeals' ? safeValue : 0,
              } as PricingByMealPlan; // Explicitly cast to PricingByMealPlan
          //         noMeal: mealPlan === 'noMeal' ? safeValue : 0,
          //         breakfastOnly: mealPlan === 'breakfastOnly' ? safeValue : 0,
          //         allMeals: mealPlan === 'allMeals' ? safeValue : 0,
          //     } as PricingByMealPlan | DiscountedPricingByMealPlan; // Adjust type based on field
          }

          return { ...prev, pricing: updatedPricing };
      });
  };

  // Handlers for unavailable dates within the new category form
  const handleNewUnavailableDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCategory(prev => ({ ...prev, newUnavailableDate: e.target.value }));
  };

  const handleAddUnavailableDate = () => {
    const dateToAdd = newCategory.newUnavailableDate;
    if (dateToAdd && !newCategory.currentUnavailableDates.includes(dateToAdd)) {
        // Basic validation (could add more complex date checks)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToAdd)) {
            alert("Please select a valid date in YYYY-MM-DD format.");
            return;
        }
        setNewCategory(prev => ({
            ...prev,
            currentUnavailableDates: [...prev.currentUnavailableDates, dateToAdd].sort(), // Keep sorted
            newUnavailableDate: '' // Clear input
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


  const handleAddCategory = () => {
    // --- Validation ---
    if (!newCategory.title.trim()) {
        alert('Category title is required.'); return;
    }
    if (newCategory.qty <= 0) {
        alert('Quantity must be greater than 0.'); return;
    }
    // Basic price validation: Ensure at least the 'No Meal' price for 1 adult is set
    if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
        alert('Base Price for 1 Adult (No Meal) must be greater than 0.'); return;
    }

    // Discount validation (check each meal plan where discount is provided)
    const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];
    const priceFieldsToCheck: (keyof RoomCategoryPricing)[] = [
        'singleOccupancyAdultPrice', 'doubleOccupancyAdultPrice', 'tripleOccupancyAdultPrice',
        'child5to12Price', 
        // 'child12to18Price'
    ];

    for (const field of priceFieldsToCheck) {
        const basePrices = newCategory.pricing[field];
        const discountPricesField = `discounted${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof RoomCategoryPricing;
        const discountPrices = newCategory.pricing[discountPricesField];

        if (basePrices && discountPrices) {
            for (const mealPlan of mealPlans) {
                const base = getPrice(basePrices as PricingByMealPlan, mealPlan); // Cast needed
                const disc = getPrice(discountPrices as DiscountedPricingByMealPlan, mealPlan);
                if (disc > 0 && base > 0 && disc > base) {
                    alert(`Discounted price for ${field} (${mealPlan}) cannot be greater than base price.`);
                    return;
                }
            }
        }
    }
    // --- End Validation ---


    const categoryToAdd: StoredRoomCategory = {
      id: generateId(),
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: JSON.parse(JSON.stringify(newCategory.pricing)), // Deep copy pricing
      unavailableDates: [...newCategory.currentUnavailableDates] // Copy dates
    };

    const updatedCategories = [...(propertyData.categoryRooms || []), categoryToAdd];
    handlePropertyChange('categoryRooms', updatedCategories);
    setNewCategory(initialNewCategoryState); // Reset form completely
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

  // Ensure propertyData uses the initial structure if it's partially undefined
   const ensurePropertyData: ExtendedProperty = {
    ...initialPropertyData,
    ...propertyData,
    location: { ...initialPropertyData.location, ...(propertyData?.location || {}) },
    // costing is calculated by useEffect
    categoryRooms: propertyData?.categoryRooms || [],
    amenities: propertyData?.amenities || [],
    // Add other arrays if needed
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

  return (
    // Added max-height and overflow for scrollability
    <div className="space-y-8 max-h-[75vh] overflow-y-auto p-1 pr-4"> 
      {/* Section: Property Details */}
      <div className="space-y-4">
        <SectionHeader title="Property Details" icon={Home} />
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

      {/* Section: Location */}
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
        {/* Start/End Date removed from here */}
      </div>

      {/* Section: Room & Price Summary (Property Level) */}
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

      {/* Section: Room Categories */}
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Manage Room Categories" icon={BedDouble} />
        {/* Display Added Categories */}
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

                {/* Pricing Display */}
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
                              }
                              return null;
                            })}
                        </div>
                    ))}
                  </div>

                  <p className="font-medium flex items-center pt-2"><Baby className="inline h-4 w-4 mr-1 text-primary"/>Child Pricing (Per Child, Sharing):</p>
                  <div className="pl-4 space-y-1">
                     {[
                        { label: 'Child (5-12 yrs)', base: cat.pricing.child5to12Price, disc: cat.pricing.discountedChild5to12Price },
                        // { label: 'Child (12-18 yrs)', base: cat.pricing.child12to18Price, disc: cat.pricing.discountedChild12to18Price },
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
                              }
                              return null;
                            })}
                         </div>
                     ))}
                     <p className="text-xs text-muted-foreground italic">Children below 5: Free (implicitly)</p>
                  </div>
                </div>

                 {/* Unavailable Dates Display */}
                 {cat.unavailableDates.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                       <p className="font-medium text-sm flex items-center"><CalendarOff className="inline h-4 w-4 mr-1 text-destructive"/>Unavailable Dates:</p>
                       <div className="flex flex-wrap gap-1 mt-1">
                          {cat.unavailableDates.map(date => (
                              <span key={date} className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                                  {date}
                              </span>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
            ))}
          </div>
        )}

        {/* Form to add new category */}
        <div className="p-4 bg-muted/30 border rounded-lg space-y-6">
          <h4 className="text-md font-medium text-foreground">Add New Room Category</h4>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem className="md:col-span-1">
              <FormLabel>Category Title</FormLabel>
              <Input value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Room" />
            </FormItem>
            <FormItem>
              <FormLabel>Quantity (Rooms)</FormLabel>
              <Input type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} />
            </FormItem>
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          </div>

          {/* Adult Pricing Section */}
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
                                <FormLabel className="text-xs font-medium flex items-center">
                                    <Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </FormLabel>
                                <FormItem>
                                   <Label className="text-xs text-muted-foreground">Base Price</Label>
                                   <Input
                                       type="number"
                                       value={getPrice(newCategory.pricing[occ.baseField as keyof RoomCategoryPricing], mealPlan)}
                                       onChange={(e) => handleNewCategoryPricingChange(occ.baseField as keyof RoomCategoryPricing, mealPlan, e.target.value)}
                                       placeholder="0.00" min="0" step="0.01"
                                    />
                                </FormItem>
                                <FormItem>
                                    <Label className="text-xs text-muted-foreground">Discounted (Opt.)</Label>
                                    <Input
                                        type="number"
                                        value={getPrice(newCategory.pricing[occ.discField as keyof RoomCategoryPricing], mealPlan)}
                                        onChange={(e) => handleNewCategoryPricingChange(occ.discField as keyof RoomCategoryPricing, mealPlan, e.target.value)}
                                        placeholder="0.00" min="0" step="0.01"
                                    />
                                </FormItem>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          {/* Child Pricing Section */}
          <div className="pt-4 border-t">
            <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2 text-primary" />Child Pricing (Per Child, when sharing)</FormLabel>
            <p className="text-xs text-muted-foreground mb-3">Apply if children share room with adults (up to max room occupancy, typically 3 total). Children below 5 usually free.</p>
             {[
                { age: '5-12 yrs', baseField: 'child5to12Price', discField: 'discountedChild5to12Price' },
                // { age: '12-18 yrs', baseField: 'child12to18Price', discField: 'discountedChild12to18Price' },
             ].map(child => (
                <div key={child.age} className="mb-6 p-3 border rounded bg-background/50">
                   <p className="text-sm font-semibold mb-3">Child ({child.age})</p>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                           <div key={mealPlan} className="space-y-2">
                                <FormLabel className="text-xs font-medium flex items-center">
                                    <Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </FormLabel>
                                <FormItem>
                                   <Label className="text-xs text-muted-foreground">Base Price</Label>
                                   <Input
                                       type="number"
                                       value={getPrice(newCategory.pricing[child.baseField as keyof RoomCategoryPricing], mealPlan)}
                                       onChange={(e) => handleNewCategoryPricingChange(child.baseField as keyof RoomCategoryPricing, mealPlan, e.target.value)}
                                       placeholder="0.00" min="0" step="0.01"
                                    />
                                </FormItem>
                                <FormItem>
                                    <Label className="text-xs text-muted-foreground">Discounted (Opt.)</Label>
                                    <Input
                                        type="number"
                                        value={getPrice(newCategory.pricing[child.discField as keyof RoomCategoryPricing], mealPlan)}
                                        onChange={(e) => handleNewCategoryPricingChange(child.discField as keyof RoomCategoryPricing, mealPlan, e.target.value)}
                                        placeholder="0.00" min="0" step="0.01"
                                    />
                                </FormItem>
                            </div>
                        ))}
                    </div>
                </div>
             ))}
          </div>

          {/* Unavailable Dates Section */}
          <div className="pt-4 border-t">
             <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><CalendarOff className="inline h-5 w-5 mr-2 text-primary" />Mark Unavailable Dates (for this category)</FormLabel>
             <div className="flex flex-col md:flex-row gap-2 items-start">
                 <FormItem className="flex-grow">
                    {/* <FormLabel className="text-sm">Select Date</FormLabel> */}
                    <Input
                        type="date"
                        value={newCategory.newUnavailableDate}
                        onChange={handleNewUnavailableDateChange}
                        className="w-full md:w-auto"
                    />
                 </FormItem>
                 <Button type="button" variant="outline" onClick={handleAddUnavailableDate} size="sm" className="w-full md:w-auto">
                    <Plus size={16} className="mr-1" /> Add Date
                 </Button>
             </div>
             {newCategory.currentUnavailableDates.length > 0 && (
                 <div className="mt-3 space-y-1">
                    <p className="text-sm text-muted-foreground">Dates marked as unavailable:</p>
                    <div className="flex flex-wrap gap-1.5">
                       {newCategory.currentUnavailableDates.map(date => (
                           <div key={date} className="flex items-center bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                              <span>{date}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveUnavailableDate(date)}
                                className="ml-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                aria-label={`Remove unavailable date ${date}`}
                              >
                                 <X size={12} />
                              </button>
                           </div>
                       ))}
                    </div>
                 </div>
             )}
          </div>

          {/* Add Category Button */}
          <Button type="button" onClick={handleAddCategory} className="w-full mt-6">
            <Plus size={18} className="mr-2" /> Add This Room Category
          </Button>
        </div>
      </div>

      {/* Section: Amenities */}
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
              <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal capitalize cursor-pointer">
                {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Additional Property Categories */}
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