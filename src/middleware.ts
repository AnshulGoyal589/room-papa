import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/search',
  '/api/search',
  '/api/webhooks/(.*)',
  '/customer-care',
]);

export default clerkMiddleware((auth, request) => {
  
  if (!isPublicRoute(request)) {
    auth.protect();
  }

});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};