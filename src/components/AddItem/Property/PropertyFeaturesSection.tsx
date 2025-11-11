// /components/property-form/PropertyFeaturesSection.tsx

"use client";

import React, { useState } from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ListChecks, ShieldCheck, ClipboardList, Plus, X, Tag } from 'lucide-react';
import { categoryOptions } from '../../../../public/assets/data';
import { propertyAmenitiesArray } from '@/types/property';
import { SectionHeader, ChipList } from './SharedUI';
import { Property } from '@/lib/mongodb/models/Property'; // Ensure this type has the updated structure

const PropertyFeaturesSection: React.FC = () => {
  const { control } = useFormContext<Property>();
  const [newAdditionalRule, setNewAdditionalRule] = useState('');
  // const [newOffer, setNewOffer] = useState('');

  // CORRECTED: Fully type-safe useFieldArray without `as any`
  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: "houseRules.additionalRules",
  });
  // const { fields: offerFields, append: appendOffer, remove: removeOffer } = useFieldArray({
  const { fields: offerFields, remove: removeOffer } = useFieldArray({
    control,
    name: "offers",
  });

  const renderMultiSelect = (field: keyof Property, label: string, IconComponent?: React.ElementType) => {
    const options = categoryOptions[field as keyof typeof categoryOptions] || [];
    return (
      <Controller
        control={control}
        name={field}
        render={({ field: { onChange, value } }) => {
          const selectedValues = (value as string[] | undefined) || [];
          const handleToggle = (item: string) => {
            const newArray = selectedValues.includes(item) ? selectedValues.filter(i => i !== item) : [...selectedValues, item];
            onChange(newArray);
          };
          return (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center">
                {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />} {label}
              </FormLabel>
              <Select onValueChange={(val) => { if (val) handleToggle(val); }} value="">
                <FormControl><SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}...`} /></SelectTrigger></FormControl>
                <SelectContent>
                  {options.map((option: string) => <SelectItem key={option} value={option} disabled={selectedValues.includes(option)}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedValues.map((item) => (
                    <div key={item} className="flex items-center bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-sm">
                      <span className="mr-1.5">{item}</span>
                      <button type="button" onClick={() => handleToggle(item)} aria-label={`Remove ${item}`}><X size={14} /></button>
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
    <>
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Property Amenities" icon={ListChecks} />
        <Controller control={control} name="amenities"
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3">
              {propertyAmenitiesArray.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={field.value?.includes(amenity) ?? false}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      const newValue = checked ? [...current, amenity] : current.filter(a => a !== amenity);
                      field.onChange(newValue);
                    }}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal capitalize cursor-pointer">{amenity.replace(/([A-Z])/g, ' $1').trim()}</Label>
                </div>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="House Rules" icon={ClipboardList} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="houseRules.checkInTime" render={({ field }) => (<FormItem><FormLabel>Check-in Time</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={control} name="houseRules.checkOutTime" render={({ field }) => (<FormItem><FormLabel>Check-out Time</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <FormField control={control} name="houseRules.smokingAllowed" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="smokingAllowed" /></FormControl><Label htmlFor="smokingAllowed">Smoking Allowed</Label></FormItem>)} />
          <FormField control={control} name="houseRules.petsAllowed" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="petsAllowed" /></FormControl><Label htmlFor="petsAllowed">Pets Allowed</Label></FormItem>)} />
          <FormField control={control} name="houseRules.partiesAllowed" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="partiesAllowed" /></FormControl><Label htmlFor="partiesAllowed">Parties/Events Allowed</Label></FormItem>)} />
        </div>
        <div className="pt-4">
          <FormLabel>Additional Rules</FormLabel>
          <div className="flex flex-col md:flex-row gap-2 items-start mt-2">
            <Input value={newAdditionalRule} onChange={(e) => setNewAdditionalRule(e.target.value)} placeholder="e.g., Quiet hours after 10 PM" />
            <Button type="button" variant="outline" size="sm" onClick={() => { if(newAdditionalRule.trim()) { appendRule({ value: newAdditionalRule.trim() }); setNewAdditionalRule(''); } }}><Plus size={16} /> Add Rule</Button>
          </div>
          {/* CORRECTED: Type-safe mapping over fields */}
          <ChipList items={ruleFields.map(field => field.value)} onRemove={(item) => {
            const index = ruleFields.findIndex(f => f.value === item);
            if (index !== -1) removeRule(index);
          }} />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Special Offers" icon={Tag} />
        <FormLabel>Add Offer</FormLabel>

        <Controller
          control={control}
          name="offers"
          render={({ field }) => (
        <div className="flex flex-col md:flex-row gap-2 items-start mt-2">
          <div className="flex-1 flex items-center gap-2">
            <Input id="new-offer-input" placeholder="e.g., 10% off for 3 nights" className="flex-1" />
            <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const el = document.getElementById('new-offer-input') as HTMLInputElement | null;
            const val = el?.value.trim();
            if (val) {
              const current = field.value || [];
              field.onChange([...current, val]);
              if (el) el.value = '';
            }
          }}
            >
          <Plus size={16} /> Add Offer
            </Button>
          </div>
        </div>
          )}
        />

        <div className="pt-2">
          <ChipList
        items={offerFields.map(f => f.value)}
        onRemove={(item) => {
          const index = offerFields.findIndex(f => f.value === item);
          if (index !== -1) removeOffer(index);
        }}
          />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications & Features" icon={ShieldCheck} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderMultiSelect('accessibility', 'Property Accessibility')}
          {renderMultiSelect('roomAccessibility', 'Room Accessibility Features')}
          {renderMultiSelect('popularFilters', 'Popular Filters/Tags')}
          {renderMultiSelect('funThingsToDo', 'Nearby Fun & Activities')}
          {renderMultiSelect('meals', 'Meal Options Available')}
          {renderMultiSelect('facilities', 'On-site Facilities & Services')}
          {renderMultiSelect('bedPreference', 'Bed Preferences/Types Offered')}
          {renderMultiSelect('reservationPolicy', 'Reservation Policies')}
          {renderMultiSelect('brands', 'Associated Brands')}
          {renderMultiSelect('roomFacilities', 'Standard In-Room Facilities')}
        </div>
      </div>
    </>
  );
};

export default PropertyFeaturesSection;