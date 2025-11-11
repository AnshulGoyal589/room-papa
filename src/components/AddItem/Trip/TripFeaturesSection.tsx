"use client";

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ShieldCheck } from 'lucide-react';
import { Trip } from '@/lib/mongodb/models/Trip';
import { tripCategoryOptions } from '../../../../public/assets/tripData';
import { SectionHeader } from '../Property/SharedUI';

const TripFeaturesSection: React.FC = () => {
  const { control } = useFormContext<Trip>();

  const renderMultiSelect = (field: keyof Trip, label: string) => {
    const options = tripCategoryOptions[field as keyof typeof tripCategoryOptions] || [];

    return (
      <Controller
        control={control}
        name={field}
        render={({ field: { onChange, value } }) => {
          const selectedValues = (value as string[] | undefined) || [];

          const handleToggle = (item: string) => {
            const newArray = selectedValues.includes(item)
              ? selectedValues.filter(i => i !== item)
              : [...selectedValues, item];
            onChange(newArray);
          };

          return (
            <FormItem className="space-y-2">
              <FormLabel>{label}</FormLabel>
              <Select onValueChange={(selectedValue) => { if (selectedValue) { handleToggle(selectedValue); } }} value="">
                <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}...`} /></SelectTrigger>
                <SelectContent>
                  {options.map((option: string) => (
                    <SelectItem key={option} value={option} disabled={selectedValues.includes(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedValues.map((item) => (
                    <div key={item} className="flex items-center bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-sm">
                      <span className="mr-1.5">{item}</span>
                      <button type="button" onClick={() => handleToggle(item)} aria-label={`Remove ${item}`}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
          );
        }}
      />
    );
  };

  return (
    <div className="space-y-4 pt-6 border-t p-4 border rounded-lg">
      <SectionHeader title="Additional Trip Features & Classifications" icon={ShieldCheck} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {renderMultiSelect('activities', 'Primary Activities')}
        {renderMultiSelect('amenities', 'Included Amenities')}
        {renderMultiSelect('popularFilters', 'Popular Filters/Tags')}
        {renderMultiSelect('funThingsToDo', 'Fun Things To Do')}
        {renderMultiSelect('meals', 'Meal Plans Available')}
        {renderMultiSelect('facilities', 'On-Trip Facilities')}
        {renderMultiSelect('accessibility', 'Accessibility Features')}
        {renderMultiSelect('reservationPolicy', 'Reservation Policies')}
        {renderMultiSelect('brands', 'Associated Brands')}
      </div>
    </div>
  );
};

export default TripFeaturesSection;