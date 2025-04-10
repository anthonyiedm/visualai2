import OpenAI from 'openai';
import { getProductTemplate } from './templates';
import { extractImageFeatures, formatProductDescription } from '../utils/formatter';

// Initialize OpenAI client with error handling
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
  // Fallback to null, will be checked before use
  openai = null as any;
}

/**
 * Validates that OpenAI client is properly initialized
 */
function validateOpenAIClient() {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Check your API key configuration.');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
}

/**
 * Analyzes a product image using DALL-E vision capabilities through ChatGPT
 */
export async function analyzeProductImage(imageUrl: string, analysisDepth: 'basic' | 'standard' | 'detailed' = 'standard'): Promise<any> {
  try {
    validateOpenAIClient();
    
    // Validate image URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL provided');
    }
    
    // Determine detail level based on analysis depth
    const detailLevel = analysisDepth === 'basic' ? 'basic' 
      : analysisDepth === 'detailed' ? 'comprehensive and detailed' 
      : 'standard';
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a professional e-commerce product analyzer. Analyze the product image and identify key features, materials, colors, style, and potential uses. Provide a ${detailLevel} analysis suitable for an e-commerce product description.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this product image and provide structured information about it." },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: analysisDepth === 'detailed' ? 800 : (analysisDepth === 'basic' ? 300 : 500),
      response_format: { type: "json_object" }
    });

    // Extract and structure the analysis
    const analysisResult = JSON.parse(response.choices[0]?.message?.content || '{}');
    return extractImageFeatures(analysisResult);
  } catch (error) {
    console.error('Error analyzing product image:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze product image: ${errorMessage}`);
  }
}

/**
 * Generates a product description based on product data and visual analysis
 */
export async function generateProductDescription(
  productData: any, 
  imageAnalysis: any,
  tone: string = 'professional',
  template: string = '[product_intro]\n\n[features_list]'
): Promise<string> {
  try {
    validateOpenAIClient();
    
    // Validate inputs
    if (!productData) {
      throw new Error('Product data is required');
    }
    
    // Get the appropriate product template based on the tone
    const promptTemplate = getProductTemplate(tone);
    
    // Combine product data with image analysis
    const combinedData = {
      ...productData,
      imageAnalysis: imageAnalysis || {},
    };
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: promptTemplate.system
        },
        {
          role: "user",
          content: promptTemplate.generatePrompt(combinedData, template)
        },
      ],
      temperature: tone === 'enthusiastic' ? 0.8 : (tone === 'minimal' ? 0.3 : 0.5),
      max_tokens: 1000,
    });

    // Format the generated description
    return formatProductDescription(response.choices[0]?.message?.content || '', template);
  } catch (error) {
    console.error('Error generating product description:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate product description: ${errorMessage}`);
  }
}

/**
 * Generates SEO meta information for a product
 */
export async function generateProductMeta(
  productData: any, 
  imageAnalysis: any,
  titleTemplate: string = '[title] - [primary_keyword] | [brand_name]',
  descriptionTemplate: string = '[short_description] Features: [key_features]. [cta]',
): Promise<{ title: string, description: string }> {
  try {
    validateOpenAIClient();
    
    // Validate inputs
    if (!productData) {
      throw new Error('Product data is required');
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert for e-commerce products. Generate optimized SEO meta title and description based on the product data and visual analysis provided.
          Follow these guidelines:
          - Meta title should be 50-60 characters
          - Meta description should be 140-155 characters
          - Include primary keywords naturally
          - Make them compelling and click-worthy
          - Use the provided templates for structure`
        },
        {
          role: "user",
          content: JSON.stringify({
            product: productData,
            imageAnalysis: imageAnalysis || {},
            titleTemplate,
            descriptionTemplate
          })
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const metaResult = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      title: metaResult.title || '',
      description: metaResult.description || ''
    };
  } catch (error) {
    console.error('Error generating product meta:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate product meta: ${errorMessage}`);
  }
}
