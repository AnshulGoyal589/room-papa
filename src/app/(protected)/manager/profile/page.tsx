import { redirect } from 'next/navigation';
import ProfileClientView from './ProfileClientView';
import { getAuthenticatedUserProfile, userRole } from '@/lib/data/auth';
import { auth } from '@clerk/nextjs/server';


export default async function ManagerProfilePage() {
  
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }
  const role = await userRole(userId ?? undefined);
  if (role !== 'manager') {
    redirect('/');
  }
  const user = await getAuthenticatedUserProfile();
  if (!user) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manager Profile</h1>
        <p className="text-gray-600">Update your personal and bank details here.</p>
      </div>
      
      <ProfileClientView initialUser={user} />
    </div>
  );
}