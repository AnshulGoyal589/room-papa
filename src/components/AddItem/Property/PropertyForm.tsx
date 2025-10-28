import React, { useEffect } from 'react';
import { BedDouble } from 'lucide-react';
import { ExtendedProperty, PropertyFormProps } from '@/lib/mongodb/models/Components';
import { PricingByMealPlan, PropertyType } from '@/types/property';
import { SectionHeader } from './SharedUI';

import PropertyDetailsSection from './PropertyDetailsSection';
import RoomCategoryList from './RoomCategoryList';
import RoomCategoryForm from './RoomCategoryForm';
import PropertyFeaturesSection from './PropertyFeaturesSection';
import { singleOccupancyPropertyTypes } from '../../../../public/assets/data';
import { RoomCategory } from '@/types/property';

const getPrice = (pricing: Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    return pricing?.[mealPlan] ?? 0;
};

const initialPropertyData: ExtendedProperty = {
  type: 'Hotel' as PropertyType,
  location: { address: '', city: '', state: '', country: '' },
  costing: { price: 0, discountedPrice: 0, currency: 'INR' },
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
  offers: [],
  reservationPolicy: [],
  brands: [],
  roomFacilities: [],
  propertyRating: 0,
  googleMaps: '',
  houseRules: {
    checkInTime: '',
    checkOutTime: '',
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
    additionalRules: [],
  },
};

const PropertyForm: React.FC<PropertyFormProps> = ({
  propertyData = initialPropertyData,
  setPropertyData
}) => {
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
      const mealPlanPriorities: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

      categoryRooms.forEach(cat => {
          for (const mealPlan of mealPlanPriorities) {
              let basePrice = 0;
              let discPrice = 0;
              if (cat.pricingModel === 'perUnit') {
                  basePrice = getPrice(cat.totalOccupancyPrice, mealPlan);
                  discPrice = getPrice(cat.discountedTotalOccupancyPrice, mealPlan);
              } else { // 'perOccupancy' is the default/fallback
                  basePrice = getPrice(cat.pricing.singleOccupancyAdultPrice, mealPlan);
                  discPrice = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, mealPlan);
              }
              
              if (basePrice > 0) {
                  const effectivePrice = discPrice > 0 ? discPrice : basePrice;
                  if (basePrice < minOverallPrice) {
                      minOverallPrice = basePrice;
                      leadCurrency = cat.currency;
                  }
                  if (effectivePrice < minOverallDiscountedPrice) {
                      minOverallDiscountedPrice = effectivePrice;
                  }
                  break; // Found the cheapest meal plan for this category, move to next category
              }
          }
      });

      const newTotalRooms = categoryRooms.reduce((sum, cat) => sum + (cat.qty || 0), 0);
      const newPrice = minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2));
      const newDiscountedPrice = minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2));
      
      if (newTotalRooms !== currentRooms || newPrice !== currentPrice || newDiscountedPrice !== currentDiscountedPrice || leadCurrency !== currentCurrency) {
        setPropertyData(prev => ({
          ...prev,
          costing: { price: newPrice, discountedPrice: newDiscountedPrice, currency: leadCurrency },
          rooms: newTotalRooms
        }));
      }
    } else if (currentPrice !== 0 || currentDiscountedPrice !== 0 || currentRooms !== 0) {
      // Reset if all categories are removed
      setPropertyData(prev => ({ ...prev, costing: { price: 0, discountedPrice: 0, currency: 'INR' }, rooms: 0 }));
    }
  }, [propertyData, setPropertyData]);

  // Main state handlers to be passed down to children
  const handlePropertyChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPropertyData(prev => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof typeof prev] as object), [child]: value }
      }));
    } else {
      setPropertyData(prev => ({ ...prev, [field]: value as ExtendedProperty[keyof ExtendedProperty] }));
    }
  };

  const toggleArrayItem = (field: keyof ExtendedProperty, item: string) => {
    const currentArray = (propertyData[field] as string[] | undefined) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    handlePropertyChange(field, newArray);
  };

  const removeArrayItem = (field: keyof ExtendedProperty, item: string) => {
    const currentArray = (propertyData[field] as string[] | undefined) || [];
    handlePropertyChange(field, currentArray.filter(i => i !== item));
  };

  const handleAddCategory = (categoryToAdd: RoomCategory) => {
    const updatedCategories = [...(propertyData.categoryRooms || []), categoryToAdd];
    handlePropertyChange('categoryRooms', updatedCategories);
  };

  const handleRemoveCategory = (id: string) => {
    const updatedCategories = (propertyData.categoryRooms || []).filter(cat => cat.id !== id);
    handlePropertyChange('categoryRooms', updatedCategories);
  };
  
  // Ensure propertyData has a valid shape to prevent runtime errors
  const ensurePropertyData: ExtendedProperty = {
    ...initialPropertyData, ...propertyData,
    location: { ...initialPropertyData.location, ...(propertyData?.location || {}) },
    houseRules: { ...initialPropertyData.houseRules, ...(propertyData?.houseRules || {}) }, 
  };

  return (
    <div className="space-y-8 overflow-y-auto p-1 pr-4">

      <PropertyDetailsSection 
        propertyData={ensurePropertyData} 
        onPropertyChange={handlePropertyChange} 
      />

      <div className="space-y-4 pt-6 border-t">

        <SectionHeader title="Manage Room Categories" icon={BedDouble} />

        {(singleOccupancyPropertyTypes as readonly string[]).includes(ensurePropertyData.type) && (
            <p className="text-sm text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-md">
                For {ensurePropertyData.type} properties, it&apos;s recommended to have a single room category representing the entire property.
            </p>
        )}

        <RoomCategoryList
            categories={ensurePropertyData.categoryRooms ?? []}
            onRemoveCategory={handleRemoveCategory}
        />
          
        <RoomCategoryForm 
            onAddCategory={handleAddCategory} 
            propertyType={ensurePropertyData.type} 
        />

      </div>

      <PropertyFeaturesSection
        propertyData={ensurePropertyData}
        onPropertyChange={handlePropertyChange}
        onToggleArrayItem={toggleArrayItem}
        onRemoveArrayItem={removeArrayItem}
      />
      
    </div>
  );
};

export default PropertyForm;