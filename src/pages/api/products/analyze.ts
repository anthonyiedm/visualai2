import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionToken } from '../../../lib/shopify/auth';
// Removed unused REST imports: fetchProduct, getProductImageUrl
import { fetchProductWithMetafields, updateProduct, updateProductSeo } from '../../../lib/shopify/api'; // Added update functions
import { analyzeProductImage, generateProductDescription, generateProductMeta } from '../../../lib/ai/openai';
import { hasEnoughCredits, useCredits } from '../../../lib/utils/credits';
import prisma from '../../../lib/prisma';

/**
 * API endpoint to analyze products using Visual AI and generate descriptions
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, shopId } = req.body.session;
    const { productIds, collectionIds, toneStyle, updateMeta = true } = req.body;

    if (!productIds && !collectionIds) {
      return res.status(400).json({ error: 'Either productIds or collectionIds is required' });
    }

    // Get shop settings for templates and visual AI configuration
    const shopSettings = await prisma.shopSettings.findUnique({
      where: { shopId }
    });

    if (!shopSettings) {
      return res.status(404).json({ error: 'Shop settings not found' });
    }

    // Prepare for batch processing
    const processingQueue = [];
    
    // Add individual products to queue
    if (productIds && Array.isArray(productIds)) {
      for (const productId of productIds) {
        processingQueue.push({
          type: 'product',
          id: productId
        });
      }
    }

    // Add collections to queue (will be expanded to products)
    if (collectionIds && Array.isArray(collectionIds)) {
      for (const collectionId of collectionIds) {
        processingQueue.push({
          type: 'collection',
          id: collectionId
        });
      }
    }

    // Calculate required credits (1 per product, + 1 per product if updateMeta is true)
    const creditsPerProduct = updateMeta ? 2 : 1;
    const estimatedProducts = processingQueue.length; // This will be refined after expanding collections
    const estimatedCreditsRequired = estimatedProducts * creditsPerProduct;

    // Check if user has enough credits
    const hasCredits = await hasEnoughCredits(shopId, estimatedCreditsRequired);
    if (!hasCredits) {
      return res.status(402).json({ error: 'Not enough credits' });
    }

    // Start asynchronous processing
    // In a real app, you'd use a job queue like Bull or similar
    // For simplicity, we'll just start the process and return immediately
    processProducts(shop, shopId, processingQueue, toneStyle, updateMeta, shopSettings)
      .catch(error => {
        console.error('Error processing products:', error);
        // In a real app, you'd log this error and potentially notify the user
      });

    return res.status(202).json({ 
      message: 'Processing started', 
      estimatedProducts,
      estimatedCredits: estimatedCreditsRequired
    });
  } catch (error) {
    console.error('Error analyzing products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Process products in the queue
 * This would normally be done by a background worker
 */
async function processProducts(
  shop: string,
  shopId: string,
  queue: Array<{ type: string, id: string }>,
  toneStyle: string,
  updateMeta: boolean,
  shopSettings: any
) {
  // Process each item in the queue
  for (const item of queue) {
    try {
      if (item.type === 'product') {
        await processProduct(shop, shopId, item.id, toneStyle, updateMeta, shopSettings);
      } else if (item.type === 'collection') {
        // Expand collection to products and process each
        // For brevity, this part is simplified
        console.log(`Processing collection ${item.id}`);
        // In a real app, you'd fetch all products in the collection and process them
      }
    } catch (error) {
      console.error(`Error processing ${item.type} ${item.id}:`, error);
      // Log error and continue with next item
    }
  }
}

/**
 * Process a single product
 */
async function processProduct(
  shop: string,
  shopId: string,
  productId: string,
  toneStyle: string,
  updateMeta: boolean,
  shopSettings: any
) {
  // Create a processing record
  const processingRecord = await prisma.generationHistory.create({
    data: {
      shopId,
      productId,
      productTitle: '', // Will be updated
      status: 'processing',
      creditsUsed: 0
    }
  });

  try {
    // Fetch product details
    const product = await fetchProductWithMetafields(shop, productId);

    // Handle case where product fetch failed
    if (!product) {
      throw new Error(`Product with ID ${productId} not found or failed to fetch.`);
      // The catch block below will handle updating the processing record
    }
    // Update processing record with product title
    await prisma.generationHistory.update({
      where: { id: processingRecord.id },
      data: { productTitle: product.title, originalDesc: product.description }
    });

    // Get product image URL
    const imageUrl = product.featuredImage?.url || 
      (product.images?.edges?.length > 0 ? product.images.edges[0].node.url : null);

    if (!imageUrl) {
      throw new Error('No product image found');
    }

    // Analyze product image using AI
    const visualAnalysisDepth = shopSettings.visualAnalysisDepth || 'standard';
    const imageAnalysis = await analyzeProductImage(imageUrl, visualAnalysisDepth as any);

    // Generate product description
    const tone = toneStyle || shopSettings.defaultTone;
    const descTemplate = shopSettings.productDescTemplate;
    const generatedDescription = await generateProductDescription(product, imageAnalysis, tone, descTemplate);

    // --- Update Product Description in Shopify ---
    if (generatedDescription) {
      console.log(`Updating description for product ${productId}...`);
      await updateProduct(shop, productId, { descriptionHtml: generatedDescription });
      console.log(`Description updated for product ${productId}.`);
    } else {
      console.warn(`Skipping description update for ${productId} due to empty generation.`);
    }

    // Use 1 credit for description generation
    const descriptionCredits = await useCredits(shopId, 1);

    // Update processing record
    await prisma.generationHistory.update({
      where: { id: processingRecord.id },
      data: { 
        generatedDesc: generatedDescription,
        imageAnalysis,
        creditsUsed: descriptionCredits
      }
    });

    // Generate meta information if requested
    if (updateMeta) {
      const titleTemplate = shopSettings.metaTitleTemplate;
      const descriptionTemplate = shopSettings.metaDescTemplate;
      const generatedMeta = await generateProductMeta(
        product, 
        imageAnalysis,
        titleTemplate,
        descriptionTemplate
      );

      // Use 1 credit for meta generation
      const metaCredits = await useCredits(shopId, 1);

      // Update processing record
      await prisma.generationHistory.update({
        where: { id: processingRecord.id },
        data: { 
          generatedMeta: JSON.stringify(generatedMeta),
          creditsUsed: { increment: metaCredits }
        }
      });

      // --- Update Product SEO in Shopify ---
      if (generatedMeta && (generatedMeta.title || generatedMeta.description)) {
         console.log(`Updating SEO for product ${productId}...`);
         await updateProductSeo(shop, productId, {
           title: generatedMeta.title,
           description: generatedMeta.description,
         });
         console.log(`SEO updated for product ${productId}.`);
      } else {
         console.warn(`Skipping SEO update for ${productId} due to empty generation.`);
      }
    }

    // Update processing record to completed
    await prisma.generationHistory.update({
      where: { id: processingRecord.id },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error(`Error processing product ${productId}:`, error);
    
    // Update processing record with error
    await prisma.generationHistory.update({
      where: { id: processingRecord.id },
      data: { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    });

    return false;
  }
}

export default withSessionToken(handler);