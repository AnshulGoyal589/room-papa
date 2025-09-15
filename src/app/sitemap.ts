// sitemap.ts should look like this:
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.roompapa.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.roompapa.com/search',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Add your dynamic property URLs, etc.
  ]
}