import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionToken } from '../../../lib/shopify/auth';
import prisma from '../../../lib/prisma';

/**
 * API endpoint to get or update shop settings
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shopId } = req.body.session;

  // GET request - Fetch settings
  if (req.method === 'GET') {
    try {
      // Get shop settings
      const settings = await prisma.shopSettings.findUnique({
        where: { shopId }
      });
      
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // PUT request - Update settings
  if (req.method === 'PUT') {
    try {
      const {
        defaultTone,
        includeMeta,
        autoSave,
        productTitleTemplate,
        productDescTemplate,
        metaTitleTemplate,
        metaDescTemplate,
        visualAnalysisDepth,
        autoDetectType,
        enhancedMaterials,
        colorAnalysis,
        emailUpdates,
        creditAlerts,
        productUpdates
      } = req.body;
      
      // Update settings
      const updatedSettings = await prisma.shopSettings.update({
        where: { shopId },
        data: {
          defaultTone: defaultTone || undefined,
          includeMeta: includeMeta !== undefined ? includeMeta : undefined,
          autoSave: autoSave !== undefined ? autoSave : undefined,
          productTitleTemplate: productTitleTemplate || undefined,
          productDescTemplate: productDescTemplate || undefined,
          metaTitleTemplate: metaTitleTemplate || undefined,
          metaDescTemplate: metaDescTemplate || undefined,
          visualAnalysisDepth: visualAnalysisDepth || undefined,
          autoDetectType: autoDetectType !== undefined ? autoDetectType : undefined,
          enhancedMaterials: enhancedMaterials !== undefined ? enhancedMaterials : undefined,
          colorAnalysis: colorAnalysis !== undefined ? colorAnalysis : undefined,
          emailUpdates: emailUpdates !== undefined ? emailUpdates : undefined,
          creditAlerts: creditAlerts !== undefined ? creditAlerts : undefined,
          productUpdates: productUpdates !== undefined ? productUpdates : undefined
        }
      });
      
      return res.status(200).json(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Other methods not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

export default withSessionToken(handler);