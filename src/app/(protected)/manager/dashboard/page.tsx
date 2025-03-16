'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ListingItem from '@/components/manager/HomePage/ListingItem';
import AddItemModal from '@/components/manager/HomePage/AddItemModal';
import { useToast } from '@/components/ui/use-toast';
import { checkAuth } from '@/lib/auth';

// Define our unified item type to handle all three types
type ItemCategory = 'Property' | 'Trip' | 'Travelling';

interface BaseItem {
  id:string;
  _id?: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: string;
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

  

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      // Fetch properties
      const propertiesRes = await fetch('/api/properties');
      const properties = await propertiesRes.json();
      const formattedProperties = properties.map((prop: any) => ({
        _id: prop._id,
        title: prop.title,
        description: prop.description,
        category: 'Property' as ItemCategory,
        status: prop.active ? 'Active' : 'Inactive',
        createdAt: new Date(prop.createdAt)
      }));

      // Fetch trips
      const tripsRes = await fetch('/api/trips');
      const trips = await tripsRes.json();
      const formattedTrips = trips.map((trip: any) => ({
        _id: trip._id,
        title: trip.title,
        description: trip.description || '',
        category: 'Trip' as ItemCategory,
        status: trip.status.charAt(0).toUpperCase() + trip.status.slice(1),
        createdAt: new Date(trip.createdAt)
      }));

      // Fetch travellings
      const travellingsRes = await fetch('/api/travellings');
      const travellings = await travellingsRes.json();
      const formattedTravellings = travellings.map((travelling: any) => ({
        _id: travelling._id,
        title: travelling.title,
        description: travelling.description || '',
        category: 'Travelling' as ItemCategory,
        status: travelling.visibility.charAt(0).toUpperCase() + travelling.visibility.slice(1),
        createdAt: new Date(travelling.createdAt)
      }));

      // Combine all items
      const allItems = [
        ...formattedProperties,
        ...formattedTrips,
        ...formattedTravellings
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
  };

  const handleAddItem = async () => {
      fetchItems();
      setIsModalOpen(false);
    };

  const handleItemClick = (id: string, category: ItemCategory) => {
    const route = category.toLowerCase() + 's';
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
                  onClick={() => handleItemClick(item._id as string, item.category)} 
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