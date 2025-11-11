"use client";

import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { BedDouble } from 'lucide-react';
import { ExtendedProperty } from '@/lib/mongodb/models/Components';
import { SectionHeader } from './SharedUI';

import PropertyDetailsSection from './PropertyDetailsSection';
import RoomCategoryList from './RoomCategoryList';
import RoomCategoryForm from './RoomCategoryForm';
import PropertyFeaturesSection from './PropertyFeaturesSection';

import { singleOccupancyPropertyTypes } from '../../../../public/assets/data';
import { PricingByMealPlan } from '@/types/property';

const getPrice = (pricing: Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    return pricing?.[mealPlan] ?? 0;
};


const PropertyForm: React.FC = () => {
  const { control, setValue, watch } = useFormContext<ExtendedProperty>();

  const categoryRooms = useWatch({ control, name: 'categoryRooms' });
  const propertyType = useWatch({ control, name: 'type' });

  useEffect(() => {
    const currentCosting = watch('costing');
    const currentRooms = watch('rooms');

    if (categoryRooms && categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = 'INR';
      const mealPlanPriorities: (keyof PricingByMealPlan)[] = ['noMeal', 'breakfastOnly', 'allMeals'];

      categoryRooms.forEach(cat => {
        for (const mealPlan of mealPlanPriorities) {
            let basePrice = 0, discPrice = 0;
            if (cat.pricingModel === 'perUnit' && cat.totalOccupancyPrice && cat.discountedTotalOccupancyPrice) {
                basePrice = getPrice(cat.totalOccupancyPrice, mealPlan);
                discPrice = getPrice(cat.discountedTotalOccupancyPrice, mealPlan);
            } else if (cat.pricingModel === 'perOccupancy' && cat.pricing) {
                basePrice = getPrice(cat.pricing.singleOccupancyAdultPrice as Partial<PricingByMealPlan> | undefined, mealPlan);
                discPrice = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice as Partial<PricingByMealPlan> | undefined, mealPlan);
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
                break;
            }
        }
      });
      
      const newTotalRooms = categoryRooms.reduce((sum, cat) => sum + (cat.qty || 0), 0);
      const newPrice = minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2));
      const newDiscountedPrice = minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2));
      
      if (newTotalRooms !== currentRooms || newPrice !== currentCosting?.price || newDiscountedPrice !== currentCosting?.discountedPrice || leadCurrency !== currentCosting?.currency) {
        setValue('costing', { price: newPrice, discountedPrice: newDiscountedPrice, currency: leadCurrency });
        setValue('rooms', newTotalRooms);
      }
    } else if (currentCosting?.price !== 0 || currentCosting?.discountedPrice !== 0 || currentRooms !== 0) {
      setValue('costing', { price: 0, discountedPrice: 0, currency: 'INR' });
      setValue('rooms', 0);
    }
  }, [categoryRooms, setValue, watch]);

  return (
    <div className="space-y-8 px-16">
      <h2 className="text-2xl font-bold flex items-center">
        <BedDouble className="mr-3 h-7 w-7 text-primary"/> Create Property
      </h2>

      <PropertyDetailsSection />

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Manage Room Categories" icon={BedDouble} />
        
        {(singleOccupancyPropertyTypes as readonly string[]).includes(propertyType) && (
            <p className="text-sm text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-md">
                For {propertyType} properties, it&apos;s recommended to have a single room category representing the entire property.
            </p>
        )}
  
        <RoomCategoryList />
        <RoomCategoryForm />
      </div>

      <PropertyFeaturesSection />
    </div>
  );
};

export default PropertyForm;