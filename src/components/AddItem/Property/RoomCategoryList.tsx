// /components/property-form/RoomCategoryList.tsx

import React from 'react';
import { StoredRoomCategory } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Baby, CalendarDays, CalendarOff, DollarSign, Sparkles, Users, Wrench, X } from 'lucide-react';
import { PricingByMealPlan } from '@/types/property';
import { ChipList, MealPlanLabel } from './SharedUI';

interface RoomCategoryListProps {
  categories: StoredRoomCategory[];
  onRemoveCategory: (id: string) => void;
}

const getPrice = (pricing: Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    return pricing?.[mealPlan] ?? 0;
};

const RoomCategoryList: React.FC<RoomCategoryListProps> = ({ categories, onRemoveCategory }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      <h4 className="text-md font-medium text-foreground">Added Categories:</h4>
      {categories.map((cat) => (
        <div key={cat.id} className="p-4 bg-white border rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-foreground text-lg">{cat.title}
              <span className="text-sm text-muted-foreground ml-2">({cat.qty} rooms)</span></p>
              <p className="text-xs text-muted-foreground">Currency: {cat.currency}</p>
            </div>
            <Button variant="ghost" size="icon" type="button" onClick={() => onRemoveCategory(cat.id)} className="text-destructive hover:text-destructive/80 -mt-2 -mr-2" aria-label={`Remove ${cat.title}`}>
              <X size={18} />
            </Button>
          </div>

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
                        return (
                            <span key={mealKey} className="ml-2">
                                <MealPlanLabel mealPlan={mealKey} /> {cat.currency} {basePrice}
                                {discPrice > 0 && discPrice < basePrice ? ` (Disc: ${discPrice})` : ''}
                            </span>
                        )
                      })}
                  </div>
              ))}
            </div>

            <p className="font-medium flex items-center pt-2"><Baby className="inline h-4 w-4 mr-1 text-primary"/>Child Pricing (Per Child, Sharing):</p>
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

          {cat.categoryActivities && cat.categoryActivities.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                  <p className="font-medium text-sm flex items-center"><Sparkles className="inline h-4 w-4 mr-1 text-yellow-500"/>Category Activities:</p>
                  <ChipList items={cat.categoryActivities} noRemove colorClass="bg-yellow-100 text-yellow-700"/>
              </div>
          )}
          {cat.categoryFacilities && cat.categoryFacilities.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                  <p className="font-medium text-sm flex items-center"><Wrench className="inline h-4 w-4 mr-1 text-indigo-500"/>Category Facilities:</p>
                  <ChipList items={cat.categoryFacilities} noRemove colorClass="bg-indigo-100 text-indigo-700"/>
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
  );
};

export default RoomCategoryList;