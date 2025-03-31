'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import PropertyEditForm from '@/components/manager/EditForms/PropertyEditForm';
import TripEditForm from '@/components/manager/EditForms/TripEditForm';
import TravellingEditForm from '@/components/manager/EditForms/TravellingEditForm';
import { GeneralItem, Review } from '@/types';
import { Image } from '@/lib/mongodb/models/Image';

export default function ItemEdit({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const itemId = resolvedParams.id;
  
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<GeneralItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyDetails, setPropertyDetails] = useState<Property>();
  const [tripDetails, setTripDetails] = useState<Trip>();
  const [travellingDetails, setTravellingDetails] = useState<Travelling>();



  const fetchItemDetails = useCallback( async () => {
    setIsLoading(true);
    try {
      // Try to fetch from all possible endpoints
      const endpoints = [
        { url: `/api/properties/${itemId}`, category: 'properties' },
        { url: `/api/trips/${itemId}`, category: 'trips' },
        { url: `/api/travellings/${itemId}`, category: 'travellings' }
      ];
      
      let foundItem = null;
      let foundCategory = '';
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url);
          
          if (response.ok) {
            const data = await response.json();
            foundItem = data;
            foundCategory = endpoint.category;
            break;
          }
        } catch (error) {
          console.log(`Item not found in ${endpoint.category}`,error);
        }
      }
      
      if (!foundItem) {
        throw new Error('Item not found in any category');
      }
      
      // Create unified item for UI rendering
      const generalItem: GeneralItem = {
        id: itemId,
        title: foundItem.title,
        description: foundItem.description,
        createdAt: foundItem.createdAt || new Date().toISOString(),
        category: foundCategory === 'properties' ? 'Property' : 
                 foundCategory === 'trips' ? 'Trip' : 'Travelling'
      };
      
      setItem(generalItem);
      
      if (foundCategory === 'properties') {
        setPropertyDetails({
          userId: foundItem.userId,
          title: foundItem.title,
          description: foundItem.description,
          costing: {
            price: foundItem.costing.price || 0,
            discountedPrice: foundItem.costing.discountedPrice || 0,
            currency: foundItem.costing.currency || 'USD'
          },
          location: foundItem.location || {
            address: '',
            city: '',
            state: '',
            country: '',
          },
          amenities: foundItem.ammenities || [''],
          startDate: new Date(foundItem.startDate),
          endDate: new Date(foundItem.endDate),
          bannerImage:{
            url: foundItem.bannerImage.url,
            publicId: foundItem.bannerImage.publicId,
            alt: foundItem.bannerImage.alt
          },
          detailImages: foundItem.detailImages?.map((image: Image) => ({
            url: image.url
          })),
          totalRating: foundItem.totalRating || 0,
          review: foundItem.review?.map((review: Review) => ({
            comment: review.comment,
            rating: review.rating
          })) || [],
          bedrooms: foundItem.bedrooms || 0,
          bathrooms: foundItem.bathrooms || 0,
          maximumGuests: foundItem.maximumGuests || 0,
          type: foundItem.type || 'hotel'
        });
      } else if (foundCategory === 'trips') {
        setTripDetails({
          userId: foundItem.userId,
          title: foundItem.title,
          description: foundItem.description,
          bannerImage: {
            url: foundItem.bannerImage.url,
            publicId: foundItem.bannerImage.publicId,
            alt: foundItem.bannerImage.alt
          },
          detailImages: foundItem.detailImages?.map((image: Image) => ({
            url: image.url,
          })),
          type: foundItem.type,
          activities: foundItem.activities || [''],
          destination: {
            city: foundItem.destination.city,
            country: foundItem.destination.country,
            state: foundItem.destination.state
          },
          startDate: new Date(foundItem.startDate),
          endDate: new Date(foundItem.endDate),
          costing: {
            price: foundItem.costing.price || 0,
            currency: foundItem.costing.currency || 'USD',
            discountedPrice: foundItem.costing.discountedPrice || 0
          },
          updatedAt: new Date(foundItem.updatedAt)
        });
      } else {
        setTravellingDetails({
          userId: foundItem.userId,
          title: foundItem.title,
          description: foundItem.description,
          transportation: {
            type: foundItem.transportation.type,
            arrivalTime: new Date(foundItem.transportation.arrivalTime),
            departureTime: new Date(foundItem.transportation.departureTime),
            from: foundItem.transportation.from,
            to: foundItem.transportation.to
          },
          costing: {
            price: foundItem.costing.price,
            discountedPrice: foundItem.costing.discountedPrice,
            currency: foundItem.costing.currency
          },
          totalRating: foundItem.totalRating,
          review: foundItem.review?.map((review: Review) => ({
            comment: review.comment,
            rating: review.rating
          })),
          createdAt: new Date(foundItem.createdAt),
          updatedAt: new Date(foundItem.updatedAt),
          bannerImage: {
            url: foundItem.bannerImage.url,
            publicId: foundItem.bannerImage.publicId,
            alt : foundItem.bannerImage.alt
          },
          detailImages: foundItem.detailImages?.map((image: Image) => ({
            url: image.url
          })),
        });
      }
      
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch item details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  },[itemId, toast]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  const handleSave = async ( updatedData: Property | Trip | Travelling ) => {
    try {
      let endpoint = '';
      switch (item?.category) {
        case 'Property':
          endpoint = `/api/properties/${item?.id}`;
          break;
        case 'Trip':
          endpoint = `/api/trips/${item?.id}`;
          break;
        case 'Travelling':
          endpoint = `/api/travellings/${item?.id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update item');

      toast({ title: 'Success', description: 'Item updated successfully.' });
      router.push(`/manager/dashboard/${item?.id}`);
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push(`/manager/dashboard/${item.id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Details
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit {item.category}</CardTitle>
        </CardHeader>
        <CardContent>
          {item.category === 'Property' && <PropertyEditForm item={propertyDetails!} onSave={handleSave} />}
          {item.category === 'Trip' && <TripEditForm item={tripDetails! } onSave={handleSave} />}
          {item.category === 'Travelling' && <TravellingEditForm item={ travellingDetails! } onSave={handleSave} />}
        </CardContent>
      </Card>
    </div>
  );
}
