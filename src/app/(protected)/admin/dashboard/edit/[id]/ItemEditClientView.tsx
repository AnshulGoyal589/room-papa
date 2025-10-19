'use client';

import React, { useState } from 'react';
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

type ItemData = Property | Trip | Travelling;

interface ItemEditClientViewProps {
  initialItemData: ItemData;
  initialCategory: string;
}

export default function ItemEditClientView({ initialItemData, initialCategory }: ItemEditClientViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [item] = useState(initialItemData);
  const [category] = useState(initialCategory);
  
  const handleSave = async (updatedData: ItemData) => {
    try {
      let endpoint = '';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemId = (item as any)._id;

      switch (category) {
        case 'Property': endpoint = `/api/properties/${itemId}`; break;
        case 'Trip': endpoint = `/api/trips/${itemId}`; break;
        case 'Travelling': endpoint = `/api/travellings/${itemId}`; break;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update item');
      }

      toast({ title: 'Success', description: 'Item updated successfully.' });
      router.push(`/admin/dashboard/${itemId}`);
      router.refresh();

    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update item. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Button variant="outline" onClick={() => router.push(`/admin/dashboard/${(item as any)._id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Details
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit {category}: <span className="font-normal">{item.title}</span></CardTitle>
        </CardHeader>
        <CardContent>
          {category === 'Property' && <PropertyEditForm item={item as Property} onSave={handleSave} />}
          {category === 'Trip' && <TripEditForm item={item as Trip} onSave={handleSave} />}
          {category === 'Travelling' && <TravellingEditForm item={item as Travelling} onSave={handleSave} />}
        </CardContent>
      </Card>
    </div>
  );
}