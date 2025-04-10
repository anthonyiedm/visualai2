import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionToken } from '../../../lib/shopify/auth';
import { getCreditsInfo } from '../../../lib/utils/credits';

/**
 * API endpoint to get credit information for a shop
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shopId } = req.body.session;
    
    // Get credits info
    const creditsInfo = await getCreditsInfo(shopId);
    
    return res.status(200).json(creditsInfo);
  } catch (error) {
    console.error('Error fetching credits info:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSessionToken(handler);