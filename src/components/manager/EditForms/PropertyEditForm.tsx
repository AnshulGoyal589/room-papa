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
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";
import { Badge as UiBadge } from "@/components/ui/badge"; // Assuming a UI badge component
import {
  StoredRoomCategory,
  RoomCategoryPricing,
  PropertyType,
  PricingByMealPlan,
  DiscountedPricingByMealPlan
} from "@/types";
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
  CalendarDays, // Added for unavailable dates section
} from "lucide-react";

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to get price safely from nested structure
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

// Initial state for the form to add/edit a new room category with meal plans
const initialNewCategoryState = {
  id: '', // Will be set when editing
  title: "",
  qty: 1,
  currency: "USD",
  pricing: {
    singleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedSingleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    doubleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedDoubleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    tripleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedTripleOccupancyAdultPrice: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    child5to12Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedChild5to12Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    child12to18Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    discountedChild12to18Price: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
  } as RoomCategoryPricing,
  unavailableDates: [] as string[], // Added for unavailable dates
};


interface PropertyEditFormProps {
  item: Property;
  onSave: (updatedProperty: Property) => void;
}

// Helper Component for Meal Plan labels in Display
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
    { age: '12-18 yrs', baseField: 'child12to18Price', discField: 'discountedChild12to18Price' },
];


const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ item, onSave }) => {
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
          }));
      } else {
          clonedItem.categoryRooms = [];
      }
      return clonedItem;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newCategory, setNewCategory] = useState<{
    id?: string;
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing;
    unavailableDates: string[]; // Added for unavailable dates
  }>({
    ...initialNewCategoryState,
    currency: item.costing?.currency || "USD"
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUnavailableDateInput, setCurrentUnavailableDateInput] = useState<string>(""); // For new unavailable date input

  const accessibilityOptions = ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'];
  const roomAccessibilityOptionsList = ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'];
  const popularFiltersOptions = ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'];
  const funThingsToDoOptions = ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'];
  const mealsOptionsList = ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'];
  const facilitiesOptionsList = ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'];
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
        }));
    } else {
        clonedItem.categoryRooms = [];
    }
    setFormData(clonedItem);
  }, [item]);

  useEffect(() => {
    if (!isEditMode) {
        setNewCategory({
            ...initialNewCategoryState, // This will reset unavailableDates to []
            currency: formData.costing?.currency || item.costing?.currency || "USD",
        });
        setCurrentUnavailableDateInput(""); // Reset date input as well
    }
  }, [isEditMode, item, formData.costing?.currency]);


  useEffect(() => {
    const currentCategories = formData.categoryRooms || [];
    if (currentCategories && currentCategories.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = currentCategories[0].currency || "USD";
      const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

      currentCategories.forEach((cat: StoredRoomCategory) => {
        const pricing = cat.pricing || initialNewCategoryState.pricing;

        mealPlans.forEach(mealPlan => {
            const singleBase = getPrice(pricing.singleOccupancyAdultPrice, mealPlan);
            const singleDisc = getPrice(pricing.discountedSingleOccupancyAdultPrice, mealPlan);
            const doubleBase = getPrice(pricing.doubleOccupancyAdultPrice, mealPlan);
            const doubleDisc = getPrice(pricing.discountedDoubleOccupancyAdultPrice, mealPlan);
            const tripleBase = getPrice(pricing.tripleOccupancyAdultPrice, mealPlan);
            const tripleDisc = getPrice(pricing.discountedTripleOccupancyAdultPrice, mealPlan);

            const pricesPerAdult: number[] = [];
            const discountedPricesPerAdult: number[] = [];

            if (singleBase > 0) pricesPerAdult.push(singleBase);
            if (singleDisc > 0) discountedPricesPerAdult.push(singleDisc);
            else if (singleBase > 0) discountedPricesPerAdult.push(singleBase);

            if (doubleBase > 0) pricesPerAdult.push(doubleBase / 2);
            if (doubleDisc > 0) discountedPricesPerAdult.push(doubleDisc / 2);
            else if (doubleBase > 0) discountedPricesPerAdult.push(doubleBase / 2);

            if (tripleBase > 0) pricesPerAdult.push(tripleBase / 3);
            if (tripleDisc > 0) discountedPricesPerAdult.push(tripleDisc / 3);
            else if (tripleBase > 0) discountedPricesPerAdult.push(tripleBase / 3);

            const currentMinForPlan = Math.min(...pricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);
            const currentMinDiscountedForPlan = Math.min(...discountedPricesPerAdult.filter(p => p > 0 && isFinite(p)), Infinity);

             if (currentMinForPlan < minOverallPrice) {
                minOverallPrice = currentMinForPlan;
                leadCurrency = cat.currency;
             }
             if (currentMinDiscountedForPlan < minOverallDiscountedPrice) {
                minOverallDiscountedPrice = currentMinDiscountedForPlan;
             }
        });
      });

      const totalRooms = currentCategories.reduce((sum: number, category: StoredRoomCategory) => sum + (category.qty || 0), 0);
      let finalDiscountedPrice = minOverallDiscountedPrice === Infinity ? (minOverallPrice === Infinity ? 0 : minOverallPrice) : minOverallDiscountedPrice;
      if (finalDiscountedPrice >= (minOverallPrice === Infinity ? 0 : minOverallPrice) && minOverallPrice !== Infinity) {
        finalDiscountedPrice = minOverallPrice;
      }

      setFormData(prev => ({
        ...prev,
        costing: {
          price: minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2)),
          discountedPrice: parseFloat(finalDiscountedPrice.toFixed(2)),
          currency: leadCurrency
        },
        rooms: totalRooms
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        costing: { price: 0, discountedPrice: 0, currency: prev.costing?.currency || 'USD' },
        rooms: 0
      }));
    }
  }, [formData.categoryRooms]);

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

  const handleNewCategoryFieldChange = (field: keyof Omit<typeof newCategory, 'pricing' | 'id' | 'unavailableDates'>, value: string | number) => {
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
          const updatedPricing = JSON.parse(JSON.stringify(prev.pricing));
          if (!updatedPricing[priceField]) {
              updatedPricing[priceField] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 };
          }
          (updatedPricing[priceField] as PricingByMealPlan | DiscountedPricingByMealPlan)[mealPlan] = safeValue;
          return { ...prev, pricing: updatedPricing };
      });
  };

  const handleAddDateToNewCategory = () => {
    if (currentUnavailableDateInput && !newCategory.unavailableDates.includes(currentUnavailableDateInput)) {
        setNewCategory(prev => ({
            ...prev,
            unavailableDates: [...prev.unavailableDates, currentUnavailableDateInput].sort()
        }));
        setCurrentUnavailableDateInput("");
    } else if (currentUnavailableDateInput && newCategory.unavailableDates.includes(currentUnavailableDateInput)) {
        alert("This date is already marked as unavailable.");
        setCurrentUnavailableDateInput("");
    } else if (!currentUnavailableDateInput) {
        alert("Please select a date to add.");
    }
  };

  const handleRemoveDateFromNewCategory = (dateToRemove: string) => {
      setNewCategory(prev => ({
          ...prev,
          unavailableDates: prev.unavailableDates.filter(date => date !== dateToRemove)
      }));
  };

  const handleRemoveExistingUnavailableDate = (categoryId: string, dateToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        categoryRooms: (prev.categoryRooms || []).map(cat =>
            cat.id === categoryId
            ? { ...cat, unavailableDates: (cat.unavailableDates || []).filter(d => d !== dateToRemove) }
            : cat
        )
    }));
  };

  const handleAddOrUpdateCategory = () => {
    if (!newCategory.title.trim()) { alert('Category title is required.'); return; }
    if (newCategory.qty <= 0) { alert('Quantity must be greater than 0.'); return; }
    if (getPrice(newCategory.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0) {
        alert('Base Price for 1 Adult (Room Only) must be greater than 0.'); return;
    }

    const mealPlans: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];
    const priceFieldsToCheck: (keyof RoomCategoryPricing)[] = [
        'singleOccupancyAdultPrice', 'doubleOccupancyAdultPrice', 'tripleOccupancyAdultPrice',
        'child5to12Price', 'child12to18Price'
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
                    alert(`Discounted price for ${field.replace(/([A-Z])/g, ' $1')} (${mealPlan}) must be less than base price.`);
                    return;
                }
            }
        }
    }

    const categoryData: StoredRoomCategory = {
      id: isEditMode && newCategory.id ? newCategory.id : generateId(),
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: JSON.parse(JSON.stringify(newCategory.pricing)),
      unavailableDates: newCategory.unavailableDates.sort() // Ensure sorted
    };

    if (isEditMode && newCategory.id) {
      setFormData(prev => ({
        ...prev,
        categoryRooms: (prev.categoryRooms || []).map(cat => cat.id === newCategory.id ? categoryData : cat)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryRooms: [...(prev.categoryRooms || []), categoryData]
      }));
    }
    handleCancelEditCategory(); // Also resets newCategory via useEffect
  };

  const handleEditCategory = (category: StoredRoomCategory) => {
    const categoryToEdit = JSON.parse(JSON.stringify(category));
    const fullPricing = {
        ...initialNewCategoryState.pricing,
        ...categoryToEdit.pricing
    };
     Object.keys(initialNewCategoryState.pricing).forEach(key => {
        const pricingKey = key as keyof RoomCategoryPricing;
        if (fullPricing[pricingKey] && typeof fullPricing[pricingKey] === 'object') {
            fullPricing[pricingKey] = {
                noMeal: getPrice(fullPricing[pricingKey], 'noMeal'),
                breakfastOnly: getPrice(fullPricing[pricingKey], 'breakfastOnly'),
                allMeals: getPrice(fullPricing[pricingKey], 'allMeals'),
            };
        } else {
            fullPricing[pricingKey] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 };
        }
    });

    setNewCategory({
        id: categoryToEdit.id,
        title: categoryToEdit.title,
        qty: categoryToEdit.qty,
        currency: categoryToEdit.currency,
        pricing: fullPricing,
        unavailableDates: Array.isArray(categoryToEdit.unavailableDates) ? categoryToEdit.unavailableDates.map(String).sort() : []
    });
    setCurrentUnavailableDateInput(""); // Reset date input
    setIsEditMode(true);
  };

  const handleCancelEditCategory = () => {
    setIsEditMode(false); // useEffect will reset newCategory
  };

  const handleRemoveCategory = (idToRemove: string) => {
    if (isEditMode && newCategory.id === idToRemove) {
      handleCancelEditCategory();
    }
    setFormData(prev => ({
      ...prev,
      categoryRooms: (prev.categoryRooms || []).filter(cat => cat.id !== idToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Property type is required";
    if (!formData.location?.address?.trim()) newErrors.address = "Address is required";
    if (!formData.location?.city?.trim()) newErrors.city = "City is required";
    if (!formData.location?.state?.trim()) newErrors.state = "State/Province is required";
    if (!formData.location?.country?.trim()) newErrors.country = "Country is required";

    if (!formData.categoryRooms || formData.categoryRooms.length === 0) {
      newErrors.categoryRooms = "At least one room category is required.";
    } else {
        const invalidCategory = formData.categoryRooms.some(cat =>
            getPrice(cat.pricing.singleOccupancyAdultPrice, 'noMeal') <= 0 &&
            getPrice(cat.pricing.doubleOccupancyAdultPrice, 'noMeal') <= 0 &&
            getPrice(cat.pricing.tripleOccupancyAdultPrice, 'noMeal') <= 0
        );
        if (invalidCategory) {
            newErrors.categoryRooms = "One or more room categories has no valid adult pricing for 'Room Only'.";
        }
    }
    if (!formData.bannerImage?.url) newErrors.bannerImage = "Banner image is required";
    if (!formData.detailImages || formData.detailImages.length < 3 || formData.detailImages.some(img => !img.url)) {
      newErrors.detailImages = "At least 3 detail images are required";
    }
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = "End date cannot be before start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
        alert("Please correct the errors in the form.");
    }
  };

  const CheckboxGroup: React.FC<{
    options: string[],
    value: string[],
    onChange: (field: string, value: string[]) => void,
    label: string,
    fieldName: string
  }> = ({ options, value = [], onChange, label, fieldName }) => (
    <div className="mb-4">
      <label className="block mb-1.5 font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <input type="checkbox" id={`${fieldName}-${option.replace(/\s+/g, '-')}`} checked={value.includes(option)}
              onChange={(e) => {
                const newValues = e.target.checked ? [...value, option] : value.filter((item) => item !== option);
                onChange(fieldName, newValues);
              }} className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"/>
            <label htmlFor={`${fieldName}-${option.replace(/\s+/g, '-')}`} className="text-sm text-gray-600 capitalize cursor-pointer">
              {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white shadow-xl rounded-lg">
      {/* Section: Basic Information */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><Home className="mr-3 h-6 w-6 text-primary"/>Basic Information</h2>
        <div>
          <label className="font-medium text-gray-700">Title</label>
          <Input value={formData.title || ''} onChange={(e) => handleChange("title", e.target.value)} placeholder="Property Title" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="font-medium text-gray-700">Description</label>
          <Textarea value={formData.description || ''} onChange={(e) => handleChange("description", e.target.value)} placeholder="Detailed description of the property" rows={5} />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
        <div>
          <label className="font-medium text-gray-700">Property Type</label>
          <Select value={formData.type || ''} onValueChange={(value) => handleChange("type", value as PropertyType)}>
            <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
            <SelectContent>{['Hotel', 'Apartment', 'Villa', 'Hostel', 'Resort'].map(type => <SelectItem key={type} value={type.toLowerCase() as PropertyType}>{type}</SelectItem>)}</SelectContent>
          </Select>
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
        </div>
      </div>

      {/* Section: Location */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><MapPin className="mr-3 h-6 w-6 text-primary"/>Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div> <label className="font-medium text-gray-700">Address</label> <Input value={formData.location?.address || ''} onChange={(e) => handleChange("location.address", e.target.value)} placeholder="Full Address" /> {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>} </div>
            <div> <label className="font-medium text-gray-700">City</label> <Input value={formData.location?.city || ''} onChange={(e) => handleChange("location.city", e.target.value)} placeholder="City" /> {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>} </div>
            <div> <label className="font-medium text-gray-700">State/Province</label> <Input value={formData.location?.state || ''} onChange={(e) => handleChange("location.state", e.target.value)} placeholder="State or Province" /> {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>} </div>
            <div> <label className="font-medium text-gray-700">Country</label> <Input value={formData.location?.country || ''} onChange={(e) => handleChange("location.country", e.target.value)} placeholder="Country" /> {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>} </div>
        </div>
      </div>

      {/* Section: Property Pricing & Room Overview (Read-only) */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><DollarSign className="mr-3 h-6 w-6 text-primary"/>Property Overview (Calculated)</h2>
         <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2 mb-3"> <AlertCircle size={20} className="text-blue-600 mt-0.5 shrink-0" /> <p className="text-sm text-blue-700"> The following values are automatically calculated from your room categories. Ensure each category has valid pricing for all meal plans. </p> </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div> <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Starting Price (per adult/night)</label> <Input value={`${formData.costing?.currency || 'N/A'} ${formData.costing?.price.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}`} disabled className="bg-gray-100 font-bold text-gray-800 mt-1" /> </div>
            {(formData.costing?.discountedPrice ?? 0) > 0 && formData.costing.discountedPrice < formData.costing.price && ( <div> <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Discounted Start Price</label> <Input value={`${formData.costing.currency} ${formData.costing.discountedPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`} disabled className="bg-gray-100 font-bold text-green-600 mt-1" /> </div> )}
            <div> <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Rooms</label> <Input value={formData.rooms || 0} type="number" disabled className="bg-gray-100 font-bold text-gray-800 mt-1" /> </div>
            </div>
        </div>
      </div>

      {/* Section: Property Details */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3">Other Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div> <label className="font-medium text-gray-700">Property Rating (Stars)</label> <Input type="number" value={formData.propertyRating || 0} onChange={(e) => handleChange("propertyRating", parseFloat(e.target.value) || 0)} min={0} max={5} step={0.5} /> </div>
            <div> <label className="font-medium text-gray-700">Google Maps Link (Optional)</label> <Input value={formData.googleMaps || ""} onChange={(e) => handleChange("googleMaps", e.target.value || "")} placeholder="https://maps.app.goo.gl/..." /> </div>
            <div> <label className="font-medium text-gray-700">Availability Start Date</label> <Input type="date" value={formData.startDate || ''} onChange={(e) => handleChange("startDate", e.target.value)} /> {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>} </div>
            <div> <label className="font-medium text-gray-700">Availability End Date</label> <Input type="date" value={formData.endDate || ''} onChange={(e) => handleChange("endDate", e.target.value)} /> {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>} </div>
        </div>
      </div>

      {/* Section: Room Categories */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><BedDouble className="mr-3 h-6 w-6 text-primary"/>Manage Room Categories</h2>
        {errors.categoryRooms && <div className="my-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{errors.categoryRooms}</div>}

        {/* Display Existing Categories */}
        {(formData.categoryRooms || []).length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-xl font-medium text-gray-700">Current Room Categories:</h3>
            {(formData.categoryRooms || []).map((cat: StoredRoomCategory) => {
                const pricing = cat.pricing || initialNewCategoryState.pricing;
                const currency = cat.currency || "USD";
                return (
                <div key={cat.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow">
                    <div className="flex items-start justify-between mb-4 pb-3 border-b">
                        <div> <p className="font-bold text-gray-800 text-xl">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms)</span></p> <p className="text-sm text-gray-500">Currency: {currency}</p> </div>
                        <div className="flex space-x-2"> <Button variant="outline" size="icon" type="button" onClick={() => handleEditCategory(cat)} disabled={isEditMode && newCategory.id === cat.id} aria-label={`Edit ${cat.title}`}> <Edit size={18} /> </Button> <Button variant="destructive" size="icon" type="button" onClick={() => handleRemoveCategory(cat.id!)} aria-label={`Remove ${cat.title}`}> <X size={18} /> </Button> </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-700 flex items-center mb-2"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p>
                            {adultPricingConfig.map(occ => (
                                <div key={occ.label} className="mb-2 pl-2">
                                    <strong className="block text-gray-600">{occ.label}:</strong>
                                    <div className="pl-4 space-y-0.5">
                                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => {
                                            const basePrice = getPrice(pricing[occ.baseField as keyof RoomCategoryPricing], mealPlan);
                                            const discPrice = getPrice(pricing[occ.discField as keyof RoomCategoryPricing], mealPlan);
                                            if (basePrice > 0) {
                                                return (
                                                    <div key={mealPlan} className="flex justify-between items-center">
                                                        <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/>
                                                        <span className="text-gray-800">
                                                            {currency} {basePrice.toLocaleString()}
                                                            {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''}
                                                        </span>
                                                    </div>
                                                );
                                            } return null;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                             <p className="font-semibold text-gray-700 flex items-center mb-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p>
                            {childPricingConfig.map(child => (
                                <div key={child.age} className="mb-2 pl-2">
                                    <strong className="block text-gray-600">Child ({child.age}):</strong>
                                    <div className="pl-4 space-y-0.5">
                                        {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => {
                                            const basePrice = getPrice(pricing[child.baseField as keyof RoomCategoryPricing], mealPlan);
                                            const discPrice = getPrice(pricing[child.discField as keyof RoomCategoryPricing], mealPlan);
                                             if (basePrice > 0) {
                                                return (
                                                    <div key={mealPlan} className="flex justify-between items-center">
                                                        <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/>
                                                        <span className="text-gray-800">
                                                            {currency} {basePrice.toLocaleString()}
                                                            {(discPrice > 0 && discPrice < basePrice) ? <span className="text-green-600 font-medium"> (Now: {discPrice.toLocaleString()})</span> : ''}
                                                        </span>
                                                    </div>
                                                );
                                            } return null;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     {cat.unavailableDates && cat.unavailableDates.length > 0 && (
                        <div className="mt-3 pt-2 border-t text-xs">
                            <p className="font-medium text-red-500 mb-1 flex items-center"><CalendarDays size={14} className="mr-1" /> Unavailable Dates:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {cat.unavailableDates.map(d => (
                                  <UiBadge key={d} variant="outline" className="font-normal bg-red-50 text-red-600 border-red-200 text-xs inline-flex items-center">
                                      {d}
                                      {(!isEditMode || newCategory.id !== cat.id) && (
                                          <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-4 w-4 ml-1.5 text-red-500 hover:bg-red-200 hover:text-red-700 p-0"
                                              onClick={() => handleRemoveExistingUnavailableDate(cat.id!, d)}
                                              aria-label={`Remove date ${d}`}
                                          >
                                              <X size={12} />
                                          </Button>
                                      )}
                                  </UiBadge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                );
            })}
          </div>
        )}

        {/* Add/Edit Category Form */}
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-6 shadow">
            <h3 className="text-xl font-semibold text-gray-700">{isEditMode ? `Editing: ${newCategory.title || 'Category Details'}` : "Add New Room Category"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1"> <label className="font-medium text-gray-700">Category Title</label> <Input value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Double Room" /> </div>
                <div> <label className="font-medium text-gray-700">Quantity (Rooms)</label> <Input type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} /> </div>
                <div> <label className="font-medium text-gray-700">Currency</label> <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}> <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </div>
            </div>

            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price)</label>
                {adultPricingConfig.map(occ => (
                    <div key={occ.occupancy} className="mb-6 p-3 border rounded bg-white/50">
                        <p className="text-sm font-semibold mb-3 text-gray-600">{occ.label}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                            {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                                <div key={mealPlan} className="space-y-2">
                                    <label className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/> </label>
                                    <div> <label className="text-xs text-muted-foreground">Base Price</label> <Input type="number" value={getPrice(newCategory.pricing[occ.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(occ.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </div>
                                    <div> <label className="text-xs text-muted-foreground">Discounted (Opt.)</label> <Input type="number" value={getPrice(newCategory.pricing[occ.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(occ.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, sharing)</label>
                {childPricingConfig.map(child => (
                    <div key={child.age} className="mb-6 p-3 border rounded bg-white/50">
                        <p className="text-sm font-semibold mb-3 text-gray-600">Child ({child.age})</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                             {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(mealPlan => (
                                <div key={mealPlan} className="space-y-2">
                                    <label className="text-xs font-medium flex items-center text-gray-600"> <MealPlanLabel mealPlan={mealPlan} className="text-gray-600"/> </label>
                                    <div> <label className="text-xs text-muted-foreground">Base Price</label> <Input type="number" value={getPrice(newCategory.pricing[child.baseField], mealPlan)} onChange={(e) => handleNewCategoryPricingChange(child.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /> </div>
                                    <div> <label className="text-xs text-muted-foreground">Discounted (Opt.)</label> <Input type="number" value={getPrice(newCategory.pricing[child.discField], mealPlan) || ''} onChange={(e) => handleNewCategoryPricingChange(child.discField, mealPlan, e.target.value)} placeholder="Optional" min="0" step="0.01" /> </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Unavailable Dates Management in Add/Edit Form */}
            <div className="pt-4 border-t border-gray-300">
                <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center">
                    <CalendarDays className="inline h-5 w-5 mr-2"/> Manage Unavailable Dates
                </label>
                <div className="flex items-end gap-2 mb-3">
                    <div className="flex-grow">
                        <label htmlFor="newUnavailableDate" className="text-xs font-medium text-gray-600">Add Date</label>
                        <Input
                            id="newUnavailableDate"
                            type="date"
                            value={currentUnavailableDateInput}
                            onChange={(e) => setCurrentUnavailableDateInput(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <Button type="button" onClick={handleAddDateToNewCategory} variant="outline" size="sm" className="px-3 py-2">
                        <Plus size={16} className="mr-1.5" /> Add
                    </Button>
                </div>
                {newCategory.unavailableDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {newCategory.unavailableDates.map(date => (
                            <UiBadge key={date} variant="secondary" className="text-xs inline-flex items-center">
                                {date}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1.5 text-muted-foreground hover:bg-gray-200 hover:text-gray-700 p-0"
                                    onClick={() => handleRemoveDateFromNewCategory(date)}
                                    aria-label={`Remove date ${date}`}
                                >
                                    <X size={12} />
                                </Button>
                            </UiBadge>
                        ))}
                    </div>
                )}
                 {newCategory.unavailableDates.length === 0 && <p className="text-xs text-gray-500">No unavailable dates added for this category yet.</p>}
            </div>


            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <Button type="button" onClick={handleAddOrUpdateCategory} className="flex-1 py-2.5"> {isEditMode ? <><Check size={18} className="mr-2" /> Update Category</> : <><Plus size={18} className="mr-2" /> Add This Category</>} </Button>
                {isEditMode && ( <Button type="button" variant="outline" onClick={handleCancelEditCategory} className="flex-1 py-2.5"> <X size={18} className="mr-2" /> Cancel Edit </Button> )}
            </div>
        </div>
      </div>

      {/* Section: Property Features & Policies */}
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

      {/* Section: Images */}
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