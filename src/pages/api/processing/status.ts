import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionToken } from '../../../lib/shopify/auth';
import prisma from '../../../lib/prisma';
import { rateLimit } from '../../../lib/utils/rate-limit';

// Create a rate limiter that allows 5 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 5, // 5 requests per interval
});

/**
 * API endpoint to check the status of processing jobs
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply rate limiting based on shop ID
    const { shop, shopId } = req.body.session;
    
    try {
      await limiter.check(res, shopId, 5); // 5 requests per minute per shop
    } catch (error) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded', 
        message: 'Too many requests, please try again later' 
      });
    }
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get optional filters from query
    const { jobId, status, limit = '50', page = '1' } = req.query;
    
    // Parse pagination parameters
    const parsedLimit = Math.min(100, parseInt(limit as string) || 50);
    const parsedPage = Math.max(1, parseInt(page as string) || 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    // Build query filters
    const filters: any = { shopId };
    
    if (jobId) {
      filters.id = jobId;
    }
    
    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'error'];
      if (validStatuses.includes(status as string)) {
        filters.status = status;
      }
    }
    
    // Get processing jobs with pagination
    const jobs = await prisma.generationHistory.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: skip,
    });
    
    // Get total count for pagination
    const totalCount = await prisma.generationHistory.count({
      where: filters,
    });
    
    // Calculate processing statistics
    const stats = {
      total: totalCount,
      completed: await prisma.generationHistory.count({
        where: { ...filters, status: 'completed' },
      }),
      processing: await prisma.generationHistory.count({
        where: { ...filters, status: 'processing' },
      }),
      error: await prisma.generationHistory.count({
        where: { ...filters, status: 'error' },
      }),
      pending: await prisma.generationHistory.count({
        where: { ...filters, status: 'pending' },
      }),
    };
    
    // Calculate overall progress percentage
    const overallProgress = 
      stats.total > 0 
        ? Math.round(((stats.completed + stats.error) / stats.total) * 100) 
        : 0;
    
    return res.status(200).json({ 
      jobs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
      },
      stats,
      overallProgress,
    });
  } catch (error) {
    console.error('Error fetching processing status:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching processing status',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
}

// Apply session token middleware
export default withSessionToken(handler);
