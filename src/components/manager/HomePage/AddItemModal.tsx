"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ImageUpload from '@/components/cloudinary/ImageUpload';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { Image } from '@/lib/mongodb/models/Image';
import { ItineraryVisibility, PropertyType, TripStatus } from '@/types';
import { useUser } from "@clerk/nextjs";
import { Description } from '@radix-ui/react-dialog';


interface AddItemModalProps {
  onClose: () => void;
  onAdd: () => void;
}

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  category: z.enum(['Property', 'Trip', 'Travelling']),
});

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAdd }) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerImage, setBannerImage] = useState<Image | null>(null);
  const [detailImages, setDetailImages] = useState<Image[]>([]);
  const [userID , setUserID] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      setUserID(user.id);
    }
  }, [isLoaded, user]);


  
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: ''
    },
  });

  const selectedCategory = form.watch('category');

  // Form fields specific to each category
  const [propertyData, setPropertyData] = useState({
    type: 'hotel' as PropertyType,
    location: {
      address: '',
      city: '',
      country: '',
    },
    amenities: ['wifi'],
    pricePerNight: 100,
    currency: 'USD',
    bedrooms: 1,
    bathrooms: 1,
    maximumGuests: 2,
    active: true,
  });

  const [tripData, setTripData] = useState({
    destination: {
      city: '',
      country: '',
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'planned' as TripStatus,
    budget: {
      amount: 1000,
      currency: 'USD',
    },
    accommodations: [],
    transportation: [],
    activities: [],
  });

  const [travellingData, setTravellingData] = useState({
    tripId: '',
    visibility: 'private' as ItineraryVisibility,
    status: 'planned',
    days: [
      {
        date: new Date().toISOString().split('T')[0],
        activities: [],
        weather: 'unknown',
      }
    ],
    tags: [],
  });

  const handlePropertyChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPropertyData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setPropertyData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleTripChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTripData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setTripData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleTravellingChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTravellingData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setTravellingData(prev => ({ ...prev, [field]: value }));
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Validate image requirements
      if (!bannerImage) {
        form.setError('root', { 
          message: 'Banner image is required' 
        });
        setIsSubmitting(false);
        return; // Make sure to return here
      }
      
      if (detailImages.length < 3) {
        form.setError('root', { 
          message: 'At least 3 detail images are required' 
        });
        setIsSubmitting(false);
        return; // Make sure to return here
      }
      
      let additionalData: Record<string, any> = {};
      let apiRoute = '';
      
      // Add category-specific data
      if (selectedCategory === 'Property') {
        additionalData = {
          ...propertyData,
          ownerId: userID,
        };
        apiRoute = 'properties';
      } else if (selectedCategory === 'Trip') {
        additionalData = {
          ...tripData,
          ownerId: userID,
        };
        apiRoute = 'trips';
      } else if (selectedCategory === 'Travelling') {
        additionalData = {
          ...travellingData,
          ownerId: userID,
        };
        apiRoute = 'travellings';
      }
      
      if (!apiRoute) {
        form.setError('root', { 
          message: 'Invalid category selected' 
        });
        setIsSubmitting(false);
        return; // Make sure to return here
      }
      
      // Combine the form values with additional data and images
      const newItem = {
        ...values,
        ...additionalData,
        bannerImage,
        detailImages
      };
      // console.log(newItem);
      const response = await fetch(`/api/${apiRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save item');
      }
      
      const result = await response.json();
      onAdd();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      form.setError('root', { 
        message: 'An error occurred while saving. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render additional fields based on the selected category
  const renderCategoryFields = () => {
    if (!isAdvancedMode) return null;
    
    switch (selectedCategory) {
      case 'Property':
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select
                value={propertyData.type}
                onValueChange={(value) => handlePropertyChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="resort">Resort</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            
            <FormItem>
              <FormLabel>Address</FormLabel>
              <Input 
                value={propertyData.location.address}
                onChange={(e) => handlePropertyChange('location.address', e.target.value)}
                placeholder="Enter address"
              />
            </FormItem>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>City</FormLabel>
                <Input 
                  value={propertyData.location.city}
                  onChange={(e) => handlePropertyChange('location.city', e.target.value)}
                  placeholder="Enter city"
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Input 
                  value={propertyData.location.country}
                  onChange={(e) => handlePropertyChange('location.country', e.target.value)}
                  placeholder="Enter country"
                />
              </FormItem>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Price per Night</FormLabel>
                <Input 
                  type="number"
                  value={propertyData.pricePerNight}
                  onChange={(e) => handlePropertyChange('pricePerNight', Number(e.target.value))}
                  min={1}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={propertyData.currency}
                  onValueChange={(value) => handlePropertyChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <Input 
                  type="number"
                  value={propertyData.bedrooms}
                  onChange={(e) => handlePropertyChange('bedrooms', Number(e.target.value))}
                  min={1}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <Input 
                  type="number"
                  value={propertyData.bathrooms}
                  onChange={(e) => handlePropertyChange('bathrooms', Number(e.target.value))}
                  min={1}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Max Guests</FormLabel>
                <Input 
                  type="number"
                  value={propertyData.maximumGuests}
                  onChange={(e) => handlePropertyChange('maximumGuests', Number(e.target.value))}
                  min={1}
                />
              </FormItem>
            </div>
            
            <FormItem>
              <FormLabel>Amenities</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfast'].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      id={amenity}
                      checked={propertyData.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handlePropertyChange('amenities', [...propertyData.amenities, amenity]);
                        } else {
                          handlePropertyChange('amenities', propertyData.amenities.filter(a => a !== amenity));
                        }
                      }}
                    />
                    <label htmlFor={amenity} className="text-sm capitalize">
                      {amenity === 'airConditioning' ? 'Air Conditioning' : amenity}
                    </label>
                  </div>
                ))}
              </div>
            </FormItem>
          </div>
        );
      
      case 'Trip':
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <Input 
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => handleTripChange('startDate', e.target.value)}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <Input 
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => handleTripChange('endDate', e.target.value)}
                />
              </FormItem>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>City</FormLabel>
                <Input 
                  value={tripData.destination.city}
                  onChange={(e) => handleTripChange('destination.city', e.target.value)}
                  placeholder="Enter city"
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Input 
                  value={tripData.destination.country}
                  onChange={(e) => handleTripChange('destination.country', e.target.value)}
                  placeholder="Enter country"
                />
              </FormItem>
            </div>
            
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                value={tripData.status}
                onValueChange={(value) => handleTripChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            

            {/* </Select>
            </FormItem> */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Budget Amount</FormLabel>
                <Input 
                  type="number"
                  value={tripData.budget.amount}
                  onChange={(e) => handleTripChange('budget.amount', Number(e.target.value))}
                  min={0}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={tripData.budget.currency}
                  onValueChange={(value) => handleTripChange('budget.currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </div>
          </div>
        );
      
      case 'Travelling':
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            <FormItem>
              <FormLabel>Trip ID</FormLabel>
              <Input 
                value={travellingData.tripId}
                onChange={(e) => handleTravellingChange('tripId', e.target.value)}
                placeholder="Enter associated trip ID"
              />
            </FormItem>
            
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select
                value={travellingData.visibility}
                onValueChange={(value) => handleTravellingChange('visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                value={travellingData.status}
                onValueChange={(value) => handleTravellingChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            
            <FormItem>
              <FormLabel>Tags (comma separated)</FormLabel>
              <Input 
                value={travellingData.tags.join(', ')}
                onChange={(e) => {
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  handleTravellingChange('tags', tagsArray);
                }}
                placeholder="Enter tags"
              />
            </FormItem>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter title" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter description" className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: any) => {
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Property">Property</SelectItem>
                      <SelectItem value="Trip">Trip</SelectItem>
                      <SelectItem value="Travelling">Travelling</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Banner Image</FormLabel>
                <ImageUpload
                  label='banner image'
                  value={bannerImage}
                  onChange={(image) => setBannerImage(image)}
                />
                {form.formState.errors.root?.message && (
                  <p className="text-red-500 text-sm">{form.formState.errors.root?.message}</p>
                )}
              </FormItem>
              
              <FormItem>
                <FormLabel>Detail Images (min 3)</FormLabel>
                <MultipleImageUpload
                  label='detail images'
                  value={detailImages}
                  onChange={(images) => setDetailImages(images)}
                  maxImages={10}
                />
              </FormItem>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="advanced-mode"
                checked={isAdvancedMode}
                onChange={() => setIsAdvancedMode(!isAdvancedMode)}
              />
              <label htmlFor="advanced-mode" className="text-sm">
                Show Advanced Options
              </label>
            </div>
            
            {renderCategoryFields()}
            
            {form.formState.errors.root?.message && (
              <p className="text-red-500 text-sm">{form.formState.errors.root?.message}</p>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;