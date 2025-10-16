// /components/property-form/PropertyDetailsSection.tsx

import React from 'react';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, MapPin, DollarSign } from 'lucide-react';
import { ExtendedProperty } from '@/lib/mongodb/models/Components';
import { PropertyType } from '@/types/property';
import { SectionHeader } from './SharedUI';

interface PropertyDetailsSectionProps {
  propertyData: ExtendedProperty;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPropertyChange: (field: string, value: any) => void;
}

const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({ propertyData, onPropertyChange }) => {
  const totalRooms = propertyData?.categoryRooms?.reduce((sum, category) => sum + (category.qty || 0), 0) || 0;

  return (
    <>
      <div className="space-y-4">
        <SectionHeader title="Property Details" icon={Home} />
        <FormItem>
          <FormLabel>Property Type</FormLabel>
          <Select
            value={propertyData.type}
            onValueChange={(value) => onPropertyChange('type', value as PropertyType)}
          >
            <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Hotel">Hotel</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
              <SelectItem value="Hostel">Hostel</SelectItem>
              <SelectItem value="Resort">Resort</SelectItem>
              <SelectItem value="Cottage">Cottage</SelectItem>
              <SelectItem value="Homestay">Homestay</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Property Rating</FormLabel>
            <Select
              value={propertyData.propertyRating ? propertyData.propertyRating.toString() : '0'}
              onValueChange={(value) => onPropertyChange('propertyRating', Number(value))}
            >
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Unrated</SelectItem>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} {rating === 1 ? 'Star' : 'Stars'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem>
            <FormLabel>Google Maps Link (Optional)</FormLabel>
            <Input
              value={propertyData.googleMaps}
              onChange={(e) => onPropertyChange('googleMaps', e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </FormItem>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Location" icon={MapPin} />
        <FormItem>
          <FormLabel>Address</FormLabel>
          <Input
            value={propertyData.location.address}
            onChange={(e) => onPropertyChange('location.address', e.target.value)}
            placeholder="e.g., 123 Main St"
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel>City</FormLabel>
            <Input value={propertyData.location.city} onChange={(e) => onPropertyChange('location.city', e.target.value)} placeholder="e.g., New York" />
          </FormItem>
          <FormItem>
            <FormLabel>State/Province</FormLabel>
            <Input value={propertyData.location.state} onChange={(e) => onPropertyChange('location.state', e.target.value)} placeholder="e.g., NY" />
          </FormItem>
          <FormItem>
            <FormLabel>Country</FormLabel>
            <Input value={propertyData.location.country} onChange={(e) => onPropertyChange('location.country', e.target.value)} placeholder="e.g., USA" />
          </FormItem>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <SectionHeader title="Room & Price Summary (Property Overview)" icon={DollarSign} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Total Rooms Available</FormLabel>
            <div className="p-3 border rounded-md bg-muted text-muted-foreground">
              {totalRooms} {totalRooms === 1 ? 'room' : 'rooms'}
              <p className="text-xs mt-1"> (Calculated from all room categories)</p>
            </div>
          </FormItem>
          {(propertyData?.categoryRooms ?? []).length > 0 && (
            <FormItem>
              <FormLabel>Property Starting Price (per adult)</FormLabel>
              <div className="p-3 border rounded-md bg-muted text-muted-foreground">
                {propertyData.costing.currency} {propertyData.costing.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                {propertyData.costing.discountedPrice > 0 && propertyData.costing.discountedPrice < propertyData.costing.price && (
                  <span className="ml-2 text-green-600 font-semibold">
                    (From: {propertyData.costing.currency} {propertyData.costing.discountedPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})
                  </span>
                )}
                <p className="text-xs mt-1">(Lowest effective per-adult price across all categories & meal plans)</p>
              </div>
            </FormItem>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertyDetailsSection;