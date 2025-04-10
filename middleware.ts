import { NextRequest, NextResponse } from 'next/server';
import { shopify } from './src/lib/shopify/api';

// This middleware handles Shopify authentication for the frontend
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname, searchParams } = url;
  const shop = searchParams.get('shop');

  // Skip middleware for API routes and auth-related paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/auth/login' ||
    pathname === '/auth/callback'
  ) {
    return NextResponse.next();
  }

  // Check for embedded app URL
  const isEmbedded = pathname.includes('/embedded');
  
  // If no shop is provided, redirect to login
  if (!shop) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Validate shop domain
  if (!shopify.utils.isValidShopDomain(shop)) {
    url.pathname = '/auth/login';
    url.searchParams.delete('shop');
    return NextResponse.redirect(url);
  }

  try {
    // Check if we have a valid session for this shop
    const sessionToken = req.cookies.get('shopify_session');
    if (!sessionToken) {
      throw new Error('No session token found');
    }

    // Verify the session token
    const decoded = shopify.session.decodeSessionToken(sessionToken.value);
    
    // Check if token is for the correct shop
    if (decoded.shop !== shop) {
      throw new Error('Session token is for a different shop');
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Session token is expired');
    }

    // Valid session, proceed
    return NextResponse.next();
  } catch (error) {
    // No valid session, redirect to auth
    console.error('Auth middleware error:', error);
    
    // Start OAuth flow
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
}

// Configure the middleware
export const config = {
  matcher: [
    // Match all routes except static files, api routes, and auth routes
    '/((?!_next|static|api|auth).*)',
  ],
};