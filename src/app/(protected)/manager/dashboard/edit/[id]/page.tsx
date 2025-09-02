// FILE: app/manager/dashboard/edit/[id]/page.tsx
// ROLE: A Server Component to fetch initial data for the form, generate metadata, and pass data to the client view.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import ItemEditClientView from './ItemEditClientView';

type ItemCategory = 'Property' | 'Trip' | 'Travelling';
type FetchedItem = {
  itemData: Property | Trip | Travelling;
  category: ItemCategory;
};

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
// This function runs on the server to get the item data for the form.
async function fetchItemData(itemId: string): Promise<FetchedItem | null> {
  const endpoints = [
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/properties/${itemId}`, category: 'Property' },
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/trips/${itemId}`, category: 'Trip' },
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/travellings/${itemId}`, category: 'Travelling' }
  ] as const;

  // Use Promise.allSettled to fetch from all endpoints in parallel for better performance.
  const results = await Promise.allSettled(
    endpoints.map(ep => fetch(ep.url, { cache: 'no-store' }).then(res => { // 'no-store' is crucial to get the latest data for editing.
      if (!res.ok) throw new Error(`Failed to fetch from ${ep.url}`);
      return res.json();
    }))
  );

  // Find the first successful fetch and return its data and category.
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      return {
        itemData: result.value,
        category: endpoints[i].category,
      };
    }
  }

  return null; // Return null if not found in any category.
}


// --- DYNAMIC METADATA GENERATION ---
// Sets a descriptive <title> tag on the server.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const fetchedItem = await fetchItemData((await params).id);

  if (!fetchedItem) {
    return { title: 'Item Not Found | Room Papa Manager' };
  }

  return {
    title: `Edit: ${fetchedItem.itemData.title} | Room Papa Manager`,
  };
}


// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function ItemEditPage({ params }: { params: Promise<{ id: string }> }) {
  const fetchedItem = await fetchItemData((await params).id);

  // If no data is found, render a 404 page immediately.
  if (!fetchedItem) {
    notFound();
  }
  
  const { itemData, category } = fetchedItem;

  // Delegate the interactive form rendering to a Client Component.
  return (
    <ItemEditClientView
      initialItemData={itemData}
      initialCategory={category}
    />
  );
}