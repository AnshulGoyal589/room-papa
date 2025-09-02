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

async function fetchItemData(itemId: string): Promise<FetchedItem | null> {
  const endpoints = [
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/properties/${itemId}`, category: 'Property' },
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/trips/${itemId}`, category: 'Trip' },
    { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/travellings/${itemId}`, category: 'Travelling' }
  ] as const;

  const results = await Promise.allSettled(
    endpoints.map(ep => fetch(ep.url).then(res => {
      if (!res.ok) throw new Error(`Failed to fetch from ${ep.url}`);
      return res.json();
    }))
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      return {
        itemData: result.value,
        category: endpoints[i].category,
      };
    }
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const fetchedItem = await fetchItemData(resolvedParams.id);

  if (!fetchedItem) {
    return {
      title: 'Item Not Found | Room Papa Admin',
    };
  }

  return {
    title: `${fetchedItem.itemData.title} | Room Papa Admin`,
    description: `Details for ${fetchedItem.itemData.title}.`,
  };
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const fetchedItem = await fetchItemData(resolvedParams.id);

  if (!fetchedItem) {
    notFound();
  }
  
  const { itemData, category } = fetchedItem;

  return (
    <ItemDetailClientView
      initialItemData={itemData} 
      initialCategory={category} 
    />
  );
}