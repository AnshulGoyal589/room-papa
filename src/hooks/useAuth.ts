import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserRole } from '@/types';

export function useRole() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      // Get role from user metadata
      const userRole = user.publicMetadata.role as UserRole || 'customer';
      console.log('User role 3:', userRole);
      setRole(userRole);
      setLoading(false);
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  return { role, loading };
}

export function useHasPermission(allowedRoles: UserRole[]) {
  const { role, loading } = useRole();
  
  if (loading) {
    return { hasPermission: false, loading };
  }
  
  return {
    hasPermission: role ? allowedRoles.includes(role) : false,
    loading
  };
}