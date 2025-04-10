import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getProductTemplate } from './templates';
import { extractImageFeatures, formatProductDescription } from '../utils/formatter';

// Initialize Google Generative AI client with error handling
let genAI: GoogleGenerativeAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
} catch (error) {
  console.error('Failed to initialize Google Generative AI client:', error);
  // Fallback to null, will be checked before use
  genAI = null as any;
}

/**
 * Validates that Google Generative AI client is properly initialized
 */
function validateGeminiClient() {
  if (!genAI) {
    throw new Error('Google Generative AI client not initialized. Check your API key configuration.');
  }
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
}

/**
 * Analyzes a product image using Gemini Pro Vision capabilities
 */
export async function analyzeProductImage(imageUrl: string, analysisDepth: 'basic' | 'standard' | 'detailed' = 'standard'): Promise<any> {
  try {
    validateGeminiClient();
    
    // Validate image URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL provided');
    }
    
    // Determine detail level based on analysis depth
    const detailLevel = analysisDepth === 'basic' ? 'basic' 
      : analysisDepth === 'detailed' ? 'comprehensive and detailed' 
      : 'standard';
    
    // Fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageData = await imageResponse.arrayBuffer();
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Configure the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro-vision",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Create the prompt
    const prompt = `You are a professional e-commerce product analyzer. Analyze the product image and identify key features, materials, colors, style, and potential uses. Provide a ${detailLevel} analysis suitable for an e-commerce product description.

Please analyze this product image and provide structured information about it in JSON format with the following fields:
- productType: The type of product shown
- materials: Array of materials used in the product
- colors: Array of colors present in the product
- features: Array of notable product features
- style: The design style of the product
- targetAudience: Who this product is likely designed for
- useCases: Array of potential uses for this product
- qualityImpression: Your impression of the product quality
- additionalNotes: Any other observations

Return ONLY valid JSON without any additional text.`;

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: Buffer.from(imageData).toString('base64')
        }
      }
    ]);
    
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }
    
    // Parse the JSON
    const analysisResult = JSON.parse(jsonMatch[0]);
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
    validateGeminiClient();
    
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
    
    // Configure the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Set generation config based on tone
    const generationConfig = {
      temperature: tone === 'enthusiastic' ? 0.8 : (tone === 'minimal' ? 0.3 : 0.5),
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
    };
    
    // Create the chat session
    const chat = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: promptTemplate.system }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll help you create professional product descriptions based on the product data and visual analysis you provide. I'll follow your guidelines for tone and structure." }],
        }
      ],
    });
    
    // Generate the description
    const result = await chat.sendMessage(promptTemplate.generatePrompt(combinedData, template));
    const response = result.response;
    
    // Format the generated description
    return formatProductDescription(response.text(), template);
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
    validateGeminiClient();
    
    // Validate inputs
    if (!productData) {
      throw new Error('Product data is required');
    }
    
    // Configure the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Set generation config
    const generationConfig = {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 500,
    };
    
    // Create the prompt
    const prompt = `You are an SEO expert for e-commerce products. Generate optimized SEO meta title and description based on the product data and visual analysis provided.
    
Follow these guidelines:
- Meta title should be 50-60 characters
- Meta description should be 140-155 characters
- Include primary keywords naturally
- Make them compelling and click-worthy
- Use the provided templates for structure

Product data: ${JSON.stringify(productData)}
Image analysis: ${JSON.stringify(imageAnalysis || {})}
Title template: ${titleTemplate}
Description template: ${descriptionTemplate}

Return ONLY valid JSON with "title" and "description" fields without any additional text.`;
    
    // Generate content
    const result = await model.generateContent(prompt, generationConfig);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }
    
    // Parse the JSON
    const metaResult = JSON.parse(jsonMatch[0]);
    
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
