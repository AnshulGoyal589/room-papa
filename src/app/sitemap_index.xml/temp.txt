// This route handler generates the sitemap index file

export async function GET() {
  const now = new Date().toISOString();
  const sitemapFiles = [
    'sitemap.xml',
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapFiles.map(file => `
    <sitemap>
      <loc>https://www.roompapa.com/${file}</loc>
      <lastmod>${now}</lastmod>
    </sitemap>`).join('')}
</sitemapindex>
`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}