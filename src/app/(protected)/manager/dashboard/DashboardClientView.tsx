'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListingItem from '@/components/manager/HomePage/ListingItem';
import AddItemModal from '@/components/manager/HomePage/AddItemModal';
import { BaseItem } from '@/lib/mongodb/models/Components';

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardClientView({ initialItems }: any) {
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // This function's role is now to REFRESH the data after an action.
  // const refreshItems = useCallback(async () => {
  //   if (!user) return;
  //   setIsLoading(true);
  //   try {
  //     const propertiesRes = await fetch(`/api/properties?userId=${user.id}`);
  //     const tripsRes = await fetch(`/api/trips?userId=${user.id}`);
  //     const travellingsRes = await fetch(`/api/travellings?userId=${user.id}`);

  //     const properties: Property[] = await propertiesRes.json();
  //     const trips: Trip[] = await tripsRes.json();
  //     const travellings: Travelling[] = await travellingsRes.json();

  //     const formattedProperties = properties.map(p => ({
  //       ...p,
  //       category: 'Property' as ItemCategory,
  //       createdAt: new Date(p.createdAt!),
  //       _id: p._id ? p._id.toString() : undefined,
  //       title: p.title ?? '', // Ensure title is always a string
  //       description: p.description ?? '', // If description is required
  //     }));
  //     const formattedTrips = trips.map(t => ({
  //       ...t,
  //       category: 'Trip' as ItemCategory,
  //       createdAt: new Date(t.createdAt!),
  //       _id: t._id ? t._id.toString() : undefined,
  //       title: t.title ?? '',
  //       description: t.description ?? '',
  //     }));
  //     const formattedTravellings = travellings.map(tv => ({
  //       ...tv,
  //       category: 'Travelling' as ItemCategory,
  //       createdAt: new Date(tv.createdAt!),
  //       _id: tv._id ? tv._id.toString() : undefined,
  //       title: tv.title ?? '',
  //       description: tv.description ?? '',
  //     }));

  //     const allItems = [...formattedProperties, ...formattedTrips, ...formattedTravellings]
  //       .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  //     setItems(allItems);
  //   } catch (error) {
  //     console.error('Error refreshing items:', error);
  //     toast({ title: 'Error', description: 'Failed to refresh the list of items.', variant: 'destructive' });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [user, toast]);

  // REMOVED: The initial useEffect to fetch data is gone. The page loads instantly with data.

  const handleAddItem = () => {
    router.refresh(); 
    setIsModalOpen(false);
  };

  const handleItemClick = (id: string) => {
    router.push(`/manager/dashboard/${id}`);
  };


  const filteredItems = activeTab === 'all' 
    ? initialItems 
    : initialItems.filter((item: BaseItem) => item.category.toLowerCase() === activeTab.toLowerCase());

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