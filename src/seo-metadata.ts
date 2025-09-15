// Centralized SEO metadata for all pages
// Usage: import { seoMetadata } from '@/seo-metadata';

const baseUrl = 'https://www.roompapa.com';

interface Property {
  _id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  images?: string[];
}

export const seoMetadata = {
  home: {
    title: 'Room Papa | Find & Book Hotels, Apartments & Vacation Rentals Online',
    description: 'Discover and book the best hotels, apartments, vacation rentals, and unique accommodations with Room Papa. Compare prices, read reviews, and enjoy secure booking with instant confirmation.',
    keywords: 'hotel booking, vacation rentals, apartments, travel deals, accommodation booking, room papa',
    openGraph: {
      title: 'Room Papa | Your Ultimate Accommodation Booking Platform',
      description: 'Discover amazing accommodations worldwide. Book hotels, apartments, and vacation rentals with confidence.',
      type: 'website' as const,
      url: baseUrl,
    },
  },
  search: {
    title: 'Search Properties',
    description: 'Search and discover hotels, apartments, vacation rentals, and unique accommodations. Filter by location, price, amenities, and more to find your perfect stay.',
    keywords: 'search hotels, find accommodations, property search, travel booking',
    openGraph: {
      title: 'Search Accommodations | Room Papa',
      description: 'Find your perfect accommodation from thousands of properties worldwide.',
      type: 'website' as const,
    },
  },
  register: {
    title: 'Create Account',
    description: 'Join Room Papa today! Create your free account to book accommodations, manage reservations, and access exclusive member deals.',
    keywords: 'sign up, create account, register, room papa membership',
    robots: { index: false, follow: true }, // No need to index auth pages
  },
  login: {
    title: 'Sign In',
    description: 'Sign in to your Room Papa account to manage bookings, view your reservations, and access exclusive member features.',
    keywords: 'sign in, login, account access',
    robots: { index: false, follow: true },
  },
  customerCare: {
    title: 'Customer Support & Help Center',
    description: 'Get help with your bookings, find answers to frequently asked questions, and contact Room Papa support team. Available 24/7 to assist you.',
    keywords: 'customer support, help center, booking help, contact support, FAQ',
    openGraph: {
      title: 'Customer Support | Room Papa Help Center',
      description: 'Get instant help and support for all your booking needs.',
      type: 'website' as const,
    },
  },
  propertyDetail: {
    title: 'Property Details',
    description: 'View detailed information, high-quality photos, amenities, guest reviews, and booking options for this accommodation.',
    keywords: 'property details, hotel information, accommodation reviews, booking details',
    openGraph: {
      title: 'Property Details | Room Papa',
      description: 'Explore detailed property information, photos, amenities, and reviews.',
      type: 'website' as const,
    },
  },
  stays: {
    title: 'My Stays & Bookings',
    description: 'View and manage your current and past bookings. Check reservation details, download confirmations, and track your stay history.',
    keywords: 'my bookings, reservation management, stay history',
    robots: { index: false, follow: false }, // Private user content
  },
  bookings: {
    title: 'My Bookings',
    description: 'Access all your booking confirmations, upcoming stays, and reservation history in one convenient location.',
    robots: { index: false, follow: false },
  },
  managerDashboard: {
    title: 'Property Manager Dashboard',
    description: 'Manage your properties, view booking analytics, update listings, and handle guest communications from your manager dashboard.',
    robots: { index: false, follow: false }, // Private manager content
  },
  managerAppointments: {
    title: 'Booking Management',
    description: 'View and manage all guest bookings for your properties. Handle check-ins, check-outs, and guest communications.',
    robots: { index: false, follow: false },
  },
  adminDashboard: {
    title: 'Admin Dashboard',
    description: 'Administrative control panel for managing the Room Papa platform, users, properties, and system settings.',
    robots: { index: false, follow: false },
  },
  adminManagers: {
    title: 'Manager Administration',
    description: 'Approve, manage, and oversee property managers on the Room Papa platform.',
    robots: { index: false, follow: false },
  },
};

// Helper function to generate property-specific metadata
export function generatePropertyMetadata(property: Property) {
  const title = `${property.title} | Book Now on Room Papa`;
  const description = `Book ${property.title} - ${property.description.substring(0, 120)}... Located in ${property.location}. Check availability, photos, and guest reviews.`;
  
  return {
    title,
    description,
    keywords: `${property.title}, ${property.location}, accommodation booking, ${property.type}`,
    openGraph: {
      title,
      description,
      type: 'website' as const,
      url: `${baseUrl}/property/${property._id}`,
      images: property.images?.[0] ? [{
        url: property.images[0],
        width: 800,
        height: 600,
        alt: property.title,
      }] : [],
    },
  };
}

// Helper function to generate location-specific search metadata
export function generateSearchMetadata(location?: string, checkIn?: string, checkOut?: string) {
  const locationText = location ? ` in ${location}` : '';
  const dateText = checkIn && checkOut ? ` from ${checkIn} to ${checkOut}` : '';
  
  return {
    title: `Search Accommodations${locationText} | Room Papa`,
    description: `Find the best hotels, apartments, and vacation rentals${locationText}${dateText}. Compare prices, read reviews, and book with confidence.`,
    keywords: `accommodations${locationText}, hotels${locationText}, vacation rentals${locationText}`,
  };
}
