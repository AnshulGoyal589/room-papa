'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListingItem from '@/components/manager/HomePage/ListingItem';
import AddItemModal from '@/components/manager/HomePage/AddItemModal';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@clerk/nextjs';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';

// Define our unified item type to handle all three types
type ItemCategory = 'Property' | 'Trip' | 'Travelling';

interface BaseItem {
  _id?: string;
  title: string;
  description: string;
  category: ItemCategory;
  bannerImage?: {
    url: string;
  };
  createdAt: Date;
}

export default function Dashboard() {

  // await checkAuth('manager');

  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<BaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useUser();

  


  const fetchItems = useCallback( async () => {
    setIsLoading(true);
    try {

      const managerStatusRes = await fetch(`/api/managerStatus`);
      const managerStatus = await managerStatusRes.json();
      if (!managerStatus.isManager) {
        alert('You are not authorized to access this page.');          
        return;
      }
      
      const propertiesRes = await fetch(`/api/properties?userId=${user?.id}`);
      const properties = await propertiesRes.json();
      const formattedProperties = properties.map((prop: Property) => ({
        _id: prop._id,
        title: prop.title,
        description: prop.description,
        bannerImage: prop.bannerImage,
        category: 'Property' as ItemCategory,
        createdAt: new Date(prop.createdAt || Date.now())
      }));

      const tripsRes = await fetch(`/api/trips?userId=${user?.id}`);
      const trips = await tripsRes.json();
      const formattedTrips = trips.map((trip: Trip) => ({
        _id: trip._id,
        title: trip.title,
        description: trip.description || '',
        category: 'Trip' as ItemCategory,
        bannerImage: trip.bannerImage,
        createdAt: new Date(trip.createdAt || Date.now())
      }));

      
      const travellingsRes = await fetch(`/api/travellings?userId=${user?.id}`);
      const travellings = await travellingsRes.json();
      const formattedTravellings = travellings.map((travelling: Travelling) => ({
        _id: travelling._id,
        title: travelling.title,
        description: travelling.description || '',
        category: 'Travelling' as ItemCategory,
        bannerImage: travelling.bannerImage,
        createdAt: new Date(travelling.createdAt)
      }));

      
      const allItems = [
        ...formattedProperties,
        ...formattedTrips,
        ...formattedTravellings
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // console.log(allItems);

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  },[user, toast]);

  useEffect(() => {
    fetchItems();
  }, [toast , fetchItems]); 

  
  const handleAddItem = async () => {
      fetchItems();
      setIsModalOpen(false);
    };

  const handleItemClick = (id: string) => {
    router.push(`/manager/dashboard/${id}`);
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="container mx-auto py-8">
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
          {isLoading ? (
            <div className="text-center py-8">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  No items found. Add a new item to get started.
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