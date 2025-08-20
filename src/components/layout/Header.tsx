"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Home, 
  Plane, 
  Hotel, 
  ShoppingBag, 
  Briefcase,
  BookAIcon,
  CircleHelp
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  // const [isSubmitting, setIsSubmitting] = useState(false); // Commented out as in original
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
      
      // console.log("Role saved successfully!");
      return true;
    } catch (error) {
      console.error('Error saving user role:', error);
      return false;
    }
  };

  // Function to send role confirmation email
  const sendRoleConfirmationEmail = async (email: string): Promise<void> => {
    try {
      await fetch('/api/send-role-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Error sending role confirmation email:', error);
    }
  };

  // Effect to save selected role to localStorage before sign-up
  useEffect(() => {
    // Get the pending role from localStorage (if any)
    const pendingRole = localStorage.getItem('pendingUserRole') as UserRole | null;
    
    // If user is signed in and we have a pending role, save it
    if (isLoaded && isSignedIn && user && pendingRole && !roleSaved) {
      const savePendingRole = async () => {
        // setIsSubmitting(true); // Commented out as in original
        // console.log("User signed in with pending role, saving role:", pendingRole);
        
        const saved = await saveUserRoleToDatabase(
          user.id,
          pendingRole,
          user.primaryEmailAddress?.emailAddress || ''
        );
        
        if (saved) {
          // send conformation mail for verification if the pending role is manager
          if (pendingRole === 'manager') {
            await sendRoleConfirmationEmail(user.primaryEmailAddress?.emailAddress || '');
          }
          setRole(pendingRole);
          setRoleSaved(true);
          localStorage.removeItem('pendingUserRole');
        }
        
        // setIsSubmitting(false); // Commented out as in original
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

  // Handle sign out - Commented out as in original
  // const handleSignOut = async () => {
  //   await signOut();
  //   setRole('guest');
  //   setRoleSaved(false);
  // };

  // Render loading state if still loading
  if (loading) {
    return (
      // Adjusted loading state background and spinner color
      <div className="flex justify-center items-center h-16 bg-[#003b95]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    // Changed background color to #003b95 and removed shadow
    <header className="bg-[#003b95]"> 
      <div className="flex justify-between items-center mx-auto px-4 w-full lg:w-[70vw] "> {/* Added some padding */}
        {/* Logo with dynamic routing based on role */}
        <Link href={role === 'customer' ? "/customer/dashboard" : role === 'manager' ? "/manager/dashboard" : role === 'admin' ? "/admin/dashboard" : "/"} 
          // Changed logo text color to white for contrast
          className="text-2xl font-bold text-white flex items-center"> 
          <Image
            src="/assets/logo.jpg" // Replace with your logo path
            alt="Logo"
            width={120} // Slightly adjusted size for potentially tighter space
            height={120}
            className="inline-block mr-2"
          />
        </Link>

        {/* Customer Navigation */}
        {role === 'customer' && (
          // Adjusted text color to white and hover color for contrast
          <nav className="hidden md:flex space-x-6 items-center text-white"> 
            <Link 
              href="/customer/dashboard"
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <SignedIn>
              <Link 
                href="/customer/bookings"
                className="flex items-center space-x-2 hover:text-gray-300 transition"
              >
                <Home className="w-5 h-5" />
                <span>My Bookings</span>
              </Link>
            </SignedIn>
            <Link 
              href="/customer/search?category=trip" 
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <Plane className="w-5 h-5" />
              <span>Trips</span>
            </Link>
            <Link 
              href="/customer/search?category=property" 
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <Hotel className="w-5 h-5" />
              <span>Properties</span>
            </Link>
            <Link 
              href="/customer/search?category=travelling" 
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Travelling</span>
            </Link>
          </nav>
        )}

        {/* Manager Navigation */}
        {role === 'manager' && (
          // Adjusted text color to white and hover color for contrast
          <nav className="hidden md:flex space-x-6 items-center text-white">
            <Link 
              href="/manager/dashboard"
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/manager/appointments"
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <BookAIcon className="w-5 h-5" />
              <span>Bookings</span>
            </Link>
          </nav>
        )}

        {/* Admin Navigation */}
        {role === 'admin' && (
          // Adjusted text color to white and hover color for contrast
          <nav className="hidden md:flex space-x-6 items-center text-white">
            <Link 
              href="/admin/dashboard"
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/managers"
              className="flex items-center space-x-2 hover:text-gray-300 transition"
            >
              <Briefcase className="w-5 h-5" />
              <span>Managers</span>
            </Link>
          </nav>
        )}


        {/* Authentication and User Actions */}
        <div className="flex items-center space-x-4 lg:space-x-8 ">

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/customer-care" >
                <CircleHelp className='text-white h-7 w-7 ' />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Contact Customer Service</p>
            </TooltipContent>
          </Tooltip>

          

          <SignedOut>
            <div className="flex items-center gap-2">
              {/* Adjusted Login Button Style */}
              <button 
                onClick={handleManagerSignUp}
                // className="flex items-center space-x-1 bg-green-500 text-white px-3 py-2 rounded-full hover:bg-green-600 transition text-sm font-medium" // Slightly brighter green
                className="flex items-center space-x-1 text-white px-3 py-2 rounded-full transition text-[1rem] font-semibold " // Slightly brighter green
              >
                {/* <Building className="w-4 h-4 mr-1" /> */}
                <span>List Your Property</span>
              </button>
              <button 
                onClick={handleCustomerSignUp}
                className="hidden md:flex items-center space-x-1 bg-white text-[#003b95] px-3 py-2 rounded-[3px] hover:bg-gray-200 transition text-sm font-medium"
              >
                <span>Register</span>
              </button>
              <button 
                onClick={() => openSignIn()}
                className="flex items-center space-x-1 bg-white text-[#003b95] px-3 py-2 rounded-[3px] hover:bg-gray-200 transition text-sm font-medium"
              >
                <span>Sign In</span>
              </button>
              {/* Adjusted Sign Up Button Style */}
               {/* Kept List Property button green for distinction, ensured text contrast */}
            </div>
          </SignedOut>
           
          <SignedIn>
            <div className="flex items-center gap-2">
              {role && role !== 'guest' && (
                
                <span className="hidden md:inline-block px-2 py-1 bg-white text-[#003b95] rounded-full text-xs font-medium">
                  {role === 'customer' ? 'Customer' : role === 'manager' ? 'Manager' : 'Admin'}
                </span>
              )}
             
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

         
        </div>
      </div>
    </header>
  );
}