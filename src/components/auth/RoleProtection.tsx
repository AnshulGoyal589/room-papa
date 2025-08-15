'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types';
import { routeConfig } from '@/config/routes';
import { RoleProtectionProps } from '@/lib/mongodb/models/Components';



export default function RoleProtection({
  children,
  loadingComponent = <div className="flex items-center justify-center min-h-screen">Loading...</div>
}: RoleProtectionProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  // const [ setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname && routeConfig.publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  useEffect(() => {
    async function fetchUserRole() {
      if (!isSignedIn) {
        // Not logged in - only allow public routes
        if (isPublicRoute) {
          setAuthorized(true);
        } else {
          // Redirect to customer dashboard and open sign-in popup
          router.push('/customer/dashboard');
          // Small delay to ensure navigation happens before opening the modal
          // setTimeout(() => {
          //   openSignIn();
          // }, 100);
        }
        setLoading(false);
        return;
      }

      try {
        // Rest of your existing code for handling logged-in users
        const response = await fetch('/api/user-role');
        const data = await response.json();
        const role = data.role as UserRole;
        // setUserRole(role);
        
        // Check authorization based on user role
        if (role) {
          const roleConfig = routeConfig.roleRoutes[role];
          
          // Allow access to public routes for all users
          // console.log("hurrah: ",role);
          if (isPublicRoute) {
            setAuthorized(true);
          } 

          // For homepage, redirect to role-specific default route
          else if (pathname && pathname === '/') {
            router.push(roleConfig.defaultRoute);
          }
          // Check if the route is allowed for this role
          else if (pathname && roleConfig.allowedRoutes.some(route => pathname.startsWith(route))) {
            setAuthorized(true);
          }
          // If not authorized, redirect to the default route for this role
          else {
            router.push(roleConfig.defaultRoute);
          }
        } else {
          // If we can't determine the role but user is signed in,
          // treat as customer (default role)
          const defaultRole = 'customer';
          const roleConfig = routeConfig.roleRoutes[defaultRole];
          
          if (isPublicRoute) {
            setAuthorized(true);
          } else if (pathname && roleConfig.allowedRoutes.some(route => pathname.startsWith(route))) {
            setAuthorized(true);
          } else {
            router.push(roleConfig.defaultRoute);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Error fallback - redirect to customer dashboard and open sign-in popup
        if (isPublicRoute) {
          setAuthorized(true);
        } else {
          router.push('/customer/dashboard');
          setTimeout(() => {
            openSignIn();
          }, 100);
        }
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      fetchUserRole();
    }
  }, [isLoaded, isSignedIn, pathname, router, isPublicRoute, openSignIn]);

  // Show loading state
  if (!isLoaded || loading) {
    return <>{loadingComponent}</>;
  }

  // Show content if authorized
  if (authorized) {
    return <>{children}</>;
  }

  // This should never render as unauthorized paths trigger redirects
  return null;
}