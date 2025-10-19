import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roompapa.com';

async function safeFetch<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/customer-care`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];
  const propData = await safeFetch<any>(`${baseUrl}/api/properties`);
  const properties = Array.isArray(propData?.data) ? propData.data : Array.isArray(propData) ? propData : [];
  for (const p of properties) {
    const id = p?.id || p?._id;
    if (!id) continue;
    dynamicPages.push({
      url: `${baseUrl}/property/${id}`,
      lastModified: p?.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return [...staticPages, ...dynamicPages];
}