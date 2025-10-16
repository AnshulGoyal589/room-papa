// /components/property-form/SharedUI.tsx

import React from 'react';
import { X } from 'lucide-react';
import { PricingByMealPlan } from '@/types/property';

export const SectionHeader: React.FC<{ title: string; icon?: React.ElementType; className?: string }> = ({ title, icon: Icon, className }) => (
  <div className={`flex items-center mb-4 ${className}`}>
    {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
    <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
  </div>
);

export const MealPlanLabel: React.FC<{ mealPlan: keyof PricingByMealPlan }> = ({ mealPlan }) => {
    switch(mealPlan) {
        case 'noMeal': return <span className="text-xs font-medium text-gray-500">(Room Only)</span>;
        case 'breakfastOnly': return <span className="text-xs font-medium text-[#003c95]">(+ Breakfast)</span>;
        case 'allMeals': return <span className="text-xs font-medium text-green-600">(+ All Meals)</span>;
        default: return null;
    }
}

export const ChipList: React.FC<{ items: string[]; onRemove?: (item: string) => void; noRemove?: boolean, colorClass?: string }> = ({ items, onRemove, noRemove, colorClass = "bg-muted text-muted-foreground" }) => {
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