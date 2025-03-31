
import { getUserByClerkId } from './mongodb';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types';



export async function checkUserRole(requiredRole: UserRole): Promise<boolean> {
  const { userId } = await auth();
  
  if (!userId) {
    return false;
  }
  
  const user = await getUserByClerkId(userId);
  return !!user && user.role === requiredRole;
}


export async function checkAuth(requiredRole?: UserRole): Promise<void> {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  if (requiredRole) {
    const user = await getUserByClerkId(userId);
    if (!user || user.role !== requiredRole) {
      redirect('/unauthorized');
    }
  }
}

