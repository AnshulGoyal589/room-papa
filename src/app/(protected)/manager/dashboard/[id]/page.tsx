'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PropertyDetails from '@/components/manager/HomePage/PropertyDetails';
import TripDetails from '@/components/manager/HomePage/TripDetails';
import StatusUpdateModal from '@/components/manager/HomePage/StatusUpdateModal';
import TravellingDetails from '@/components/manager/HomePage/TravellingDetails';
import { useToast } from '@/components/ui/use-toast';

export type PropertyType = 'hotel' | 'apartment' | 'villa' | 'hostel' | 'resort';
export type PropertyAmenities = 'wifi' | 'pool' | 'gym' | 'spa' | 'restaurant' | 'parking' | 'airConditioning' | 'breakfast';
export type ItineraryVisibility = 'private' | 'shared' | 'public';
export type ItineraryDayWeather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'unknown';
export type TransportationType = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
// Imported from Trip schema
export type TripStatus = 'planned' | 'booked' | 'ongoing' | 'completed' | 'cancelled';

// Define our item types
type ItemCategory = 'Property' | 'Trip' | 'Travelling';

interface BaseItem {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: string;
  createdAt: Date;
}

// Property-specific interface extending BaseItem
interface PropertyItem extends BaseItem {
  category: 'Property';
  location: {
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  maximumGuests: number;
  amenities: PropertyAmenities[];
  images: string[];
  type: PropertyType;
  rating?: number;
  reviewCount?: number;
}

// Updated Trip-specific interface extending BaseItem to match the Trip schema
interface TripItem extends BaseItem {
  category: 'Trip';
  destination: {
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  startDate: Date;
  endDate: Date;
  budget?: {
    amount: number;
    currency: string;
    spent?: number;
  };
  accommodations: {
    propertyId: string;
    checkIn: Date;
    checkOut: Date;
    confirmationCode?: string;
    price: number;
  }[];
  transportation: {
    type: TransportationType;
    departureLocation: string;
    arrivalLocation: string;
    departureTime: Date;
    arrivalTime: Date;
    confirmationCode?: string;
    price?: number;
    provider?: string;
  }[];
  activities: {
    name: string;
    date: Date;
    location: string;
    duration?: number;
    price?: number;
    booked: boolean;
    confirmationCode?: string;
  }[];
  totalCost?: number;
  notes?: string;
  sharedWith?: string[];
  updatedAt: Date;
  userId: string;
}

// Updated Travelling-specific interface extending BaseItem
interface TravellingItem extends BaseItem {
  category: 'Travelling';
  tripId: string;
  userId: string;
  updatedAt: Date;
  visibility: ItineraryVisibility;
  days: {
    date: Date;
    weather?: ItineraryDayWeather;
    temperature?: {
      min: number;
      max: number;
      unit: 'celsius' | 'fahrenheit';
    };
    activities: {
      title: string;
      startTime: Date;
      endTime: Date;
      location?: {
        name: string;
        address?: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        }
      };
      category?: string;
      notes?: string;
      cost?: number;
      bookingReference?: string;
      completed?: boolean;
    }[];
    accommodation?: {
      propertyId: string;
      name: string;
      address?: string;
    };
    transportation?: {
      type: TransportationType;
      departureTime: Date;
      arrivalTime: Date;
      from: string;
      to: string;
      notes?: string;
    }[];
    notes?: string;
    dailyBudget?: {
      planned: number;
      actual?: number;
    };
  }[];
  tags?: string[];
  totalDistance?: number;
  estimatedCost?: number;
  currency?: string;
  attachments?: {
    name: string;
    fileUrl: string;
    type: string;
    uploadedAt: Date;
  }[];
  likes?: number;
  comments?: {
    userId: string;
    text: string;
    timestamp: Date;
  }[];
}

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params with React.use()
  const resolvedParams = React.use(params);
  const itemId = resolvedParams.id;
  
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<BaseItem | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<PropertyItem | null>(null);
  const [tripDetails, setTripDetails] = useState<TripItem | null>(null);
  const [travellingDetails, setTravellingDetails] = useState<TravellingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [itemCategory, setItemCategory] = useState<string>('');

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
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
      
      // Try each endpoint until we find the item
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
          console.log(`Item not found in ${endpoint.category}`);
        }
      }
      
      if (!foundItem) {
        throw new Error('Item not found in any category');
      }
      
      setItemCategory(foundCategory);
      
      // Format base item
      let formattedBaseItem: BaseItem;
      
      if (foundCategory === 'properties') {
        formattedBaseItem = {
          id: foundItem._id || foundItem.id,
          title: foundItem.name,
          description: foundItem.description,
          category: 'Property',
          status: foundItem.active ? 'Active' : 'Inactive',
          createdAt: new Date(foundItem.createdAt)
        };
        
        // Format property details
        setPropertyDetails({
          ...formattedBaseItem,
          category: 'Property',
          location: foundItem.location || {
            address: '',
            city: '',
            country: '',
          },
          price: foundItem.pricePerNight || 0,
          currency: foundItem.currency || 'USD',
          bedrooms: foundItem.bedrooms || 0,
          bathrooms: foundItem.bathrooms || 0,
          maximumGuests: foundItem.maximumGuests || 0,
          amenities: foundItem.amenities || [],
          images: foundItem.images || [],
          type: foundItem.type || 'hotel',
          rating: foundItem.rating,
          reviewCount: foundItem.reviewCount
        });
      } else if (foundCategory === 'trips') {
        formattedBaseItem = {
          id: foundItem._id || foundItem.id,
          title: foundItem.title,
          description: foundItem.description || '',
          category: 'Trip',
          status: foundItem.status.charAt(0).toUpperCase() + foundItem.status.slice(1),
          createdAt: new Date(foundItem.createdAt)
        };
        
        // Format trip details using the updated schema
        setTripDetails({
          ...formattedBaseItem,
          category: 'Trip',
          userId: foundItem.userId,
          destination: {
            city: foundItem.destination.city,
            country: foundItem.destination.country,
            coordinates: foundItem.destination.coordinates
          },
          startDate: new Date(foundItem.startDate),
          endDate: new Date(foundItem.endDate),
          budget: foundItem.budget ? {
            amount: foundItem.budget.amount || 0,
            currency: foundItem.budget.currency || 'USD',
            spent: foundItem.budget.spent
          } : undefined,
          accommodations: foundItem.accommodations?.map((acc: any) => ({
            propertyId: acc.propertyId,
            checkIn: new Date(acc.checkIn),
            checkOut: new Date(acc.checkOut),
            confirmationCode: acc.confirmationCode,
            price: acc.price
          })) || [],
          transportation: foundItem.transportation?.map((trans: any) => ({
            type: trans.type,
            departureLocation: trans.departureLocation,
            arrivalLocation: trans.arrivalLocation,
            departureTime: new Date(trans.departureTime),
            arrivalTime: new Date(trans.arrivalTime),
            confirmationCode: trans.confirmationCode,
            price: trans.price,
            provider: trans.provider
          })) || [],
          activities: foundItem.activities?.map((act: any) => ({
            name: act.name,
            date: new Date(act.date),
            location: act.location,
            duration: act.duration,
            price: act.price,
            booked: act.booked,
            confirmationCode: act.confirmationCode
          })) || [],
          totalCost: foundItem.totalCost,
          notes: foundItem.notes,
          sharedWith: foundItem.sharedWith,
          updatedAt: new Date(foundItem.updatedAt)
        });
      } else {
        formattedBaseItem = {
          id: foundItem._id || foundItem.id,
          title: foundItem.title,
          description: foundItem.description || '',
          category: 'Travelling',
          status: foundItem.visibility.charAt(0).toUpperCase() + foundItem.visibility.slice(1),
          createdAt: new Date(foundItem.createdAt)
        };
        
        // Format travelling details using the comprehensive schema
        setTravellingDetails({
          ...formattedBaseItem,
          category: 'Travelling',
          tripId: foundItem.tripId,
          userId: foundItem.userId,
          updatedAt: new Date(foundItem.updatedAt),
          visibility: foundItem.visibility,
          days: foundItem.days.map((day: any) => ({
            date: new Date(day.date),
            weather: day.weather,
            temperature: day.temperature,
            activities: day.activities.map((activity: any) => ({
              title: activity.title,
              startTime: new Date(activity.startTime),
              endTime: new Date(activity.endTime),
              location: activity.location,
              category: activity.category,
              notes: activity.notes,
              cost: activity.cost,
              bookingReference: activity.bookingReference,
              completed: activity.completed
            })),
            accommodation: day.accommodation,
            transportation: day.transportation?.map((trans: any) => ({
              type: trans.type,
              departureTime: new Date(trans.departureTime),
              arrivalTime: new Date(trans.arrivalTime),
              from: trans.from,
              to: trans.to,
              notes: trans.notes
            })),
            notes: day.notes,
            dailyBudget: day.dailyBudget
          })),
          tags: foundItem.tags,
          totalDistance: foundItem.totalDistance,
          estimatedCost: foundItem.estimatedCost,
          currency: foundItem.currency,
          attachments: foundItem.attachments?.map((attachment: any) => ({
            name: attachment.name,
            fileUrl: attachment.fileUrl,
            type: attachment.type,
            uploadedAt: new Date(attachment.uploadedAt)
          })),
          likes: foundItem.likes,
          comments: foundItem.comments?.map((comment: any) => ({
            userId: comment.userId,
            text: comment.text,
            timestamp: new Date(comment.timestamp)
          }))
        });
      }
      
      setItem(formattedBaseItem);
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
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!item) return;
    
    try {
      let endpoint = '';
      let data = {};
      
      switch (item.category) {
        case 'Property':
          endpoint = `/api/properties/${item.id}`;
          data = { active: newStatus.toLowerCase() === 'active' };
          break;
        case 'Trip':
          endpoint = `/api/trips/${item.id}`;
          data = { status: newStatus.toLowerCase() };
          break;
        case 'Travelling':
          endpoint = `/api/travellings/${item.id}`;
          data = { visibility: newStatus.toLowerCase() };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Update local state
      setItem(prev => prev ? {...prev, status: newStatus} : null);
      
      // Update specific type states as well
      if (item.category === 'Property' && propertyDetails) {
        setPropertyDetails(prev => prev ? {...prev, status: newStatus} : null);
      } else if (item.category === 'Trip' && tripDetails) {
        setTripDetails(prev => prev ? {...prev, status: newStatus} : null);
      } else if (item.category === 'Travelling' && travellingDetails) {
        setTravellingDetails(prev => prev ? {...prev, status: newStatus} : null);
      }
      
      toast({
        title: 'Success',
        description: 'Status updated successfully.',
      });
      
      setIsStatusModalOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive'
      });
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'cancelled':
      case 'private':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
      case 'ongoing':
      case 'planned':
      case 'booked':
      case 'shared':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
              <CardTitle className="mt-2 text-2xl">{item.title}</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(true)}>
                Update Status
              </Button>
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

      {isStatusModalOpen && (
        <StatusUpdateModal
          currentStatus={item.status}
          onClose={() => setIsStatusModalOpen(false)}
          onUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}