/**
 * NextAuth.js (Auth.js) API Route
 * 
 * Handles authentication requests using the configured auth options.
 * 
 * @module app/api/auth/[...nextauth]/route
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth.js handler for all authentication routes
 * 
 * Routes handled:
 * - GET/POST /api/auth/signin - Sign in page
 * - GET/POST /api/auth/signout - Sign out
 * - GET/POST /api/auth/session - Get session
 * - GET/POST /api/auth/providers - Get providers
 * - GET/POST /api/auth/callback/* - OAuth callbacks
 * - GET/POST /api/auth/csrf - Get CSRF token
 * 
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */
const handler = NextAuth(authOptions);

/**
 * Handle GET requests for authentication
 */
export { handler as GET };

/**
 * Handle POST requests for authentication
 */
export { handler as POST };