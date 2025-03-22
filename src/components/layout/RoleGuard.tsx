'use client';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useHasPermission } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const router = useRouter();
  const { hasPermission, loading } = useHasPermission(allowedRoles);

  useEffect(() => {
    if (!loading && !hasPermission && !fallback) {
      router.push('/unauthorized');
    }
  }, [hasPermission, loading, router, fallback]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}