import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionToken } from '../../../lib/shopify/auth';
import { addCredits, getCreditsInfo } from '../../../lib/utils/credits';

/**
 * API endpoint to purchase additional credits
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shopId } = req.body.session;
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }
    
    // In a real app, you would process payment here
    // For this example, we'll just add the credits directly
    
    // Add credits to the shop
    await addCredits(shopId, amount);
    
    // Get updated credits info
    const creditsInfo = await getCreditsInfo(shopId);
    
    return res.status(200).json({
      success: true,
      message: `Successfully purchased ${amount} credits`,
      credits: creditsInfo
    });
  } catch (error) {
    console.error('Error purchasing credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSessionToken(handler);