import { User } from '@/lib/mongodb/models/User';
import { redirect } from 'next/navigation';
import ProfileClientView from './ProfileClientView';

async function getManagerProfile(): Promise<User | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/manager/profile`;

  try {
    const response = await fetch(url, {cache: 'no-store'});

    if (!response.ok) {
      console.error(`Failed to fetch profile: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching manager profile:', error);
    return null;
  }
}


export default async function ManagerProfilePage() {
  const user = await getManagerProfile();

  // If fetching fails or user is not found, redirect.
  if (!user) {
    redirect('/'); // Or to a login page
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manager Profile</h1>
        <p className="text-gray-600">Update your personal and bank details here.</p>
      </div>
      
      {/* Pass the server-fetched data as a prop to the Client Component */}
      <ProfileClientView initialUser={user} />
    </div>
  );
}