import { NextApiRequest, NextApiResponse } from 'next';
import { handleShopifyCallback } from '../../../lib/shopify/auth';

/**
 * API endpoint to handle Shopify OAuth callback
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Delegate to the callback handler
    return handleShopifyCallback(req, res);
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}