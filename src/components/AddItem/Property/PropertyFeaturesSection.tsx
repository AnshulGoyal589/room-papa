// /components/property-form/PropertyFeaturesSection.tsx

import React, { useState } from 'react';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ListChecks, ShieldCheck, ClipboardList, Plus, X } from 'lucide-react';
import { categoryOptions } from '../../../../public/assets/data';

import { ExtendedProperty } from '@/lib/mongodb/models/Components';
import { propertyAmenitiesArray } from '@/types/property';
import { SectionHeader, ChipList } from './SharedUI';

interface PropertyFeaturesSectionProps {
  propertyData: ExtendedProperty;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPropertyChange: (field: string, value: any) => void;
  onToggleArrayItem: (field: keyof ExtendedProperty, item: string) => void;
  onRemoveArrayItem: (field: keyof ExtendedProperty, item: string) => void;
}

const PropertyFeaturesSection: React.FC<PropertyFeaturesSectionProps> = ({
  propertyData,
  onPropertyChange,
  onToggleArrayItem,
  onRemoveArrayItem,
}) => {
  const [newAdditionalRule, setNewAdditionalRule] = useState('');

  const renderMultiSelect = (field: keyof ExtendedProperty, label: string, IconComponent?: React.ElementType) => {
    const selectedValues = (propertyData[field] as string[] | undefined) || [];
    const options = categoryOptions[field as keyof typeof categoryOptions] || [];
    return (
      <FormItem className="space-y-2">
        <FormLabel className="flex items-center">
          {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />}
          {label}
        </FormLabel>
        <Select onValueChange={(value) => { if (value) { onToggleArrayItem(field, value); } }} value="">
          <SelectTrigger className="w-full"><SelectValue placeholder={`Select ${label.toLowerCase()}...`} /></SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option} disabled={selectedValues.includes(option)} className={selectedValues.includes(option) ? 'text-muted-foreground' : ''}>
                {option}
              </SelectItem>
            ))}
            {options.length === 0 && <SelectItem value="no-options" disabled>No options available</SelectItem>}
          </SelectContent>
        </Select>
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedValues.map((item) => (
              <div key={item} className="flex items-center bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-sm">
                <span className="mr-1.5">{item}</span>
                <button type="button" onClick={() => onRemoveArrayItem(field, item)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={`Remove ${item}`}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </FormItem>
    );
  };

  const handleAddAdditionalRule = () => {
    const ruleToAdd = newAdditionalRule.trim();
    if (ruleToAdd) {
      const currentRules = propertyData.houseRules?.additionalRules || [];
      if (!currentRules.includes(ruleToAdd)) {
        onPropertyChange('houseRules.additionalRules', [...currentRules, ruleToAdd]);
        setNewAdditionalRule('');
      } else {
        alert("This rule is already added.");
      }
    }
  };

  const handleRemoveAdditionalRule = (ruleToRemove: string) => {
    const currentRules = propertyData.houseRules?.additionalRules || [];
    onPropertyChange('houseRules.additionalRules', currentRules.filter(r => r !== ruleToRemove));
  };


  return (
    <>
      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Property Amenities" icon={ListChecks} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3">
          {propertyAmenitiesArray.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox id={`amenity-${amenity}`} checked={(propertyData.amenities || []).includes(amenity)}
                onCheckedChange={() => onToggleArrayItem('amenities', amenity)} />
              <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal capitalize cursor-pointer"> {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="House Rules" icon={ClipboardList} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Check-in Time</FormLabel>
            <Input type="time" value={propertyData.houseRules?.checkInTime} onChange={(e) => onPropertyChange('houseRules.checkInTime', e.target.value)} />
          </FormItem>
          <FormItem>
            <FormLabel>Check-out Time</FormLabel>
            <Input type="time" value={propertyData.houseRules?.checkOutTime} onChange={(e) => onPropertyChange('houseRules.checkOutTime', e.target.value)} />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="smokingAllowed" checked={propertyData.houseRules?.smokingAllowed} onCheckedChange={(checked) => onPropertyChange('houseRules.smokingAllowed', !!checked)} />
            <Label htmlFor="smokingAllowed">Smoking Allowed</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="petsAllowed" checked={propertyData.houseRules?.petsAllowed} onCheckedChange={(checked) => onPropertyChange('houseRules.petsAllowed', !!checked)} />
            <Label htmlFor="petsAllowed">Pets Allowed</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="partiesAllowed" checked={propertyData.houseRules?.partiesAllowed} onCheckedChange={(checked) => onPropertyChange('houseRules.partiesAllowed', !!checked)} />
            <Label htmlFor="partiesAllowed">Parties/Events Allowed</Label>
          </div>
        </div>
        <div className="pt-4">
          <FormLabel>Additional Rules</FormLabel>
          <div className="flex flex-col md:flex-row gap-2 items-start mt-2">
            <Input value={newAdditionalRule} onChange={(e) => setNewAdditionalRule(e.target.value)} placeholder="e.g., Quiet hours after 10 PM" className="flex-grow" />
            <Button type="button" variant="outline" onClick={handleAddAdditionalRule} size="sm" className="w-full md:w-auto"><Plus size={16} className="mr-1" /> Add Rule</Button>
          </div>
          <ChipList items={propertyData.houseRules?.additionalRules || []} onRemove={handleRemoveAdditionalRule} />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Additional Classifications & Features" icon={ShieldCheck} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {renderMultiSelect('accessibility', 'Property Accessibility')}
          {renderMultiSelect('roomAccessibility', 'Room Accessibility Features')}
          {renderMultiSelect('popularFilters', 'Popular Filters/Tags')}
          {renderMultiSelect('funThingsToDo', 'Nearby Fun & Activities')}
          {renderMultiSelect('meals', 'Meal Options Available (Property Wide)')}
          {renderMultiSelect('facilities', 'On-site Facilities & Services')}
          {renderMultiSelect('bedPreference', 'Bed Preferences/Types Offered')}
          {renderMultiSelect('reservationPolicy', 'Reservation Policies')}
          {renderMultiSelect('brands', 'Associated Brands (if any)')}
          {renderMultiSelect('roomFacilities', 'Standard In-Room Facilities')}
        </div>
      </div>
    </>
  );
};

export default PropertyFeaturesSection;