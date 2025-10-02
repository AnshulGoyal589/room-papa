// FILE: app/manager/dashboard/[id]/ItemDetailClientView.tsx
// ROLE: A Client Component to handle all user interactions, state, and UI rendering.

'use client';

import React, { useState } from 'react';
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

type ItemData = Property | Trip | Travelling;

// Define the props this component will receive from the server page
interface ItemDetailClientViewProps {
  initialItemData: ItemData;
  initialCategory: string;
}

export default function ItemDetailClientView({ initialItemData, initialCategory }: ItemDetailClientViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Initialize state directly from the props passed by the server.
  // No need for isLoading or useEffect for the initial fetch.
  const [item] = useState(initialItemData);
  const [category] = useState(initialCategory);

  // State for actions like deleting.
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    
    try {
      let endpoint = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemId = (item as any)._id; // All items should have a `_id`
      
      switch (category) {
        case 'Property': endpoint = `/api/properties/${itemId}`; break;
        case 'Trip': endpoint = `/api/trips/${itemId}`; break;
        case 'Travelling': endpoint = `/api/travellings/${itemId}`; break;
      }
      
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      });
      
      router.push('/manager/dashboard');
      router.refresh(); // Tell Next.js to re-fetch dashboard data

    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // The initial "isLoading" and "!item" checks are no longer needed here.
  // The parent Server Component handles the "not found" case.

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
              <Button 
                variant="outline" 
                size="sm" 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => router.push(`/manager/dashboard/edit/${(item as any)._id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : <><Trash2 className="w-4 h-4 mr-2" /> Delete</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{item.description}</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p>{category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p>{new Date((item as any).createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Render specific details based on category, casting the item prop */}
          {category === 'Property' && <PropertyDetails item={item as Property} />}
          {category === 'Trip' && <TripDetails item={item as Trip} />}
          {category === 'Travelling' && <TravellingDetails item={item as Travelling} />}
        </CardContent>
      </Card>
    </div>
  );
}