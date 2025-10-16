// /components/property-form/RoomCategoryForm.tsx

import React, { useState } from 'react';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Baby, DollarSign, Users, Utensils, CalendarOff, Sparkles, Wrench, CalendarDays } from 'lucide-react';

import { HikePricingByOccupancy, StoredRoomCategory } from '@/types/booking';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { Image, Period, SeasonalCoasting } from '@/lib/mongodb/models/Components';
import { PricingByMealPlan, RoomCategoryPricing } from '@/types/property';
import { ChipList } from './SharedUI';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getPrice = (pricing: Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    return pricing?.[mealPlan] ?? 0;
};

// Type definitions specific to this form
interface HikePricingRowConfig {
    occupancy: number;
    field: keyof HikePricingByOccupancy;
    label: string;
}

// Initial States
const initialHikePricingState: HikePricingByOccupancy = {
    singleOccupancyAdultHike: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    doubleOccupancyAdultHike: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
    tripleOccupancyAdultHike: { noMeal: 0, breakfastOnly: 0, allMeals: 0 },
};

const initialNewCategoryState = {
  title: '',
  qty: 1,
  currency: 'INR',
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
  newAvailabilityPeriod: { startDate: '', endDate: '' },
  currentAvailabilityPeriods: [] as Period[],
  roomSize: '',
  newCategoryActivity: '',
  currentCategoryActivities: [] as string[],
  newCategoryFacility: '',
  currentCategoryFacilities: [] as string[],
  categoryImages: [] as Image[],
  seasonalHike: {
    startDate: '',
    endDate: '',
    hikePricing: initialHikePricingState,
  },
};

const hikePricingConfig: HikePricingRowConfig[] = [
    { occupancy: 1, field: 'singleOccupancyAdultHike', label: '1 Adult' },
    { occupancy: 2, field: 'doubleOccupancyAdultHike', label: '2 Adults' },
    { occupancy: 3, field: 'tripleOccupancyAdultHike', label: '3 Adults' },
];

// Component Props
interface RoomCategoryFormProps {
    onAddCategory: (category: StoredRoomCategory) => void;
}

const RoomCategoryForm: React.FC<RoomCategoryFormProps> = ({ onAddCategory }) => {
    const [newCategory, setNewCategory] = useState(initialNewCategoryState);

    const handleFieldChange = (field: keyof typeof newCategory, value: string | number) => {
        setNewCategory(prev => ({ ...prev, [field]: value }));
    };

    const handleImagesChange = (images: Image[]) => {
        setNewCategory(prev => ({ ...prev, categoryImages: images }));
    };

    const handlePricingChange = (
        priceField: keyof RoomCategoryPricing,
        mealPlan: keyof PricingByMealPlan,
        value: string | number
    ) => {
        const safeValue = Math.max(0, Number(value));
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

    const handleHikePricingChange = (
        occupancyField: keyof HikePricingByOccupancy,
        mealPlan: keyof PricingByMealPlan,
        value: string | number
    ) => {
        const safeValue = Math.max(0, Number(value));
        setNewCategory(prev => {
            const updatedHikePricing = JSON.parse(JSON.stringify(prev.seasonalHike.hikePricing));
            if (!updatedHikePricing[occupancyField]) {
                updatedHikePricing[occupancyField] = { noMeal: 0, breakfastOnly: 0, allMeals: 0 };
            }
            (updatedHikePricing[occupancyField] as PricingByMealPlan)[mealPlan] = safeValue;
            return {
                ...prev,
                seasonalHike: { ...prev.seasonalHike, hikePricing: updatedHikePricing }
            };
        });
    };
    
    // START: List Management Handlers (Unavailable Dates, Periods, Activities, Facilities)
    const handleAddUnavailableDate = () => {
        const date = newCategory.newUnavailableDate;
        if (date && !newCategory.currentUnavailableDates.includes(date) && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setNewCategory(prev => ({
                ...prev,
                currentUnavailableDates: [...prev.currentUnavailableDates, date].sort(),
                newUnavailableDate: ''
            }));
        } else {
            alert("Please select a valid, unique date.");
        }
    };
    const handleRemoveUnavailableDate = (date: string) => {
        setNewCategory(prev => ({ ...prev, currentUnavailableDates: prev.currentUnavailableDates.filter(d => d !== date) }));
    };

    const handleAddAvailabilityPeriod = () => {
        const { startDate, endDate } = newCategory.newAvailabilityPeriod;
        if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
            alert("Valid start and end dates are required."); return;
        }
        setNewCategory(prev => ({
            ...prev,
            currentAvailabilityPeriods: [...prev.currentAvailabilityPeriods, { startDate, endDate }],
            newAvailabilityPeriod: { startDate: '', endDate: '' }
        }));
    };
    const handleRemoveAvailabilityPeriod = (index: number) => {
        setNewCategory(prev => ({ ...prev, currentAvailabilityPeriods: prev.currentAvailabilityPeriods.filter((_, i) => i !== index) }));
    };

    const handleAddItemToList = (
        listKey: 'currentCategoryActivities' | 'currentCategoryFacilities',
        itemKey: 'newCategoryActivity' | 'newCategoryFacility'
    ) => {
        const item = newCategory[itemKey].trim();
        if (item && !newCategory[listKey].includes(item)) {
            setNewCategory(prev => ({
                ...prev,
                [listKey]: [...prev[listKey], item],
                [itemKey]: ''
            }));
        }
    };
    const handleRemoveItemFromList = (listKey: 'currentCategoryActivities' | 'currentCategoryFacilities', itemToRemove: string) => {
        setNewCategory(prev => ({...prev, [listKey]: (prev[listKey] as string[]).filter(item => item !== itemToRemove)}));
    };
    // END: List Management Handlers

    const handleAddCategoryClick = () => {
        // Validation logic
        if (!newCategory.title.trim()) { alert('Category title is required.'); return; }
        if (newCategory.qty <= 0) { alert('Quantity must be greater than 0.'); return; }
        if (newCategory.categoryImages.length < 3) { alert('Please upload at least 3 images.'); return; }
        
        // Discount price validation
        const priceFields = ['single', 'double', 'triple', 'child5to12'];
        for (const p of priceFields) {
            const baseField = `${p}OccupancyAdultPrice` as keyof RoomCategoryPricing;
            const discField = `discounted${p.charAt(0).toUpperCase() + p.slice(1)}OccupancyAdultPrice` as keyof RoomCategoryPricing;
            for (const meal of ['noMeal', 'breakfastOnly', 'allMeals'] as const) {
                const base = getPrice(newCategory.pricing[baseField], meal);
                const disc = getPrice(newCategory.pricing[discField], meal);
                if (disc > 0 && base > 0 && disc > base) {
                    alert(`Discounted price for ${p} (${meal}) cannot exceed base price.`);
                    return;
                }
            }
        }
        
        let seasonalHikeToAdd: SeasonalCoasting | undefined = undefined;
        const { seasonalHike } = newCategory;
        if (seasonalHike.startDate && seasonalHike.endDate) {
            if (new Date(seasonalHike.endDate) < new Date(seasonalHike.startDate)) {
                alert('Seasonal Hike End Date cannot be before Start Date.'); return;
            }
            seasonalHikeToAdd = { ...seasonalHike };
        } else if (seasonalHike.startDate || seasonalHike.endDate) {
            alert('Both start and end dates are required for a seasonal hike.'); return;
        }

        const categoryToAdd: StoredRoomCategory = {
            id: generateId(),
            title: newCategory.title,
            qty: newCategory.qty,
            currency: newCategory.currency,
            pricing: newCategory.pricing,
            unavailableDates: newCategory.currentUnavailableDates,
            categoryImages: newCategory.categoryImages,
            availability: newCategory.currentAvailabilityPeriods,
            categoryActivities: newCategory.currentCategoryActivities,
            categoryFacilities: newCategory.currentCategoryFacilities,
            seasonalHike: seasonalHikeToAdd,
            roomSize: newCategory.roomSize || "Unknown",
        };

        onAddCategory(categoryToAdd);
        setNewCategory(initialNewCategoryState); // Reset form
        alert("Category Added Successfully!");
    };

    return (
        <div className="p-4 bg-muted/30 border rounded-lg space-y-6">
            <h4 className="text-md font-medium text-foreground">Add New Room Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormItem className="md:col-span-1"> <FormLabel>Category Title</FormLabel> <Input value={newCategory.title} onChange={(e) => handleFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Room" /> </FormItem>
                <FormItem> <FormLabel>Quantity (Rooms)</FormLabel> <Input type="number" value={newCategory.qty} onChange={(e) => handleFieldChange('qty', Number(e.target.value))} min={1} /> </FormItem>
                <FormItem> <FormLabel>Currency</FormLabel> <Select value={newCategory.currency} onValueChange={(value) => handleFieldChange('currency', value)}> <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger> <SelectContent>{['INR', 'EUR', 'GBP', 'USD', 'JPY', 'KES'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent> </Select> </FormItem>
            </div>

            <div className="pt-4 border-t">
                <MultipleImageUpload label="Category Images" value={newCategory.categoryImages} onChange={handleImagesChange} minImages={3} maxImages={10} />
            </div>

            {/* Availability Period */}
            <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><CalendarDays className="inline h-5 w-5 mr-2 text-primary" /> BULK UPDATE Availability Periods (Optional)</FormLabel>
                <p className="text-xs text-muted-foreground mb-4">If no periods are added, the category is considered always available.</p>
                <ChipList
                    items={newCategory.currentAvailabilityPeriods.map(p => `${p.startDate} to ${p.endDate}`)}
                    onRemove={(item) => {
                        const index = newCategory.currentAvailabilityPeriods.findIndex(p => `${p.startDate} to ${p.endDate}` === item);
                        if (index !== -1) handleRemoveAvailabilityPeriod(index);
                    }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                    <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Start Date</FormLabel>
                        <Input type="date" value={newCategory.newAvailabilityPeriod.startDate} onChange={(e) => setNewCategory(p => ({ ...p, newAvailabilityPeriod: { ...p.newAvailabilityPeriod, startDate: e.target.value } }))} />
                    </FormItem>
                    <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">End Date</FormLabel>
                        <Input type="date" value={newCategory.newAvailabilityPeriod.endDate} onChange={(e) => setNewCategory(p => ({ ...p, newAvailabilityPeriod: { ...p.newAvailabilityPeriod, endDate: e.target.value } }))} />
                    </FormItem>
                </div>
                <Button type="button" variant="outline" onClick={handleAddAvailabilityPeriod} size="sm" className="w-full mt-3"><Plus size={16} className="mr-1" /> Add Availability Period</Button>
            </div>

            {/* Pricing Sections */}
            <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2 text-primary" />Adult Pricing (Total Room Price)</FormLabel>
                {[
                    { baseField: 'singleOccupancyAdultPrice' as keyof RoomCategoryPricing, discField: 'discountedSingleOccupancyAdultPrice' as keyof RoomCategoryPricing, label: '1 Adult' },
                    { baseField: 'doubleOccupancyAdultPrice' as keyof RoomCategoryPricing, discField: 'discountedDoubleOccupancyAdultPrice' as keyof RoomCategoryPricing, label: '2 Adults' },
                    { baseField: 'tripleOccupancyAdultPrice' as keyof RoomCategoryPricing, discField: 'discountedTripleOccupancyAdultPrice' as keyof RoomCategoryPricing, label: '3 Adults' },
                ].map(occ => (
                    <div key={occ.label} className="mb-6 p-3 border rounded bg-background/50">
                        <p className="text-sm font-semibold mb-3">{occ.label}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                            {(['noMeal', 'breakfastOnly', 'allMeals'] as const).map(mealPlan => (
                                <div key={mealPlan} className="space-y-2">
                                    <FormLabel className="text-xs font-medium flex items-center"><Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</FormLabel>
                                    <FormItem><Label className="text-xs text-muted-foreground">Base Price</Label><Input type="number" value={getPrice(newCategory.pricing[occ.baseField], mealPlan)} onChange={(e) => handlePricingChange(occ.baseField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /></FormItem>
                                    <FormItem><Label className="text-xs text-muted-foreground">Discounted</Label><Input type="number" value={getPrice(newCategory.pricing[occ.discField], mealPlan)} onChange={(e) => handlePricingChange(occ.discField, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /></FormItem>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2 text-primary" />Child Pricing (Per Child, when sharing)</FormLabel>
                <div className="mb-6 p-3 border rounded bg-background/50">
                    <p className="text-sm font-semibold mb-3">Child (5-12 yrs)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                        {(['noMeal', 'breakfastOnly', 'allMeals'] as const).map(mealPlan => (
                            <div key={mealPlan} className="space-y-2">
                                <FormLabel className="text-xs font-medium flex items-center"><Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</FormLabel>
                                <FormItem><Label className="text-xs text-muted-foreground">Base Price</Label><Input type="number" value={getPrice(newCategory.pricing.child5to12Price, mealPlan)} onChange={(e) => handlePricingChange('child5to12Price', mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /></FormItem>
                                <FormItem><Label className="text-xs text-muted-foreground">Discounted</Label><Input type="number" value={getPrice(newCategory.pricing.discountedChild5to12Price, mealPlan)} onChange={(e) => handlePricingChange('discountedChild5to12Price', mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /></FormItem>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Seasonal Hike */}
            <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><DollarSign className="inline h-5 w-5 mr-2 text-primary" />Seasonal Price Hike (Optional)</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem><FormLabel className="text-xs text-muted-foreground">Hike Start Date</FormLabel><Input type="date" value={newCategory.seasonalHike.startDate} onChange={(e) => setNewCategory(p => ({ ...p, seasonalHike: { ...p.seasonalHike, startDate: e.target.value } }))} /></FormItem>
                    <FormItem><FormLabel className="text-xs text-muted-foreground">Hike End Date</FormLabel><Input type="date" value={newCategory.seasonalHike.endDate} onChange={(e) => setNewCategory(p => ({ ...p, seasonalHike: { ...p.seasonalHike, endDate: e.target.value } }))} /></FormItem>
                </div>
                {hikePricingConfig.map(occ => (
                    <div key={occ.field} className="mt-4 p-3 border rounded bg-background/50">
                        <p className="text-sm font-semibold mb-3">{occ.label} (Additional Hike Price)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                            {(['noMeal', 'breakfastOnly', 'allMeals'] as const).map(mealPlan => (
                                <div key={mealPlan} className="space-y-2">
                                    <FormLabel className="text-xs font-medium flex items-center"><Utensils className="h-3 w-3 mr-1 inline"/> {mealPlan.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</FormLabel>
                                    <FormItem><Label className="text-xs text-muted-foreground">Hike Amount</Label><Input type="number" value={getPrice(newCategory.seasonalHike.hikePricing[occ.field], mealPlan) || ''} onChange={(e) => handleHikePricingChange(occ.field, mealPlan, e.target.value)} placeholder="0.00" min="0" step="0.01" /></FormItem>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Activities & Facilities */}
             <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Sparkles className="inline h-5 w-5 mr-2 text-primary" />Category Activities</FormLabel>
                <div className="flex gap-2"><Input value={newCategory.newCategoryActivity} onChange={(e) => handleFieldChange('newCategoryActivity', e.target.value)} placeholder="e.g., Guided Tour" /><Button type="button" variant="outline" onClick={() => handleAddItemToList('currentCategoryActivities', 'newCategoryActivity')} size="sm"><Plus size={16} /> Add</Button></div>
                <ChipList items={newCategory.currentCategoryActivities} onRemove={(item) => handleRemoveItemFromList('currentCategoryActivities', item)} />
             </div>
             <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><Wrench className="inline h-5 w-5 mr-2 text-primary" />Category Facilities</FormLabel>
                <div className="flex gap-2"><Input value={newCategory.newCategoryFacility} onChange={(e) => handleFieldChange('newCategoryFacility', e.target.value)} placeholder="e.g., Private Balcony" /><Button type="button" variant="outline" onClick={() => handleAddItemToList('currentCategoryFacilities', 'newCategoryFacility')} size="sm"><Plus size={16} /> Add</Button></div>
                <ChipList items={newCategory.currentCategoryFacilities} onRemove={(item) => handleRemoveItemFromList('currentCategoryFacilities', item)} />
             </div>

            {/* Unavailable Dates */}
            <div className="pt-4 border-t">
                <FormLabel className="text-md font-medium text-foreground mb-3 block flex items-center"><CalendarOff className="inline h-5 w-5 mr-2 text-primary" />Mark Unavailable Dates</FormLabel>
                <div className="flex gap-2"><Input type="date" value={newCategory.newUnavailableDate} onChange={(e) => handleFieldChange('newUnavailableDate', e.target.value)} /><Button type="button" variant="outline" onClick={handleAddUnavailableDate} size="sm"><Plus size={16}/> Add Date</Button></div>
                <ChipList items={newCategory.currentUnavailableDates} onRemove={handleRemoveUnavailableDate} />
            </div>

            <Button type="button" onClick={handleAddCategoryClick} className="w-full mt-6">
                <Plus size={18} className="mr-2" /> Add This Room Category
            </Button>
        </div>
    );
};

export default RoomCategoryForm;