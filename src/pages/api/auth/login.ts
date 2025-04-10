import { NextApiRequest, NextApiResponse } from 'next';
import { handleShopifyAuth } from '../../../lib/shopify/auth';

/**
 * API endpoint to initiate Shopify OAuth
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Delegate to the auth handler
    return handleShopifyAuth(req, res);
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}