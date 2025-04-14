"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Plane, 
  Hotel, 
  ShoppingBag, 
  Briefcase,
  BookAIcon,
  Building
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useClerk
} from '@clerk/nextjs';

// Type definition for user role
type UserRole = 'customer' | 'manager' | 'admin' | 'guest';

// Main Header Component
export function Header() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignUp, openSignIn } = useClerk();
  
  // State management
  const [role, setRole] = useState<UserRole>('guest');
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Track if we've already attempted to save the role to avoid duplicate saves
  const [roleSaved, setRoleSaved] = useState(false);

  // Effect to listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      if (isSignedIn === false) {
        setRole('guest');
        setRoleSaved(false);
      }
    };

    handleAuthStateChange();
  }, [isSignedIn]);

  // Save user role to database
  const saveUserRoleToDatabase = async (
    clerkId: string, 
    userRole: UserRole, 
    email: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId,
          role: userRole,
          email
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user role');
      }
      
      console.log("Role saved successfully!");
      return true;
    } catch (error) {
      console.error('Error saving user role:', error);
      return false;
    }
  };

  // Effect to save selected role to localStorage before sign-up
  useEffect(() => {
    // Get the pending role from localStorage (if any)
    const pendingRole = localStorage.getItem('pendingUserRole') as UserRole | null;
    
    // If user is signed in and we have a pending role, save it
    if (isLoaded && isSignedIn && user && pendingRole && !roleSaved) {
      const savePendingRole = async () => {
        // setIsSubmitting(true);
        console.log("User signed in with pending role, saving role:", pendingRole);
        
        const saved = await saveUserRoleToDatabase(
          user.id,
          pendingRole,
          user.primaryEmailAddress?.emailAddress || ''
        );
        
        if (saved) {
          setRole(pendingRole);
          setRoleSaved(true);
          localStorage.removeItem('pendingUserRole');
        }
        
        // setIsSubmitting(false);
      };
      
      savePendingRole();
    }
  }, [isLoaded, isSignedIn, user, roleSaved]);

  // Effect to fetch user role on mount and after sign-in
  useEffect(() => {
    const fetchUserRole = async () => {
      // Wait until Clerk is loaded
      if (!isLoaded) return;
      
      // If user is signed in, fetch their role
      if (isSignedIn && user) {
        setLoading(true);
        try {
          const response = await fetch(`/api/user-role?clerkId=${user.id}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.role) {
              setRole(data.role);
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [isLoaded, isSignedIn, user]);

  // Handle standard sign up process (as customer)
  const handleCustomerSignUp = () => {
    localStorage.setItem('pendingUserRole', 'customer');
    openSignUp({
      redirectUrl: window.location.href,
      afterSignUpUrl: window.location.href
    });
  };

  // Handle property listing sign up (as manager)
  const handleManagerSignUp = () => {
    localStorage.setItem('pendingUserRole', 'manager');
    openSignUp({
      redirectUrl: window.location.href,
      afterSignUpUrl: window.location.href
    });
  };

  // Handle sign out
  // const handleSignOut = async () => {
  //   await signOut();
  //   setRole('guest');
  //   setRoleSaved(false);
  // };

  // Render loading state if still loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo with dynamic routing based on role */}
        <Link href={role === 'customer' ? "/customer/dashboard" : role === 'manager' ? "/manager/dashboard" : role === 'admin' ? "/admin/dashboard" : "/"} 
          className="text-2xl font-bold text-blue-600">
          Room Papa
        </Link>

        {/* Customer Navigation */}
        {role === 'customer' && (
          <nav className="hidden md:flex space-x-6 items-center">
            <Link 
              href="/customer/dashboard"
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link 
              href="/customer/search?category=trip" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Plane className="w-5 h-5" />
              <span>Trips</span>
            </Link>
            <Link 
              href="/customer/search?category=property" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Hotel className="w-5 h-5" />
              <span>Properties</span>
            </Link>
            <Link 
              href="/customer/search?category=travelling" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Travelling</span>
            </Link>
          </nav>
        )}

        {/* Manager Navigation */}
        {role === 'manager' && (
          <nav className="hidden md:flex space-x-6 items-center">
            <Link 
              href="/manager/dashboard"
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/manager/appointments"
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <BookAIcon className="w-5 h-5" />
              <span>Bookings</span>
            </Link>
          </nav>
        )}

        {/* Admin Navigation */}
        {role === 'admin' && (
          <nav className="hidden md:flex space-x-6 items-center">
            <Link 
              href="/admin/dashboard"
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/managers"
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Briefcase className="w-5 h-5" />
              <span>Managers</span>
            </Link>
          </nav>
        )}

        {/* Authentication and User Actions */}
        <div className="flex items-center space-x-3">
          <SignedOut>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openSignIn()}
                className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-full hover:bg-blue-100 transition text-sm"
              >
                <span>Login</span>
              </button>
              <button 
                onClick={handleCustomerSignUp}
                className="hidden md:flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-full hover:bg-blue-700 transition text-sm"
              >
                <span>Sign Up</span>
              </button>
              <button 
                onClick={handleManagerSignUp}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-full hover:bg-green-700 transition text-sm"
              >
                <Building className="w-4 h-4 mr-1" />
                <span>List Your Property</span>
              </button>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="flex items-center gap-2">
              {role && role !== 'guest' && (
                <span className="hidden md:inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {role === 'customer' ? 'Customer' : role === 'manager' ? 'Manager' : 'Admin'}
                </span>
              )}
              {/* Using basic UserButton */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

         
        </div>
      </div>
    </header>
  );
}