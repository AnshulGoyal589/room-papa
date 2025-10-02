import type { Metadata } from 'next';
import { seoMetadata } from '@/seo-metadata';
import InitialRender from '@/components/customer/HomePage/InitialRender';
import { getAllProperties, Property } from '@/lib/mongodb/models/Property';
import SearchHeader from '@/components/customer/SearchHeader';


export const metadata: Metadata = seoMetadata.home;

async function getUniquePropertiesData(): Promise<Property[]> {
  try {
    const properties = await getAllProperties();
    return properties;
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return [];
  }
}

export default async function HomePage() {
  const uniqueProperties = await getUniquePropertiesData();
  const plainUniqueProperties = JSON.parse(JSON.stringify(uniqueProperties));

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      <InitialRender initialUniqueProperties={plainUniqueProperties} />
    </div>
  );
}