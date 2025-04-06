'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PropertyDetails from '@/components/manager/HomePage/PropertyDetails';
import TripDetails from '@/components/manager/HomePage/TripDetails';
import TravellingDetails from '@/components/manager/HomePage/TravellingDetails';
import { useToast } from '@/components/ui/use-toast';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import { GeneralItem, Image, Review } from '@/types';


export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {

  const resolvedParams = React.use(params);
  const itemId = resolvedParams.id;
  
  const router = useRouter();
  const { toast } = useToast();
  const [propertyDetails, setPropertyDetails] = useState<Property>();
  const [tripDetails, setTripDetails] = useState<Trip | null>(null);
  const [travellingDetails, setTravellingDetails] = useState<Travelling | null>(null);
  const [item, setItem] = useState<GeneralItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  const fetchItemDetails = useCallback( async () => {
    setIsLoading(true);
    try {
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
      
      const generalItem : GeneralItem = {
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
          amenities: foundItem.amenities || [''],
          startDate: foundItem.startDate,
          endDate: foundItem.endDate,
          bannerImage: {
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
          rooms: foundItem.rooms || 0,
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
          startDate: foundItem.startDate,
          endDate: foundItem.endDate,
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
            arrivalTime: foundItem.transportation.arrivalTime,
            departureTime: foundItem.transportation.departureTime,
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
  },[toast, itemId]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);


  const handleDelete = async () => {
    if (!item) return;
    
    try {
      let endpoint = '';
      
      switch (item.category) {
        case 'Property':
          endpoint = `/api/properties/${item.id}`;
          break;
        case 'Trip':
          endpoint = `/api/trips/${item.id}`;
          break;
        case 'Travelling':
          endpoint = `/api/travellings/${item.id}`;
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      });
      
      router.push('/manager/dashboard');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Loading item details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Item not found</div>
        <Button onClick={() => router.push('/manager/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/manager/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
             
              <CardTitle className="mt-2 text-2xl">{item.title}</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/manager/dashboard/edit/${item.id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-red-500" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{item.description}</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p>{item.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p>{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Render specific details based on category */}
          {item.category === 'Property' && propertyDetails && <PropertyDetails item={propertyDetails} />}
          {item.category === 'Trip' && tripDetails && <TripDetails item={tripDetails} />}
          {item.category === 'Travelling' && travellingDetails && <TravellingDetails item={travellingDetails} />}
        </CardContent>
      </Card>

    </div>
  );
}