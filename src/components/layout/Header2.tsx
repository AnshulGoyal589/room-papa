"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Plane, 
  Hotel, 
  ShoppingBag, 
  Briefcase,
  BookAIcon,
  Menu,
  X,
  Ticket,
  LogIn,
  UserPlus,
  PlusCircle,
  MessageSquareText
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
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

// --- Data structure for navigation links to make the component cleaner ---
type NavLinkType = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  signedInOnly?: boolean;
};

const navLinks: {
  customer: NavLinkType[];
  manager: NavLinkType[];
  admin: NavLinkType[];
} = {
  customer: [
    { href: "/", label: "Home", icon: Home },
    { href: "/customer/bookings", label: "My Bookings", icon: Ticket, signedInOnly: true },
    { href: "/search?category=trip", label: "Trips", icon: Plane },
    { href: "/search?category=property", label: "Properties", icon: Hotel },
    { href: "/search?category=travelling", label: "Travelling", icon: ShoppingBag },
  ],
  manager: [
    { href: "/manager/dashboard", label: "Dashboard", icon: Home },
    { href: "/manager/appointments", label: "Bookings", icon: BookAIcon },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/managers", label: "Managers", icon: Briefcase },
  ],
};

// Main Header Component
export function Header2() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignUp, openSignIn } = useClerk();
  
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [roleSaved, setRoleSaved] = useState(false);

  // --- All your original logic for role management remains unchanged ---
  useEffect(() => {
    if (!isSignedIn) {
      setRole('guest');
      setRoleSaved(false);
    }
  }, [isSignedIn]);

  const saveUserRoleToDatabase = async (clerkId: string, userRole: UserRole, email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, role: userRole, email }),
      });
      if (!response.ok) {
        const error = await response.json();
        if(error.error=="Role already assigned"){
            localStorage.setItem('pendingUserRole', 'admin');
            setRoleSaved(true);
            return true;
        }
        throw new Error(error.error || 'Failed to save user role');
      }
      return true;
    } catch (error) {
      console.error('Error saving user role:', error);
      return false;
    }
  };

  const sendRoleConfirmationEmail = async (email: string): Promise<void> => {
    try {
      await fetch('/api/send-role-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Error sending role confirmation email:', error);
    }
  };

  useEffect(() => {
    const pendingRole = localStorage.getItem('pendingUserRole') as UserRole | null;
    if (isLoaded && isSignedIn && user && pendingRole && !roleSaved) {
      const savePendingRole = async () => {
        const saved = await saveUserRoleToDatabase(
          user.id,
          pendingRole,
          user.primaryEmailAddress?.emailAddress || ''
        );
        if (saved) {
          if (pendingRole === 'manager') {
            await sendRoleConfirmationEmail(user.primaryEmailAddress?.emailAddress || '');
          }
          setRole(pendingRole);
          setRoleSaved(true);
          localStorage.removeItem('pendingUserRole');
        }
      };
      savePendingRole();
    }
  }, [isLoaded, isSignedIn, user, roleSaved]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isLoaded) return;
      if (isSignedIn && user) {
        setLoading(true);
        try {
          const response = await fetch(`/api/user-role?clerkId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.role) setRole(data.role);
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

  const handleCustomerSignUp = () => {
    localStorage.setItem('pendingUserRole', 'customer');
    openSignUp({ afterSignUpUrl: window.location.href });
  };

  const handleManagerSignUp = () => {
    localStorage.setItem('pendingUserRole', 'manager');
    openSignUp({ afterSignUpUrl: window.location.href });
  };
  
  // --- UI Logic ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRole: keyof typeof navLinks = role === 'guest' ? 'customer' : role;
  const currentNavLinks = navLinks[navRole];

  if (loading) {
    return (
      <header className="flex justify-center items-center h-20 bg-[#001d2c]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001d2c]"></div>
      </header>
    );
  }

  // Helper component for navigation links
  const NavLink: React.FC<NavLinkType & { isMobile?: boolean }> = ({ href, label, icon: Icon, isMobile = false }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 relative
          ${isActive ? 'text-[#001d2c] bg-[#001d2c]/10' : 'text-[#001d2c] hover:text-[#001d2c] hover:bg-[#001d2c]/5'}
          ${isMobile ? 'text-base w-full' : "after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-[#001d2c] after:transition-all after:duration-300 hover:after:w-full"}`}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    );
  };
  
  return (
    <header className="bg-white text-[#ffffff] sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8">
        
        <Link 
          href={role === 'customer' ? "/" : role === 'manager' ? "/manager/dashboard" : role === 'admin' ? "/admin/dashboard" : "/"} 
          className="text-2xl font-bold flex items-center shrink-0"
        > 
          <Image
            src="/assets/logo.jpg"
            alt="Logo"
            width={90}
            height={90}
            className="mr-2"
            priority
          />
        </Link>

        {/* --- Desktop Navigation --- */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-2 lg:gap-4">
          {currentNavLinks.map((link) => (
            link.signedInOnly ? (
              <SignedIn key={link.href}><NavLink {...link} /></SignedIn>
            ) : (
              <NavLink key={link.href} {...link} />
            )
          ))}
        </nav>

        {/* --- Desktop Authentication & Actions --- */}
        <div className="hidden md:flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/customer-care" className="p-2 rounded-full text-[#001d2c] hover:text-[#001d2c] hover:bg-[#001d2c]/10 transition-all duration-300">
                  <MessageSquareText className='h-6 w-6' />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Help & Support</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SignedOut>
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={handleManagerSignUp}
                className="hidden lg:flex items-center gap-2 text-[#001d2c] px-4 py-2 rounded-full border-2 border-transparent hover:border-[#001d2c] transition-all duration-300 text-sm font-semibold"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Become a Host</span>
              </button>

              <button 
                onClick={() => openSignIn()}
                className="group flex items-center gap-2 border border-[#001d2c]/80 text-[#001d2c] px-4 py-2 rounded-full hover:bg-[#001d2c] hover:text-[#001d2c] transition-all duration-300 text-sm font-semibold active:scale-95"
              >
                <LogIn className="h-5 w-5" />
                <span>Log In</span>
              </button>
              
              <button 
                onClick={handleCustomerSignUp}
                className="group flex items-center gap-2 bg-[#001d2c] text-[#ffffff] px-4 py-2 rounded-full hover:bg-[#001d2c] transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-px active:scale-95"
              >
                <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                <span>Sign Up</span>
              </button>
            </div>
          </SignedOut>
           
          <SignedIn>
            <div className="flex items-center gap-4">
              {role && role !== 'guest' && (
                <span className="hidden lg:inline-block px-3 py-1 bg-[#001d2c] text-[#ffffff] rounded-full text-xs font-semibold uppercase tracking-wider">
                  {role}
                </span>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>

        {/* --- Mobile Menu Button --- */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-[#001d2c]/10 transition-colors">
              {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu Panel --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#001d2c] border-t border-[#001d2c]/20 absolute w-full left-0 shadow-xl">
          <nav className="flex flex-col gap-1 p-4">
            {currentNavLinks.map((link) => (
              link.signedInOnly ? (
                <SignedIn key={`${link.href}-mobile`}><NavLink {...link} isMobile={true} /></SignedIn>
              ) : (
                <NavLink key={`${link.href}-mobile`} {...link} isMobile={true} />
              )
            ))}
          </nav>

          <div className="p-4 border-t border-[#001d2c]/20">
            <SignedOut>
              <div className="flex flex-col gap-3">
                <button onClick={handleCustomerSignUp} className="w-full text-center bg-[#001d2c] text-[#001d2c] px-4 py-3 rounded-md font-semibold hover:bg-[#001d2c] transition-colors active:scale-95">
                  Sign Up
                </button>
                <button onClick={() => openSignIn()} className="w-full text-center border border-[#001d2c]/80 text-[#001d2c] px-4 py-3 rounded-md font-semibold hover:bg-[#001d2c] hover:text-[#001d2c] transition-colors active:scale-95">
                  Log In
                </button>
                <button onClick={handleManagerSignUp} className="w-full text-center text-[#001d2c]/80 px-4 py-3 rounded-md font-medium hover:bg-[#001d2c]/10 hover:text-[#001d2c] transition-colors">
                  Become a Host
                </button>
              </div>
            </SignedOut>
            <SignedIn>
                <div className="flex items-center justify-between">
                     <span className="px-3 py-1 bg-[#001d2c] text-[#001d2c] rounded-full text-xs font-semibold uppercase tracking-wider">
                        {role}
                     </span>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}