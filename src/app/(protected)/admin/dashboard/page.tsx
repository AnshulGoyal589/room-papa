import type { Metadata } from 'next';
import DashboardClientView from './DashboardClientView';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getAllUploaderProperties } from '@/lib/mongodb/models/Property';
import { getAllTrips } from '@/lib/mongodb/models/Trip';
import { getAllUploaderTravellings } from '@/lib/mongodb/models/Travelling';
import { userRole } from '@/lib/data/auth';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Room Papa',
  description: 'Manage all properties, trips, and travelling items.',
};

async function fetchAllItems() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }
    const properties = await getAllUploaderProperties(userId);
    const trips = await getAllTrips(userId);
    const travellings = await getAllUploaderTravellings(userId);

    const allItems = [
      ...properties,
      ...trips,
      ...travellings
    ].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return allItems;

  } catch (error) {
    console.error('Failed to fetch dashboard items on server:', error);
    return [];
  }
}

export default async function DashboardPage() {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'admin') {
    redirect('/');
  }
  const initialItems = await fetchAllItems();

  const plainInitialItems = initialItems.map(item => JSON.parse(JSON.stringify(item)));

  return <DashboardClientView initialItems={plainInitialItems} />;
}