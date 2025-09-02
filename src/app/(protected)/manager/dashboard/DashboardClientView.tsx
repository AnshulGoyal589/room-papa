// FILE: app/manager/dashboard/DashboardClientView.tsx
// ROLE: A Client Component to handle all dashboard UI, state, and interactions.

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListingItem from '@/components/manager/HomePage/ListingItem';
import AddItemModal from '@/components/manager/HomePage/AddItemModal';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@clerk/nextjs'; // Can still be used for client-side user info if needed
import { BaseItem, ItemCategory } from '@/lib/mongodb/models/Components';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';

interface DashboardClientViewProps {
  initialItems: BaseItem[];
}

export default function DashboardClientView({ initialItems }: DashboardClientViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser(); // Still available for client-side needs, like the modal.

  // Initialize state with the data passed from the server.
  const [items, setItems] = useState<BaseItem[]>(initialItems);
  
  // This loading state is now only for RE-FETCHING data, not the initial load.
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // This function's role is now to REFRESH the data after an action.
  const refreshItems = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const propertiesRes = await fetch(`/api/properties?userId=${user.id}`);
      const tripsRes = await fetch(`/api/trips?userId=${user.id}`);
      const travellingsRes = await fetch(`/api/travellings?userId=${user.id}`);

      const properties: Property[] = await propertiesRes.json();
      const trips: Trip[] = await tripsRes.json();
      const travellings: Travelling[] = await travellingsRes.json();

      const formattedProperties = properties.map(p => ({
        ...p,
        category: 'Property' as ItemCategory,
        createdAt: new Date(p.createdAt!),
        _id: p._id ? p._id.toString() : undefined,
        title: p.title ?? '', // Ensure title is always a string
        description: p.description ?? '', // If description is required
      }));
      const formattedTrips = trips.map(t => ({
        ...t,
        category: 'Trip' as ItemCategory,
        createdAt: new Date(t.createdAt!),
        _id: t._id ? t._id.toString() : undefined,
        title: t.title ?? '',
        description: t.description ?? '',
      }));
      const formattedTravellings = travellings.map(tv => ({
        ...tv,
        category: 'Travelling' as ItemCategory,
        createdAt: new Date(tv.createdAt!),
        _id: tv._id ? tv._id.toString() : undefined,
        title: tv.title ?? '',
        description: tv.description ?? '',
      }));

      const allItems = [...formattedProperties, ...formattedTrips, ...formattedTravellings]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setItems(allItems);
    } catch (error) {
      console.error('Error refreshing items:', error);
      toast({ title: 'Error', description: 'Failed to refresh the list of items.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // REMOVED: The initial useEffect to fetch data is gone. The page loads instantly with data.

  const handleAddItem = () => {
    refreshItems(); // Refresh the list to show the newly added item.
    setIsModalOpen(false);
  };

  const handleItemClick = (id: string) => {
    router.push(`/manager/dashboard/${id}`);
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="container mx-auto py-8 px-4 sm:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Add New Item
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="trip">Trip</TabsTrigger>
          <TabsTrigger value="travelling">Travelling</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* This isLoading check now only applies when refreshing. The initial render is never "loading". */}
          {isLoading ? (
            <div className="text-center py-8">Refreshing items...</div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  {activeTab === 'all' ? 'No items found. Add a new item to get started.' : `No items found in the "${activeTab}" category.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ListingItem 
                  key={item._id} 
                  item={item} 
                  onClick={() => handleItemClick(item._id as string)} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <AddItemModal 
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddItem} 
        />
      )}
    </div>
  );
}