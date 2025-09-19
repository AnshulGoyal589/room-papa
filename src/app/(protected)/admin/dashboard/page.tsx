import type { Metadata } from 'next';
import { BaseItem, ItemCategory } from '@/lib/mongodb/models/Components';
import DashboardClientView from './DashboardClientView';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Room Papa',
  description: 'Manage all properties, trips, and travelling items.',
};

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
// This function runs on the server to get all items.
async function fetchAllItems(): Promise<BaseItem[]> {
  try {
    // Fetch all data sources in parallel for maximum performance.
    const propertiesPromise = fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/properties`, { cache: 'no-store' });
    const tripsPromise = fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/trips`, { cache: 'no-store' });
    const travellingsPromise = fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/travellings`, { cache: 'no-store' });

    const [propertiesRes, tripsRes, travellingsRes] = await Promise.all([
      propertiesPromise,
      tripsPromise,
      travellingsPromise
    ]);

    // Check responses and parse JSON
    const properties = propertiesRes.ok ? await propertiesRes.json() : [];
    const trips = tripsRes.ok ? await tripsRes.json() : [];
    const travellings = travellingsRes.ok ? await travellingsRes.json() : [];

    // Format and combine the data on the server.
    const formattedProperties = properties.map((prop: BaseItem) => ({
      _id: prop._id,
      title: prop.title,
      description: prop.description,
      bannerImage: prop.bannerImage,
      category: 'Property' as ItemCategory,
      createdAt: new Date(prop.createdAt)
    }));

    const formattedTrips = trips.map((trip: BaseItem) => ({
      _id: trip._id,
      title: trip.title,
      description: trip.description || '',
      category: 'Trip' as ItemCategory,
      bannerImage: trip.bannerImage,
      createdAt: new Date(trip.createdAt)
    }));

    const formattedTravellings = travellings.map((travelling: BaseItem) => ({
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

    return allItems;

  } catch (error) {
    console.error('Failed to fetch dashboard items on server:', error);
    // Return an empty array so the page doesn't crash. The client can show a message.
    return [];
  }
}

// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function DashboardPage() {

  const { userId } = await auth();
  
    // 2. If no user, redirect to sign-in page.
    if (!userId) {
      redirect('/sign-in');
    }
  // Fetch all data on the server before rendering.
  const initialItems = await fetchAllItems();

  // Render the Client Component, passing the pre-fetched data as a prop.
  return <DashboardClientView initialItems={initialItems} />;
}