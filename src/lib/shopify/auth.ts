import { NextApiRequest, NextApiResponse } from 'next';
import { shopify } from './api';
import crypto from 'crypto';
import prisma from '../prisma';

/**
 * Middleware to verify Shopify JWT session tokens
 */
export function withSessionToken(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    try {
      // Extract the session token from the header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const payload = await verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }

      // Check if the shop exists in our database
      const shop = await prisma.shop.findUnique({
        where: { shopifyDomain: payload.shop }
      });

      if (!shop || !shop.isActive) {
        return res.status(401).json({ error: 'Unauthorized: Shop not found or inactive' });
      }

      // Attach session data to the request
      req.body.session = {
        shop: payload.shop,
        shopId: shop.id,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
      };

      // Call the handler
      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
}

/**
 * Verify Shopify JWT token
 */
async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = shopify.session.decodeSessionToken(token);
    
    // Validate token
    if (!decoded || !decoded.shop) {
      return null;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to verify Shopify webhook signatures
 */
export function withWebhookVerification(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    try {
      // Get the webhook signature headers
      const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
      const shopDomain = req.headers['x-shopify-shop-domain'] as string;
      
      if (!hmacHeader || !shopDomain) {
        return res.status(401).json({ error: 'Unauthorized: Missing headers' });
      }
      
      // Get the raw request body as a buffer
      const rawBody = await getRawBody(req);
      
      // Verify the webhook signature
      const isValid = verifyWebhookHmac(hmacHeader, rawBody);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
      }
      
      // Find the shop in the database
      const shop = await prisma.shop.findUnique({
        where: { shopifyDomain: shopDomain }
      });
      
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
      
      // Attach shop data to the request
      req.body.shopId = shop.id;
      req.body.shop = shopDomain;
      
      // Call the handler
      return handler(req, res);
    } catch (error) {
      console.error('Webhook verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Get the raw request body as a buffer
 */
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  // If the raw body is already available (e.g. from a custom server setup)
  if (req.body && req.body.rawBody) {
    return req.body.rawBody;
  }
  
  // Otherwise, consume the stream to get the raw body
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    req.on('error', reject);
  });
}

/**
 * Verify the Shopify webhook HMAC signature
 */
function verifyWebhookHmac(hmac: string, body: Buffer): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET || '')
    .update(body)
    .digest('base64');
  
  return hash === hmac;
}

/**
 * Handle Shopify OAuth
 */
export async function handleShopifyAuth(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract the shop parameter from the query
    const { shop } = req.query;
    
    if (!shop || Array.isArray(shop)) {
      return res.status(400).json({ error: 'Invalid shop parameter' });
    }
    
    // Check if this is a valid Shopify shop domain
    if (!shopify.utils.isValidShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }
    
    // Create the auth URL
    const authUrl = await shopify.auth.beginAuth(
      req,
      res,
      shop,
      '/api/auth/callback',
      false // isOnline
    );
    
    // Redirect to the auth URL
    return res.redirect(authUrl);
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle Shopify OAuth callback
 */
export async function handleShopifyCallback(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Complete the OAuth flow
    const session = await shopify.auth.validateAuthCallback(req, res, req.query);
    
    // Find or create the shop in the database
    let shop = await prisma.shop.findUnique({
      where: { shopifyDomain: session.shop }
    });
    
    if (shop) {
      // Update existing shop
      shop = await prisma.shop.update({
        where: { id: shop.id },
        data: {
          shopifyToken: session.accessToken,
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new shop
      shop = await prisma.shop.create({
        data: {
          shopifyDomain: session.shop,
          shopifyToken: session.accessToken,
          isActive: true,
          plan: 'FREE'
        }
      });
      
      // Initialize shop settings with defaults
      await prisma.shopSettings.create({
        data: {
          shopId: shop.id
        }
      });
      
      // Initialize credits
      const { initializeCredits } = await import('../utils/credits');
      await initializeCredits(shop.id);
    }
    
    // Redirect to the app
    return res.redirect(`/dashboard?shop=${session.shop}`);
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}