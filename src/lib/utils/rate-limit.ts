import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Rate limiting utility for API endpoints
 * @param options Rate limiting options
 */
export function rateLimit({
  interval = 60 * 1000, // 1 minute in milliseconds
  limit = 10, // Maximum number of requests per interval
  uniqueTokenPerInterval = 500, // Maximum number of unique tokens per interval
} = {}) {
  // Store for tracking requests
  const tokenCache = new Map();
  
  return {
    /**
     * Check if the request is within rate limits
     * @param res Response object for setting headers
     * @param token Unique identifier for the requester (e.g., IP, user ID, shop ID)
     * @param tokenLimit Optional custom limit for this specific token
     */
    check: (
      res: NextApiResponse,
      token: string,
      tokenLimit: number = limit
    ): Promise<void> => {
      const now = Date.now();
      
      // Clean up old entries
      const clearBefore = now - interval;
      for (const [key, timestamp] of tokenCache.entries()) {
        if (timestamp < clearBefore) {
          tokenCache.delete(key);
        }
      }
      
      // Check if token cache is too large
      if (tokenCache.size >= uniqueTokenPerInterval) {
        throw new Error('Rate limit exceeded at the service level');
      }
      
      // Get current count for this token
      const tokenKey = `${token}`;
      const tokenCount = (tokenCache.get(tokenKey) || []).length;
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', tokenLimit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, tokenLimit - tokenCount).toString());
      
      // If token is not in cache, initialize it
      if (!tokenCache.has(tokenKey)) {
        tokenCache.set(tokenKey, [now]);
        return Promise.resolve();
      }
      
      // Get timestamps for this token
      const timestamps = tokenCache.get(tokenKey);
      
      // Filter out timestamps outside the current interval
      const validTimestamps = timestamps.filter(timestamp => timestamp > clearBefore);
      
      // Check if token has exceeded its limit
      if (validTimestamps.length >= tokenLimit) {
        const oldestTimestamp = Math.min(...validTimestamps);
        const resetTime = oldestTimestamp + interval;
        
        // Set retry-after header
        res.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
        
        throw new Error('Rate limit exceeded');
      }
      
      // Add current timestamp and update cache
      validTimestamps.push(now);
      tokenCache.set(tokenKey, validTimestamps);
      
      return Promise.resolve();
    },
  };
}
