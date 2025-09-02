import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import ItemDetailClientView from './ItemDetailClientView';

type ItemCategory = 'Property' | 'Trip' | 'Travelling';
type FetchedItem = {
  itemData: Property | Trip | Travelling;
  category: ItemCategory;
};

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
// This function runs on the server to get the item data efficiently.
async function fetchItemData(itemId: string): Promise<FetchedItem | null> {
  const endpoints = [
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/properties/${itemId}`, category: 'Property' },
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/trips/${itemId}`, category: 'Trip' },
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/travellings/${itemId}`, category: 'Travelling' }
  ] as const;

  // Use Promise.allSettled to fetch from all endpoints in parallel for better performance.
  const results = await Promise.allSettled(
    endpoints.map(ep => fetch(ep.url, { cache: 'no-store' }).then(res => { // cache: 'no-store' ensures we get the latest data
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
// This function runs on the server to set the <title> tag dynamically.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const fetchedItem = await fetchItemData((await params).id);

  if (!fetchedItem) {
    return {
      title: 'Item Not Found | Room Papa Manager',
    };
  }

  return {
    title: `${fetchedItem.itemData.title} | Room Papa Manager`,
    description: `Details for ${fetchedItem.itemData.title}.`,
  };
}


// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function ItemDetailPage({ params }: { params: Promise<{ id:string }> }) {
  const fetchedItem = await fetchItemData((await params).id);

  // If the item is not found, render a proper 404 page.
  // This is much better for SEO and correctness than showing a "Not Found" message on a 200 OK page.
  if (!fetchedItem) {
    notFound();
  }
  
  const { itemData, category } = fetchedItem;

  // Delegate the rendering of the interactive UI to a Client Component,
  // passing the server-fetched data as props.
  return (
    <ItemDetailClientView 
      initialItemData={itemData} 
      initialCategory={category} 
    />
  );
}