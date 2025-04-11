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
import PropertyForm from './PropertyForm';
import TripForm from './TripForm';
import TravellingForm from './TravellingForm';
import { useUser } from "@clerk/nextjs";

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
  const [userID, setUserID] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  // Category specific state
  const [propertyData, setPropertyData] = useState({});

  const [tripData, setTripData] = useState({});

  const [travellingData, setTravellingData] = useState({});

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

      // console.log(tripData);
      
      if (selectedCategory === 'Trip') {
        // const filteredActivities = tripData.activities.filter(activity => activity.trim() !== '');
        finalData = {
          ...tripData,
        //   activityChoices: filteredActivities
        };
        apiRoute = 'trips';
      } else if (selectedCategory === 'Travelling') {
        finalData = travellingData;
        apiRoute = 'travellings';
      } else {
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
        userId: userID,
      };
      
      console.log(newItem);

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

  const renderCategoryForm = () => {
    if (!isAdvancedMode) return null;
    
    switch (selectedCategory) {
      case 'Property':
        return (
          <PropertyForm 
            propertyData ={propertyData} 
            setPropertyData={setPropertyData} 
          />
        );
      
      case 'Trip':
        return (
          <TripForm 
            tripData={tripData} 
            setTripData={setTripData} 
          />
        );
      
      case 'Travelling':
        return (
          <TravellingForm 
            travellingData={travellingData} 
            setTravellingData={setTravellingData} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[60vw] max-h-[90vh] overflow-y-auto">
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
                    onValueChange={(value: unknown) => {
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
            
            {renderCategoryForm()}
            
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