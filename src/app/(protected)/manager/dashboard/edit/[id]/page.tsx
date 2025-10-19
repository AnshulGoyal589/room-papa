import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import ItemEditClientView from './ItemEditClientView';
import { fetchCategoryData } from '@/lib/data/category';
import { auth } from '@clerk/nextjs/server';
import { userRole } from '@/lib/data/auth';

type FetchedItem = {
  itemData: Property | Trip | Travelling;
  category: string;
};

async function fetchItemData(itemId: string): Promise<FetchedItem | null> {
  
  try {

    const categoryData = await fetchCategoryData(itemId);
    if (categoryData) {
        return { itemData: categoryData.data, category: categoryData.category };
    }
  } catch (error) {
      console.error("Failed to fetch item data:", error);
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const fetchedItem = await fetchItemData((await params).id);

  if (!fetchedItem) {
    return { title: 'Item Not Found | Room Papa Manager' };
  }

  return {
    title: `Edit: ${fetchedItem.itemData.title} | Room Papa Manager`,
  };
}


export default async function ItemEditPage({ params }: { params: Promise<{ id: string }> }) {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'manager') {
    redirect('/');
  }

  const fetchedItem = await fetchItemData((await params).id);

  if (!fetchedItem) {
    notFound();
  }
  
  const { itemData, category } = fetchedItem;

  const plainItemData = JSON.parse(JSON.stringify(itemData));

  return (
    <ItemEditClientView
      initialItemData={plainItemData}
      initialCategory={category}
    />
  );
}