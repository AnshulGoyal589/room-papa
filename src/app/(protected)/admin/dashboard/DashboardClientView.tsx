'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListingItem from '@/components/manager/HomePage/ListingItem';
import AddItemModal from '@/components/manager/HomePage/AddItemModal';
// import { useToast } from '@/components/ui/use-toast';
import { BaseItem } from '@/lib/mongodb/models/Components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardClientView({ initialItems }: any) {
  const router = useRouter();
  // const { toast } = useToast();

  // const [items, setItems] = useState<BaseItem[]>(initialItems);
  
  // const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // const fetchItems = useCallback(async () => {
  //   setIsLoading(true);
  //   try {
  //     const propertiesRes = await fetch('/api/properties');
  //     const properties = await propertiesRes.json();
  //     const formattedProperties = properties.map((prop: BaseItem) => ({...prop, category: 'Property' as ItemCategory, createdAt: new Date(prop.createdAt) }));

  //     const tripsRes = await fetch('/api/trips');
  //     const trips = await tripsRes.json();
  //     const formattedTrips = trips.map((trip: BaseItem) => ({...trip, category: 'Trip' as ItemCategory, createdAt: new Date(trip.createdAt) }));
      
  //     const travellingsRes = await fetch('/api/travellings');
  //     const travellings = await travellingsRes.json();
  //     const formattedTravellings = travellings.map((travelling: BaseItem) => ({ ...travelling, category: 'Travelling' as ItemCategory, createdAt: new Date(travelling.createdAt) }));
      
  //     const allItems = [...formattedProperties, ...formattedTrips, ...formattedTravellings]
  //       .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  //     setItems(allItems);
  //   } catch (error) {
  //     console.error('Error re-fetching items:', error);
  //     toast({ title: 'Error', description: 'Failed to refresh items.', variant: 'destructive' });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [toast]);
  

  const handleAddItem = async () => {
      // fetchItems();
      router.refresh();
      setIsModalOpen(false);
  };

  const handleItemClick = (id: string) => {
    router.push(`/admin/dashboard/${id}`);
  };

  const filteredItems = activeTab === 'all' 
    ? initialItems 
    : initialItems.filter((item: BaseItem) => item.category.toLowerCase() === activeTab.toLowerCase());

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
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  {activeTab === 'all' ? 'No items found. Add a new item to get started.' : `No items found in the "${activeTab}" category.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item: BaseItem) => (
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