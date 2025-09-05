
import type { Metadata } from 'next';
import { seoMetadata } from '@/seo-metadata';

export const metadata: Metadata = seoMetadata.stays;

import Stays from '@/components/customer/HomePage/HeroSection/Stays';
import InitialRender from '@/components/customer/HomePage/InitialRender';
import { Property } from '@/lib/mongodb/models/Property';


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

export default async function Dashboard() {

  
  const uniqueProperties = await getUniquePropertiesData();
  return (
    <div className="min-h-screen bg-gray-50">
      
      <Stays/>
      <InitialRender initialUniqueProperties={uniqueProperties} />
      
    </div>
  );
}