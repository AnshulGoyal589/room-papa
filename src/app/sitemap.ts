import { NextResponse } from 'next/server';

export async function GET() {
  const siteUrl = 'https://www.roompapa.com';
  const now = new Date().toISOString();

  const staticUrls = [
    '', // homepage
    'customer-care',
    'customer/dashboard?tab=property&category=property',
  ];

  const urlsXml = staticUrls.map(
    path => `
  <url>
    <loc>${siteUrl}/${path}</loc>
    <lastmod>${now}</lastmod>
  </url>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlsXml}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
