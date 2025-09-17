import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_not-found',
          '/admin/',
          '/manager/',
          '/edit/',
          '/cancel/',
          '/confirm-with-payment/',
          '/upload/',
          '/user-role/',
          '/payment/',
          '/register/',
          '/login/'
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/images/properties/'],
      }
    ],
    sitemap: 'https://roompapa.com/sitemap.xml',
    host: 'https://roompapa.com',
  };
}