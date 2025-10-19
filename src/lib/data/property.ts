import { DiscountedPricingByMealPlan, PricingByMealPlan } from "@/types/property";

export const getMinPropertyPrice = (pricing : PricingByMealPlan | DiscountedPricingByMealPlan ) => {
    if (!pricing) return 0;

    const roomOnlyPrice = pricing.noMeal;
    if( roomOnlyPrice > 0 ) return roomOnlyPrice;

    const breakfastPrice = pricing.breakfastOnly;
    if( breakfastPrice > 0 ) return breakfastPrice;

    const allMealsPrice = pricing.allMeals;
    return allMealsPrice > 0 ? allMealsPrice : 0;
}