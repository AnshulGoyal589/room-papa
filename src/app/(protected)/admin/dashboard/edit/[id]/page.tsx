import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import ItemEditClientView from './ItemEditClientView';
import { auth } from '@clerk/nextjs/server';
import { fetchCategoryData } from '@/lib/data/category';
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
  const resolvedParams = await params;
  const fetchedItem = await fetchItemData(resolvedParams.id);

  if (!fetchedItem) {
    return { title: 'Item Not Found | Room Papa Admin' };
  }

  return {
    title: `Edit: ${fetchedItem.itemData.title} | Room Papa Admin`,
  };
}

export default async function ItemEditPage({ params }: { params: Promise<{ id: string }> }) {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'admin') {
    redirect('/');
  }

  const resolvedParams = await params;
  const fetchedItem = await fetchItemData(resolvedParams.id);

  if (!fetchedItem) {
    notFound();
  }
  
  const { itemData, category } = fetchedItem;

  return (
    <ItemEditClientView
      initialItemData={itemData}
      initialCategory={category}
    />
  );
}