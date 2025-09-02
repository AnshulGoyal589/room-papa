// FILE: app/manager/dashboard/page.tsx
// ROLE: A Server Component to handle authentication, authorization, and initial data fetching for the manager.

import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server'; // Import the server-side auth helper
import { redirect } from 'next/navigation';
import { BaseItem, ItemCategory } from '@/lib/mongodb/models/Components';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import Unauthorized from '@/components/manager/Unauthorized';
import DashboardClientView from './DashboardClientView';

export const metadata: Metadata = {
  title: 'Manager Dashboard | Room Papa',
  description: 'Manage your properties, trips, and travelling items.',
};

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
async function fetchAllManagerItems(userId: string): Promise<BaseItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    // Fetch all user-specific data in parallel for maximum performance.
    const propertiesPromise = fetch(`${baseUrl}/api/properties?userId=${userId}`, { cache: 'no-store' });
    const tripsPromise = fetch(`${baseUrl}/api/trips?userId=${userId}`, { cache: 'no-store' });
    const travellingsPromise = fetch(`${baseUrl}/api/travellings?userId=${userId}`, { cache: 'no-store' });

    const [propertiesRes, tripsRes, travellingsRes] = await Promise.all([
      propertiesPromise, tripsPromise, travellingsPromise
    ]);

    const properties: Property[] = propertiesRes.ok ? await propertiesRes.json() : [];
    const trips: Trip[] = tripsRes.ok ? await tripsRes.json() : [];
    const travellings: Travelling[] = travellingsRes.ok ? await travellingsRes.json() : [];

    // Format and combine the data on the server.
    const formattedProperties = properties.map(p => ({
      ...p,
      category: 'Property' as ItemCategory,
      createdAt: new Date(p.createdAt!),
      _id: p._id ? p._id.toString() : '',
      title: p.title ?? '', // Ensure title is always a string
      description: p.description ?? '', // Ensure description is always a string
    }));
    const formattedTrips = trips.map(t => ({
      ...t,
      category: 'Trip' as ItemCategory,
      createdAt: new Date(t.createdAt!),
      _id: t._id ? t._id.toString() : '',
      title: t.title ?? '',
      description: t.description ?? '',
    }));
    const formattedTravellings = travellings.map(tv => ({
      ...tv,
      category: 'Travelling' as ItemCategory,
      createdAt: new Date(tv.createdAt!),
      _id: tv._id ? tv._id.toString() : '',
      title: tv.title ?? '',
      description: tv.description ?? '',
    }));

    return [...formattedProperties, ...formattedTrips, ...formattedTravellings]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  } catch (error) {
    console.error('Failed to fetch manager items on server:', error);
    return [];
  }
}

// A server-side function to check manager status
async function isManager(): Promise<boolean> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/managerStatus`, { cache: 'no-store' });
        if (!res.ok) return false;
        const data = await res.json();
        return data.isManager === true;
    } catch (error) {
        console.error("Failed to check manager status:", error);
        return false;
    }
}

// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function ManagerDashboardPage() {
  // 1. Get user session on the server.
  const { userId } = await auth();

  // 2. If no user, redirect to sign-in page.
  if (!userId) {
    redirect('/sign-in');
  }

  // 3. Check for manager role on the server.
  const managerStatus = await isManager();
  if (!managerStatus) {
    return <Unauthorized />; // Render an unauthorized message page.
  }

  // 4. Fetch all data on the server using the authenticated userId.
  const initialItems = await fetchAllManagerItems(userId);

  // 5. Render the Client Component, passing the pre-fetched data as a prop.
  return <DashboardClientView initialItems={initialItems} />;
}