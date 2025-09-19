import type { Metadata } from 'next';
import { User } from '@/lib/mongodb/models/User';
import ManagerUsersClientView from './ManagerUsersClientView';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Manage Managers | Room Papa Admin',
  description: 'Approve, reject, and view all manager users.',
};

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
async function fetchManagerUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/manager`, {
      // Use 'no-store' to ensure the admin always sees the freshest data.
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch manager users on server');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching manager users:', error);
    // Return an empty array to prevent the page from crashing.
    // The client component can display a "no users found" message.
    return [];
  }
}

// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function ManagerUsersPage() {

    const { userId } = await auth();
    
      // 2. If no user, redirect to sign-in page.
      if (!userId) {
        redirect('/sign-in');
      }

  // 1. Fetch data on the server.
  const initialManagers = await fetchManagerUsers();

  // 2. Pass the pre-fetched data as a prop to the Client Component.
  return <ManagerUsersClientView initialManagers={initialManagers} />;
}