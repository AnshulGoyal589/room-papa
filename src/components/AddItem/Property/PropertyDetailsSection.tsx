// /components/property-form/PropertyDetailsSection.tsx

"use client";

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, MapPin, DollarSign } from 'lucide-react';
import { ExtendedProperty } from '@/lib/mongodb/models/Components';
import { SectionHeader } from './SharedUI';
import { propertyTypes } from '../../../../public/assets/data';
import { Textarea } from '@/components/ui/textarea';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';

const PropertyDetailsSection: React.FC = () => {
  const { control } = useFormContext<ExtendedProperty>();

  // Watch values from the form state for display purposes
  const rooms = useWatch({ control, name: 'rooms' });
  const costing = useWatch({ control, name: 'costing' });
  const categoryRooms = useWatch({ control, name: 'categoryRooms' });

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Property Details" icon={Home} />

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

        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger></FormControl>
                <SelectContent>{propertyTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="propertyRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Rating</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="0">Unrated</SelectItem>
                    {[1, 2, 3, 4, 5].map(r => (<SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? 's' : ''}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Priority</FormLabel>
                <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? 1000 : Number(e.target.value))} min={0} max={1000} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="googleMaps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Maps Link (Optional)</FormLabel>
                <FormControl><Input {...field} placeholder="https://maps.google.com/..." /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Location" icon={MapPin} />
        <FormField control={control} name="location.address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="e.g., 123 Main St" /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={control} name="location.city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} placeholder="e.g., New York" /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={control} name="location.state" render={({ field }) => (<FormItem><FormLabel>State/Province</FormLabel><FormControl><Input {...field} placeholder="e.g., NY" /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={control} name="location.country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} placeholder="e.g., USA" /></FormControl><FormMessage /></FormItem>)} />
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

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Room & Price Summary (Property Overview)" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Total Rooms Available</FormLabel>
            <div className="p-3 border rounded-md bg-muted text-muted-foreground">
              {rooms || 0} {(rooms || 0) === 1 ? 'room' : 'rooms'}
              <p className="text-xs mt-1"> (Calculated from all room categories)</p>
            </div>
          </FormItem>
          {(categoryRooms ?? []).length > 0 && costing && (
            <FormItem>
              <FormLabel>Property Starting Price (per adult)</FormLabel>
              <div className="p-3 border rounded-md bg-muted text-muted-foreground">
                {costing.currency} {costing.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {costing.discountedPrice > 0 && costing.discountedPrice < costing.price && (
                  <span className="ml-2 text-green-600 font-semibold">
                    (From: {costing.currency} {costing.discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
                <p className="text-xs mt-1">(Lowest effective per-adult price)</p>
              </div>
            </FormItem>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertyDetailsSection;