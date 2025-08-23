// This route handler generates the sitemap index file

export async function GET(request: Request) {
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.roompapa.com/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <!-- 
    PRO TIP: If your site grows to millions of pages, you can create
    more dynamic sitemaps (e.g., properties-1.xml, properties-2.xml)
    and list them all here.
  -->
</sitemapindex>
`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}