import { MetadataRoute } from 'next';
import { getAllProperties } from '@/lib/mongodb/models/Property';
import { getAllTrips } from '@/lib/mongodb/models/Trip';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://www.roompapa.com';

  // 1. Get static pages
  const staticPages = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/customer-care`, lastModified: new Date() },
    { url: `${siteUrl}/search`, lastModified: new Date() },
    { url: `${siteUrl}/login`, lastModified: new Date() },
    { url: `${siteUrl}/register`, lastModified: new Date() },
    { url: `${siteUrl}/property`, lastModified: new Date() },
    { url: `${siteUrl}/trips`, lastModified: new Date() },
    { url: `${siteUrl}/travellings`, lastModified: new Date() },
    { url: `${siteUrl}/customer/bookings`, lastModified: new Date() },
    { url: `${siteUrl}/customer/stays`, lastModified: new Date() },
    { url: `${siteUrl}/manager/appointments`, lastModified: new Date() },
    { url: `${siteUrl}/manager/dashboard`, lastModified: new Date() },
    { url: `${siteUrl}/admin/dashboard`, lastModified: new Date() },
    { url: `${siteUrl}/admin/managers`, lastModified: new Date() },
  ];

  let propertyPages: MetadataRoute.Sitemap = [];
  let tripPages: MetadataRoute.Sitemap = [];
  let travellingPages: MetadataRoute.Sitemap = [];
  let bookPages: MetadataRoute.Sitemap = [];
  let customerTripPages: MetadataRoute.Sitemap = [];
  let managerDashboardPages: MetadataRoute.Sitemap = [];
  let adminDashboardPages: MetadataRoute.Sitemap = [];
  const adminManagerPages: MetadataRoute.Sitemap = [];
  try {
    // Dynamic property pages
    const properties = await getAllProperties();
    propertyPages = properties.map((property) => ({
      url: `${siteUrl}/property/${property._id}`,
      lastModified: property.updatedAt || property.createdAt || new Date(),
    }));

    // Dynamic trip pages
    const trips = await getAllTrips();
    tripPages = trips.map((trip) => ({
      url: `${siteUrl}/trips/${trip._id}`,
      lastModified: trip.updatedAt || trip.createdAt || new Date(),
    }));

    // Dynamic customer trip pages
    customerTripPages = trips.map((trip) => ({
      url: `${siteUrl}/customer/trip/${trip._id}`,
      lastModified: trip.updatedAt || trip.createdAt || new Date(),
    }));

    // Dynamic travelling pages
    // You need to implement getAllTravellings in your models if not present
    const { getAllTravellings } = await import('@/lib/mongodb/models/Travelling');
    const travellings = await getAllTravellings();
    travellingPages = travellings.map((travelling) => ({
      url: `${siteUrl}/customer/travelling/${travelling._id}`,
      lastModified: travelling.updatedAt || travelling.createdAt || new Date(),
    }));

    // Dynamic book pages (property bookings)
    bookPages = properties.map((property) => ({
      url: `${siteUrl}/customer/book/${property._id}`,
      lastModified: property.updatedAt || property.createdAt || new Date(),
    }));

    // Dynamic manager dashboard item pages
    managerDashboardPages = properties.map((property) => ({
      url: `${siteUrl}/manager/dashboard/${property._id}`,
      lastModified: property.updatedAt || property.createdAt || new Date(),
    }));

    // Dynamic admin dashboard item pages
    adminDashboardPages = properties.map((property) => ({
      url: `${siteUrl}/admin/dashboard/${property._id}`,
      lastModified: property.updatedAt || property.createdAt || new Date(),
    }));

  } catch {
    // Ignore DB errors and fallback to static pages only
    console.warn('MongoDB not available during build, sitemap will only include static pages.');
  }

  // Combine all pages
  return [
    ...staticPages,
    ...propertyPages,
    ...tripPages,
    ...customerTripPages,
    ...travellingPages,
    ...bookPages,
    ...managerDashboardPages,
    ...adminDashboardPages,
    ...adminManagerPages,
  ];
}