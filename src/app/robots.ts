import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Block private, user-specific, and action-oriented pages
        disallow: [
          '/admin/',
          '/manager/',
          '/customer/',
          '/api/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/images/properties/'],
      },
      // You can add more specific rules for other user agents here
    ],
    // IMPORTANT: Point to your sitemap index file
    sitemap: 'https://www.roompapa.com/sitemap_index.xml',
  };
}