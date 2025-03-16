"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Plane, 
  Hotel, 
  ShoppingBag, 
  Menu,
  UserCircle
} from 'lucide-react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useClerk
} from '@clerk/nextjs';
import { useAuth } from '@clerk/clerk-react';

type UserRole = 'customer' | 'manager';

interface RoleModalProps {
  onRoleSelect: (role: UserRole) => Promise<void>;
  isSubmitting: boolean;
}

const RoleSelectionModal: React.FC<RoleModalProps> = ({ onRoleSelect, isSubmitting }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Select Your Role</h2>
      <p className="text-gray-600 mb-6">Please select your role to continue:</p>
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => onRoleSelect('customer')}
          disabled={isSubmitting}
          className="flex items-center p-4 border rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          <UserCircle className="w-6 h-6 mr-3 text-blue-600" />
          <div>
            <div className="font-medium">Customer</div>
            <div className="text-sm text-gray-500">Book trips and manage your bookings</div>
          </div>
        </button>
        
        <button
          onClick={() => onRoleSelect('manager')}
          disabled={isSubmitting}
          className="flex items-center p-4 border rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          <UserCircle className="w-6 h-6 mr-3 text-green-600" />
          <div>
            <div className="font-medium">Manager</div>
            <div className="text-sm text-gray-500">Manage trips, hotels and customer bookings</div>
          </div>
        </button>
      </div>
      
      {isSubmitting && (
        <div className="mt-4 text-center text-blue-600">
          Saving your role...
        </div>
      )}
    </div>
  </div>
);

export function Header() {
  const { isSignedIn, user , isLoaded } = useUser();
  const { openSignUp } = useClerk();
  const [role, setRole] = useState<UserRole | ''>('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user-role');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        
        const data = await response.json();
        setRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isLoaded && user) {
      fetchUserRole();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user]);
  

  const handleSignUp = () => {
    setShowRoleModal(true);
  };

  const handleRoleSelect = async (selectedRole: UserRole): Promise<void> => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      setRole(selectedRole);
      
      // localStorage.setItem('userRole', selectedRole);
      
      if (isSignedIn && user) {
        await saveUserRoleToDatabase(user.id, selectedRole, user.primaryEmailAddress?.emailAddress || '');
      } else {
        openSignUp();
      }
      
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error saving user role:', error);
      alert('There was an error saving your role. Please try again.');
      
      setRole('');
      // localStorage.removeItem('userRole');
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    const saveRoleAfterSignUp = async () => {
      if (isSignedIn && user) {
        const savedRole = role as UserRole | null;
        
        if (savedRole) {
          try {
            await saveUserRoleToDatabase(user.id, savedRole, user.primaryEmailAddress?.emailAddress || '');
            setRole(savedRole);
          } catch (error) {
            console.error('Error saving user role after sign up:', error);
          }
        }
      }
    };

    saveRoleAfterSignUp();
  }, [isSignedIn, user]);

  const saveUserRoleToDatabase = async (clerkId: string, userRole: UserRole, email: string): Promise<void> => {
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
  };

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-4">
          
          <Link href="/" className="text-2xl font-bold text-blue-600">
            TravelNow
          </Link>

          <nav className="hidden md:flex space-x-6 items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link 
              href="/trips" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Plane className="w-5 h-5" />
              <span>Trips</span>
            </Link>
            <Link 
              href="/hotels" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <Hotel className="w-5 h-5" />
              <span>Hotels</span>
            </Link>
            <Link 
              href="/bookings" 
              className="flex items-center space-x-2 hover:text-blue-600 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Bookings</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton>
                  <button className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition">
                    <span>Login</span>
                  </button>
                </SignInButton>
                <button 
                  onClick={handleSignUp}
                  className="hidden md:flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2">
                {role && (
                  <span className="hidden md:inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {role === 'customer' ? 'Customer' : 'Manager'}
                  </span>
                )}
                <UserButton />
              </div>
            </SignedIn>

            <button className="md:hidden">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {showRoleModal && (
        <RoleSelectionModal 
          onRoleSelect={handleRoleSelect}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}