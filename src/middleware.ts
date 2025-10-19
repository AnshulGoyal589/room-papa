import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const p = req.nextUrl.pathname;
  const isExcluded =
    p.startsWith('/api') ||
    p.startsWith('/_next') ||
    p.endsWith('.xml') ||
    p.endsWith('.txt') ||
    p.endsWith('.json') ||
    p.endsWith('.ico') ||
    p.endsWith('.png') ||
    p.endsWith('.jpg') ||
    p.endsWith('.jpeg') ||
    p.endsWith('.svg');

  if (!isExcluded) {
    if (process.env.NODE_ENV === 'production') {
      // Force indexable header in production
      res.headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    } else {
      // Keep previews/dev non-indexable
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)'],
};