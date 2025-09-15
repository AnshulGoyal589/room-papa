import { MetadataRoute } from 'next'

// Function to fetch all property IDs for dynamic sitemap generation
async function getPropertyIds(): Promise<string[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/properties`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error('Failed to fetch properties for sitemap');
      return [];
    }
    
    const properties = await response.json();
    return properties.map((property: any) => property._id);
  } catch (error) {
    console.error('Error fetching property IDs for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.roompapa.com';
  const currentDate = new Date();
  
  // Get dynamic property IDs
  const propertyIds = await getPropertyIds();
  
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