import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { UserRole } from '@/types';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default async function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const userRole = user.publicMetadata.role as UserRole || 'customer';
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/unauthorized');
  }
  
  return <>{children}</>;
}