import { NextApiRequest, NextApiResponse } from 'next';
import { testDatabaseConnection } from '../../../lib/prisma';
import { withSessionToken } from '../../../lib/shopify/auth';

/**
 * API endpoint to check the health of the application
 * This is useful for monitoring and deployment verification
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection
    const dbConnected = await testDatabaseConnection();
    
    // Check OpenAI API key
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    
    // Check Shopify API configuration
    const shopifyConfigured = !!(
      process.env.SHOPIFY_API_KEY && 
      process.env.SHOPIFY_API_SECRET && 
      process.env.SHOPIFY_APP_URL
    );
    
    // Get session info if available
    const sessionInfo = req.body.session ? {
      shop: req.body.session.shop,
      isActive: true
    } : null;
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database: {
        connected: dbConnected
      },
      services: {
        openai: {
          configured: openaiConfigured
        },
        shopify: {
          configured: shopifyConfigured
        }
      },
      session: sessionInfo
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred during health check',
      timestamp: new Date().toISOString()
    });
  }
}

// Export with session token middleware, but allow public access for basic health checks
export default withSessionToken(handler);
