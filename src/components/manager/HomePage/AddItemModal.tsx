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
import { Checkbox } from "@/components/ui/checkbox"; // Added
import { Label } from "@/components/ui/label"; // Added
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ImageUpload from '@/components/cloudinary/ImageUpload';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import PropertyForm from './PropertyForm';
import TripForm from './TripForm';
import TravellingForm from './TravellingForm';
import { useUser } from "@clerk/nextjs";
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import { Image } from '@/lib/mongodb/models/Components';

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
      
      if (selectedCategory === 'Trip') {
        finalData = { ...tripData };
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
    // No need to check isAdvancedMode here, it's checked by the caller
    switch (selectedCategory) {
      case 'Property':
        return (
          <PropertyForm
            propertyData={{
              ...(propertyData as Property),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              categoryRooms: (propertyData as any).categoryRooms ?? [],
            }}
            setPropertyData={setPropertyData}
          />
        );
      case 'Trip':
        return <TripForm tripData={tripData as Trip} setTripData={setTripData} />;
      case 'Travelling':
        return <TravellingForm travellingData={travellingData as Travelling} setTravellingData={setTravellingData} />;
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-4 px-1">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
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
                      onValueChange={(value: z.infer<typeof formSchema>['category']) => {
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Property">Property</SelectItem>
                        {/* <SelectItem value="Trip">Trip</SelectItem>
                        <SelectItem value="Travelling">Travelling</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Section 2: Media Uploads */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-foreground tracking-tight">Media</h3>
              <FormItem>
                <FormLabel>Banner Image</FormLabel>
                <ImageUpload
                  label='banner image'
                  value={bannerImage}
                  onChange={(image) => setBannerImage(image)}
                />
                {/* Specific banner image errors (like 'required') are handled by form.setError('root') and shown below */}
              </FormItem>
              
              <FormItem>
                <FormLabel>Detail Images (minimum 3)</FormLabel>
                <MultipleImageUpload
                  label='detail images'
                  value={detailImages}
                  onChange={(images) => setDetailImages(images)}
                  maxImages={10}
                />
                {/* Specific detail images errors (like 'min 3') are handled by form.setError('root') and shown below */}
              </FormItem>
            </div>
            
            {/* Section 3: Advanced Category Options */}
            <div className="pt-6 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advanced-mode-checkbox"
                  checked={isAdvancedMode}
                  onCheckedChange={(checked) => setIsAdvancedMode(Boolean(checked))}
                />
                <Label htmlFor="advanced-mode-checkbox" className="text-sm font-medium cursor-pointer select-none">
                  Configure Advanced Options
                </Label>
              </div>

              {isAdvancedMode && (
                <div className="mt-4">
                  {selectedCategory ? (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h3 className="text-md font-semibold mb-4 text-foreground">
                        {`Advanced ${selectedCategory} Details`}
                      </h3>
                      {renderCategoryForm()}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg bg-muted/20 text-center">
                      <p className="text-sm text-muted-foreground">
                        Please select a category above to configure its advanced options.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Form-level error message (includes image validation errors from onSubmit) */}
            {form.formState.errors.root?.message && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root?.message}
                </p>
              </div>
            )}
            
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;