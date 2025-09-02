import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ManagerDetails } from '@/lib/mongodb/models/Components';
import ManagerDetailsClientView from './ManagerDetailsClientView';

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
async function fetchManagerDetails(managerId: string): Promise<ManagerDetails | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/manager/${managerId}`, {
      // Use 'no-store' to ensure admins always see the most up-to-date user details.
      cache: 'no-store',
    });

    if (!response.ok) {
      // This will be caught by the try-catch block.
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching manager details on server:', error);
    return null;
  }
}


// --- DYNAMIC METADATA GENERATION ---
// This creates a unique <title> for each manager, which is great for browser history and SEO.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const manager = await fetchManagerDetails(resolvedParams.id);

  if (!manager) {
    return { title: 'Manager Not Found | Room Papa Admin' };
  }

  return {
    title: `Manager: ${manager.name || manager.email} | Room Papa Admin`,
  };
}

// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function ManagerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  // 1. Fetch data on the server.
  const manager = await fetchManagerDetails(resolvedParams.id);

  // 2. If the manager is not found, render a proper 404 page.
  if (!manager) {
    notFound();
  }

  // 3. Pass the pre-fetched data as a prop to the Client Component.
  return <ManagerDetailsClientView initialManager={manager} />;
}