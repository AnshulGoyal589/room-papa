"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Plane, 
  Hotel, 
  ShoppingBag, 
  Menu,
  UserCircle,
  X,
  User,
  Briefcase,
  ArrowRight,
  ChevronLeft
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
  onClose: () => void;
  isSubmitting: boolean;
}

const RoleSelectionModal: React.FC<RoleModalProps> = ({ onRoleSelect, onClose, isSubmitting }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = async () => {
    if (selectedRole) {
      await onRoleSelect(selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Choose Your Role</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-8">Please select how you'll use TravelNow:</p>
        
        <div className="flex flex-col space-y-4 mb-8">
          <button
            onClick={() => setSelectedRole('customer')}
            className={`flex items-center p-5 border rounded-xl transition-all duration-200 ${
              selectedRole === 'customer' 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            <div className={`p-3 rounded-full mr-4 ${
              selectedRole === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-lg">Customer</div>
              <div className="text-sm text-gray-500">Search and book trips, manage your reservations</div>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedRole('manager')}
            className={`flex items-center p-5 border rounded-xl transition-all duration-200 ${
              selectedRole === 'manager' 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
            }`}
          >
            <div className={`p-3 rounded-full mr-4 ${
              selectedRole === 'manager' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-lg">Manager</div>
              <div className="text-sm text-gray-500">Manage listings, bookings and customer requests</div>
            </div>
          </button>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all ${
              selectedRole && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <span>Continue to Sign Up</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="text-gray-500 text-sm font-medium hover:text-gray-800 transition flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Go back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export function Header() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignUp, openSignIn } = useClerk();
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
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeRoleModal = () => {
    setShowRoleModal(false);
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
          
          <Link href={role=='customer' ? "/customer/dashboard" : "/manager/dashboard"} className="text-2xl font-bold text-blue-600">
            Room Papa
          </Link>

          { role == 'customer' && 
            <nav className="hidden md:flex space-x-6 items-center">
              <Link 
                href={role=='customer' ? "/customer/dashboard" : "/manager/dashboard"}
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
          }

          <div className="flex items-center space-x-4">
            <SignedOut>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openSignIn()}
                  className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition"
                >
                  <span>Login</span>
                </button>
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
          onClose={closeRoleModal}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}