'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react'; // Icon for the dropdown
import ListingItem from '@/components/manager/HomePage/ListingItem';
import { BaseItem } from '@/lib/mongodb/models/Components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardClientView({ initialItems }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const handleItemClick = (id: string) => {
    router.push(`/admin/dashboard/${id}`);
  };

  const filteredItems =
    activeTab === 'all'
      ? initialItems
      : initialItems.filter(
          (item: BaseItem) =>
            item.category.toLowerCase() === activeTab.toLowerCase()
        );

  return (
    <div className="container mx-auto py-8 px-4 sm:px-8 md:px-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* --- REPLACED BUTTON WITH DROPDOWN MENU --- */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Add New Inventory
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => router.push('/admin/addItem/property')}
            >
              Property
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/admin/addItem/trip')}
            >
              Trip
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/admin/addItem/travelling')}
            >
              Travelling
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* --- END OF REPLACEMENT --- */}

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
                  {activeTab === 'all'
                    ? 'No items found. Add a new item to get started.'
                    : `No items found in the "${activeTab}" category.`}
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
    </div>
  );
}