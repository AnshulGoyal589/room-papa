// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Define all routes that should be publicly accessible.
 * These routes will not require a user to be signed in.
 * All other routes will be protected by default.
 */
const isPublicRoute = createRouteMatcher([
  '/',                  // The homepage
  '/search',            // The search page
  '/api/webhooks/(.*)', // ONLY webhook routes are public within the API
  // NOTE: We have REMOVED the general '/api/(.*)' rule.
]);

export default clerkMiddleware((auth, request) => {
  /**
   * If the request is not for a public route, then protect it.
   * This will redirect unauthenticated users to the sign-in page for non-API routes.
   * For API routes, it will return a 401 Unauthorized response.
   */
  
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};