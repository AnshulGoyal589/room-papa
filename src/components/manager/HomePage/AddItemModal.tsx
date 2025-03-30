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
import { ItineraryVisibility, PropertyType, TransportationType, TripType } from '@/types';
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

  const [propertyData, setPropertyData] = useState({
    type: 'hotel' as PropertyType,
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
    },
    amenities: ['wifi'],
    costing:{
      price: 100,
      discountedPrice: 80,
      currency: 'USD',
    },
    bedrooms: 1,
    bathrooms: 1,
    maximumGuests: 2,
    startDate: new Date().toISOString() ,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() ,
    
  });

  const [tripData, setTripData] = useState({
    destination: {
      city: '',
      state: '',
      country: '',
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    type: 'domestic' as TripType,
    costing: {
      price: 1000,
      discountedPrice : 800,
      currency: 'USD',
    },
    domain: 'beach',
    activityChoices: [] as string[],
  });

  const [travellingData, setTravellingData] = useState({
  
    transportation: {
      type: 'flight' as TransportationType,
      departureTime: new Date(),
      arrivalTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      from: 'Mumbai',
      to: 'New York',
    },
    costing: {
      price: 1000,
      discountedPrice: 800,
      currency: 'USD',
    },
    totalRating: 0
  });

  const handlePropertyChange = (field: string, value: any) => {
    // console.log(value);
    // console.log(typeof(value));
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
      
      if (!bannerImage) {
        form.setError('root', { 
          message: 'Banner image is required' 
        });
        setIsSubmitting(false);
        return; 
      }
      
      if (detailImages.length < 3) {
        form.setError('root', { 
          message: 'At least 3 detail images are required' 
        });
        setIsSubmitting(false);
        return;
      }
      
      let apiRoute = 'properties';
      let finalData;
      
      if (selectedCategory === 'Trip') {
        const filteredActivities = tripData.activityChoices.filter(activity => activity.trim() !== '');
        finalData = {
          ...tripData,
          activityChoices: filteredActivities
        };
        apiRoute = 'trips';
      } else if (selectedCategory === 'Travelling') {
        finalData = travellingData;
        apiRoute = 'travellings';
      }else{
        finalData = propertyData;
        apiRoute = 'properties';
      }
      
      if (!apiRoute) {
        form.setError('root', { 
          message: 'Invalid category selected' 
        });
        setIsSubmitting(false);
        return;
      }
      
      const newItem = {
        title: values.title,
        description: values.description,
        ...finalData,
        bannerImage,
        detailImages,
        ownerId: userID,
      };

      // console.log(finalData.startDate);
      // console.log(typeof(finalData.startDate));
      
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
                <FormLabel>Start Date</FormLabel>
                <Input 
                  type="date"
                  value={propertyData.startDate }
                  onChange={(e) => handlePropertyChange('startDate',e.target.value)}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <Input 
                  type="date"
                  value={propertyData.endDate }
                  onChange={(e) => handlePropertyChange('endDate',e.target.value)}
                />
              </FormItem>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>City</FormLabel>
                <Input 
                  value={propertyData.location.city}
                  onChange={(e) => handlePropertyChange('location.city', e.target.value)}
                  placeholder="Enter city"
                />
              </FormItem>
              <FormItem>
                <FormLabel>State</FormLabel>
                <Input 
                  value={propertyData.location.state}
                  onChange={(e) => handlePropertyChange('location.state', e.target.value)}
                  placeholder="Enter State"
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>Price per Night</FormLabel>
                <Input 
                  type="number"
                  value={propertyData.costing.price}
                  onChange={(e) => handlePropertyChange('costing.price', Number(e.target.value))}
                  min={1}
                />
              </FormItem>
              <FormItem>
                <FormLabel>Discounted Price per Night</FormLabel>
                <Input 
                  type="number"
                  value={propertyData.costing.discountedPrice}
                  onChange={(e) => handlePropertyChange('costing.discountedPrice ', Number(e.target.value))}
                  min={1}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={propertyData.costing.currency}
                  onValueChange={(value) => handlePropertyChange('costing.currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
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
          <div className="space-y-4 overflow-y-auto p-2">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <Input 
                  type="date"
                  value={tripData.startDate.toISOString().split('T')[0]  }
                  onChange={(e) => handleTripChange('startDate', new Date(e.target.value))}
                />
              </FormItem>
              
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <Input 
                  type="date"
                  value={tripData.endDate.toISOString().split('T')[0] }
                  onChange={(e) => handleTripChange('endDate', new Date(e.target.value))}
                />
              </FormItem>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>City</FormLabel>
                <Input 
                  value={tripData.destination.city}
                  onChange={(e) => handleTripChange('destination.city', e.target.value)}
                  placeholder="Enter city"
                />
              </FormItem>

              <FormItem>
                <FormLabel>State</FormLabel>
                <Input 
                  value={tripData.destination.state}
                  onChange={(e) => handleTripChange('destination.state', e.target.value)}
                  placeholder="Enter State"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
              <FormItem>
                <FormLabel>Major Domain</FormLabel>
                <Select
                  value={tripData.domain}
                  onValueChange={(value) => handleTripChange('domain', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beach">Beach Getaway</SelectItem>
                    <SelectItem value="mountain">Mountain Retreat</SelectItem>
                    <SelectItem value="cultural">Cultural Experience</SelectItem>
                    <SelectItem value="wildlife">Wildlife Adventure</SelectItem>
                    <SelectItem value="city">City Exploration</SelectItem>
                    <SelectItem value="heritage">Heritage Sites</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={tripData.type}
                  onValueChange={(value) => handleTripChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">Domestic</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

            </div>


            <FormItem>
              <FormLabel>Activity Choices</FormLabel>
              <div className="space-y-2">
                {tripData.activityChoices.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input 
                      value={activity}
                      onChange={(e) => {
                        const newActivities = [...tripData.activityChoices];
                        newActivities[index] = e.target.value;
                        handleTripChange('activityChoices', newActivities);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newActivities = tripData.activityChoices.filter((_, i) => i !== index);
                        handleTripChange('activityChoices', newActivities);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => {
                    handleTripChange('activityChoices', [...tripData.activityChoices, '']);
                  }}
                >
                  Add Activity Choice
                </Button>
              </div>
            </FormItem>
          
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormItem>
                  <FormLabel>Total Price</FormLabel>
                  <Input 
                    type="number"
                    value={tripData.costing.price}
                    onChange={(e) => handleTripChange('costing.price', Number(e.target.value))}
                    min={0}
                  />
                </FormItem>
                <FormItem>
                  <FormLabel>Discounted Price</FormLabel>
                  <Input 
                    type="number"
                    value={tripData.costing.discountedPrice}
                    onChange={(e) => handleTripChange('costing.discountedPrice', Number(e.target.value))}
                    min={0}
                  />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={tripData.costing.currency}
                    onValueChange={(value) => handleTripChange('costing.currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
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
              <FormLabel>Transportation Type</FormLabel>
              <Select
                value={travellingData.transportation.type}
                onValueChange={(value) => handleTravellingChange('transportation.type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transportation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Departure Time</FormLabel>
                <Input 
                  type="date"
                  value={travellingData.transportation.departureTime.toISOString().split('T')[0]}
                  onChange={(e) => handleTravellingChange('transportation.departureTime', new Date(e.target.value))}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Arrival Time</FormLabel>
                <Input 
                  type="date"
                  value={travellingData.transportation.arrivalTime.toISOString().split('T')[0] }
                  onChange={(e) => handleTravellingChange('transportation.arrivalTime', new Date(e.target.value))}
                />
              </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>From</FormLabel>
                <Input 
                  value={travellingData.transportation.from}
                  onChange={(e) => handleTravellingChange('transportation.from', e.target.value)}
                  placeholder="Enter departure location"
                />
              </FormItem>

              <FormItem>
                <FormLabel>To</FormLabel>
                <Input 
                  value={travellingData.transportation.to}
                  onChange={(e) => handleTravellingChange('transportation.to', e.target.value)}
                  placeholder="Enter arrival location"
                />
              </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>Price</FormLabel>
                <Input 
                  type="number"
                  value={travellingData.costing.price}
                  onChange={(e) => handleTravellingChange('costing.price', Number(e.target.value))}
                  min={0}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Discounted Price</FormLabel>
                <Input 
                  type="number"
                  value={travellingData.costing.discountedPrice}
                  onChange={(e) => handleTravellingChange('costing.discountedPrice', Number(e.target.value))}
                  min={0}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={travellingData.costing.currency}
                  onValueChange={(value) => handleTravellingChange('costing.currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
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