import { MetadataRoute } from 'next';

// // Placeholder: Replace this with your actual database fetching logic
// async function getPropertiesFromDB() {
//   // Example: const properties = await prisma.property.findMany(...);
//   // Return an array of objects with slug and updatedAt
//   return [
//     { slug: 'grand-hotel-eiffel-paris', updatedAt: new Date() },
//     { slug: 'colosseum-view-loft-rome', updatedAt: new Date() },
//   ];
// }

// // Placeholder: Replace this with your actual database fetching logic
// async function getDestinationsFromDB() {
//   // Example: const destinations = await prisma.destination.findMany(...);
//   return [
//     { slug: 'france/paris', updatedAt: new Date() },
//     { slug: 'italy/rome', updatedAt: new Date() },
//   ];
// }


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://www.roompapa.com';

  // 1. Get static pages
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/customer-care`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/customer/dashboard?tab=property&amp;category=property`,
      lastModified: new Date(),
    },
  ];

  // // 2. Get dynamic property pages
  // const properties = await getPropertiesFromDB();
  // const propertyPages = properties.map((property) => ({
  //   url: `${siteUrl}/property/${property.slug}`,
  //   lastModified: property.updatedAt,
  // }));

  // // 3. Get dynamic destination pages
  // const destinations = await getDestinationsFromDB();
  // const destinationPages = destinations.map((destination) => ({
  //   url: `${siteUrl}/destination/${destination.slug}`,
  //   lastModified: destination.updatedAt,
  // }));

  // Combine all pages
  // return [...staticPages, ...propertyPages, ...destinationPages];
  return [...staticPages];
}