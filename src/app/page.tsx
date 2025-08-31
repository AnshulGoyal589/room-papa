import type { Metadata } from 'next';
import InitialRender from '@/components/customer/HomePage/InitialRender';
import { Property } from '@/lib/mongodb/models/Property';
import SearchHeader from '@/components/customer/SearchHeader';


export const metadata: Metadata = {
  title: 'Room Papa | Find & Book Hotels, Apartments & More',
  description: 'Find the best deals on hotels, apartments, vacation rentals, and more with Room Papa. Book your next stay with confidence and save on your travel.',
  openGraph: {
    title: 'Room Papa | Your Ultimate Booking Companion',
    description: 'Discover thousands of high-quality stays at the best prices.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/assets/logo.jpg`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

async function getUniquePropertiesData(): Promise<Property[]> {
  try {
    // When fetching inside a Server Component, you MUST use the full, absolute URL.
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/properties`;
    const response = await fetch(apiUrl, {
      // Use caching to improve performance. This will serve a static version
      // and re-fetch the data in the background every hour (3600 seconds).
      // This is Incremental Static Regeneration (ISR) and is great for SEO.
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(`Error fetching properties: ${response.statusText}`);
      return []; // Return an empty array on error to prevent the page from crashing.
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return [];
  }
}

// --- THE PAGE COMPONENT ---
// This is an async Server Component.
export default async function HomePage() {
  // 1. Fetch data on the server before rendering.
  const uniqueProperties = await getUniquePropertiesData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SearchHeader is a Client Component. That's perfectly fine! It will be hydrated on the client. */}
      <SearchHeader />

      {/* 2. Pass the server-fetched data down as a prop to InitialRender. */}
      <InitialRender initialUniqueProperties={uniqueProperties} />
    </div>
  );
}