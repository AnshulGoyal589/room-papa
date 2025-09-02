'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListingItem from '@/components/manager/HomePage/ListingItem';
import AddItemModal from '@/components/manager/HomePage/AddItemModal';
import { useToast } from '@/components/ui/use-toast';
import { BaseItem, ItemCategory } from '@/lib/mongodb/models/Components';

// Define the props this component will receive from the server page.
interface DashboardClientViewProps {
  initialItems: BaseItem[];
}

export default function DashboardClientView({ initialItems }: DashboardClientViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Initialize state with the data passed from the server.
  const [items, setItems] = useState<BaseItem[]>(initialItems);
  
  // This loading state is now only for RE-FETCHING data, not the initial load.
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // This function is kept for RE-FETCHING data after an item is added.
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const propertiesRes = await fetch('/api/properties');
      const properties = await propertiesRes.json();
      const formattedProperties = properties.map((prop: BaseItem) => ({...prop, category: 'Property' as ItemCategory, createdAt: new Date(prop.createdAt) }));

      const tripsRes = await fetch('/api/trips');
      const trips = await tripsRes.json();
      const formattedTrips = trips.map((trip: BaseItem) => ({...trip, category: 'Trip' as ItemCategory, createdAt: new Date(trip.createdAt) }));
      
      const travellingsRes = await fetch('/api/travellings');
      const travellings = await travellingsRes.json();
      const formattedTravellings = travellings.map((travelling: BaseItem) => ({ ...travelling, category: 'Travelling' as ItemCategory, createdAt: new Date(travelling.createdAt) }));
      
      const allItems = [...formattedProperties, ...formattedTrips, ...formattedTravellings]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setItems(allItems);
    } catch (error) {
      console.error('Error re-fetching items:', error);
      toast({ title: 'Error', description: 'Failed to refresh items.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  

  const handleAddItem = async () => {
      fetchItems(); // Re-fetch the list to show the new item
      setIsModalOpen(false);
  };

  const handleItemClick = (id: string) => {
    router.push(`/admin/dashboard/${id}`);
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="container mx-auto py-8 px-4 sm:px-8 md:px-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
          {/* This `isLoading` check now only applies when re-fetching. The initial render is never loading. */}
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