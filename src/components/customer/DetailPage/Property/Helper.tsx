import { DiscountedPricingByMealPlan, PricingByMealPlan } from "@/types/property";

export const calculateDays = (start: Date | null, end: Date | null): number => {
    if (!start || !end || end <= start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

export const getPrice = (
    priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined,
    mealPlan: keyof PricingByMealPlan
): number => {
    if (priceGroup && typeof priceGroup === 'object' && mealPlan in priceGroup) {
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (priceGroup as any)[mealPlan];
      return typeof price === 'number' ? price : 0;
    }
    return 0;
};

export const validateDate = (selectedDateStr: string): Date => {
    const date = new Date(selectedDateStr); date.setHours(12, 0, 0, 0);
    const minDate = new Date(); minDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() + 2); maxDate.setHours(23, 59, 59, 999);
    if (date < minDate) return minDate;
    if (date > maxDate) return maxDate;
    return date;
};
