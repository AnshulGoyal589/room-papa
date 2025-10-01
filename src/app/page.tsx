import type { Metadata } from 'next';
import { seoMetadata } from '@/seo-metadata';
import InitialRender from '@/components/customer/HomePage/InitialRender';
import { Property } from '@/lib/mongodb/models/Property';
import SearchHeader from '@/components/customer/SearchHeader';


export const metadata: Metadata = seoMetadata.home;

async function getUniquePropertiesData(): Promise<Property[]> {
  try {
    // When fetching inside a Server Component, you MUST use the full, absolute URL.
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/properties`;
    const response = await fetch(apiUrl, {
      // Use caching to improve performance. This will serve a static version
      // and re-fetch the data in the background every hour (3600 seconds).
      // This is Incremental Static Regeneration (ISR) and is great for SEO.
      // next: { revalidate: 3600 },
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