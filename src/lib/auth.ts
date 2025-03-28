
import { getUserByClerkId } from './mongodb';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types';
import { ReactNode } from 'react';



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

// Higher order component wrapper for protected pages
// interface PageProps {
//   [key: string]: any;
// }

// export function withRoleProtection(
//   Component: React.ComponentType<PageProps>,
//   requiredRole: UserRole
// ) {
//   return async function ProtectedRoute(props: PageProps) {
//     await checkAuth(requiredRole);
//     return <Component {...props} />;
//   };
// }