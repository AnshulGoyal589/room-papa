"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DollarSign, MapPin, Tag } from 'lucide-react';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { Trip } from '@/lib/mongodb/models/Trip';
import { SectionHeader } from '../Property/SharedUI';
import { tripTypes } from '../../../../public/assets/tripData';

const TripDetailsSection: React.FC = () => {
  const { control } = useFormContext<Trip>();

  return (
    <div className="space-y-8">
      <div className="space-y-4 p-4 border rounded-lg">
        <SectionHeader title="Trip Overview" icon={Tag} />
        
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., 10-Day Adventure in the Himalayas" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="A brief overview of the trip..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trip Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tripTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="pickupService"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 pt-8">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="pickupService" />
                </FormControl>
                <Label htmlFor="pickupService">Airport Pickup Service Included</Label>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <SectionHeader title="Primary Destination" icon={MapPin} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control} name="destination.city"
            render={({ field }) => (
              <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} placeholder="e.g., Manali" /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField
            control={control} name="destination.state"
            render={({ field }) => (
              <FormItem><FormLabel>State/Province</FormLabel><FormControl><Input {...field} placeholder="e.g., Himachal Pradesh" /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField
            control={control} name="destination.country"
            render={({ field }) => (
              <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} placeholder="e.g., India" /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <SectionHeader title="Trip Costing (Per Person)" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control} name="costing.currency"
            render={({ field }) => (
              <FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger></FormControl><SelectContent>{['INR', 'USD', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}
          />
          <FormField
            control={control} name="costing.price"
            render={({ field }) => (
              <FormItem><FormLabel>Base Price</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} min="0" /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField
            control={control} name="costing.discountedPrice"
            render={({ field }) => (
              <FormItem><FormLabel>Discounted Price (Optional)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} min="0" /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <FormField
          control={control}
          name="bannerImage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultipleImageUpload 
                  label="Banner Image (1 Required)" 
                  value={field.value ? [field.value] : []} 
                  onChange={(images) => field.onChange(images[0] || null)}
                  maxImages={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-4 border-t">
          <FormField
            control={control}
            name="detailImages"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MultipleImageUpload 
                    label="Detail Images (Gallery)" 
                    value={field.value || []} 
                    onChange={field.onChange}
                    maxImages={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default TripDetailsSection;