import { MetadataRoute } from 'next'

// Define base URL once for consistency
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.roompapa.com';

// Define Property interface
interface Property {
  _id: string;
  // Add other fields if needed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/customer-care`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    }
  ];

  // Dynamic property pages
  const propertyPages: MetadataRoute.Sitemap = propertyIds.map((id) => ({
    url: `${baseUrl}/property/${id}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...propertyPages];
}