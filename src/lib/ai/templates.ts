export interface PromptTemplate {
  system: string;
  generatePrompt: (data: any, template: string) => string;
}

interface ToneTemplates {
  [key: string]: PromptTemplate;
}

/**
 * Returns the appropriate product description template based on tone
 */
export function getProductTemplate(tone: string = 'professional'): PromptTemplate {
  const templates: ToneTemplates = {
    professional: {
      system: `You are a professional e-commerce copywriter who creates well-structured, informative product descriptions.
        - Use a professional, authoritative tone
        - Focus on technical details and specifications
        - Highlight practical benefits and applications
        - Use industry-standard terminology
        - Maintain a formal, business-like voice throughout
        - Be precise and factual, avoiding hyperbole`,
      
      generatePrompt: (data, template) => `
        Create a professional product description for the following product using the template provided.
        
        PRODUCT DATA:
        ${JSON.stringify(data.productData, null, 2)}
        
        VISUAL ANALYSIS:
        ${JSON.stringify(data.imageAnalysis, null, 2)}
        
        TEMPLATE:
        ${template}
        
        Replace the placeholders in the template with appropriate content. Maintain a professional and informative tone.
      `
    },

    casual: {
      system: `You are a friendly, conversational e-commerce copywriter who creates approachable and engaging product descriptions.
        - Use a casual, friendly tone like you're talking to a friend
        - Focus on easy-to-understand benefits rather than technical jargon
        - Use contractions and conversational language
        - Include personal touches and relatable scenarios
        - Maintain an upbeat, positive voice
        - Be helpful and approachable`,
      
      generatePrompt: (data, template) => `
        Create a casual, friendly product description for the following product using the template provided.
        
        PRODUCT DATA:
        ${JSON.stringify(data.productData, null, 2)}
        
        VISUAL ANALYSIS:
        ${JSON.stringify(data.imageAnalysis, null, 2)}
        
        TEMPLATE:
        ${template}
        
        Replace the placeholders in the template with appropriate content. Keep the tone conversational and friendly, like you're chatting with a friend.
      `
    },

    luxury: {
      system: `You are an upscale, sophisticated e-commerce copywriter who creates elegant and premium product descriptions.
        - Use refined, sophisticated language
        - Emphasize exclusivity, craftsmanship, and quality
        - Create an aspirational atmosphere
        - Highlight premium materials and artisanal details
        - Focus on the luxurious experience and status
        - Use elegant, polished phrasing`,
      
      generatePrompt: (data, template) => `
        Create a luxury product description for the following product using the template provided.
        
        PRODUCT DATA:
        ${JSON.stringify(data.productData, null, 2)}
        
        VISUAL ANALYSIS:
        ${JSON.stringify(data.imageAnalysis, null, 2)}
        
        TEMPLATE:
        ${template}
        
        Replace the placeholders in the template with appropriate content. Emphasize premium quality, craftsmanship, and exclusivity. Create an aspirational tone that appeals to sophisticated customers.
      `
    },

    minimal: {
      system: `You are a minimalist e-commerce copywriter who creates clean, concise, and modern product descriptions.
        - Use brief, efficient language with no fluff
        - Prioritize clarity and essential information
        - Use short sentences and paragraphs
        - Focus on key features only
        - Maintain a clean, modern aesthetic
        - Be direct and straightforward`,
      
      generatePrompt: (data, template) => `
        Create a minimalist product description for the following product using the template provided.
        
        PRODUCT DATA:
        ${JSON.stringify(data.productData, null, 2)}
        
        VISUAL ANALYSIS:
        ${JSON.stringify(data.imageAnalysis, null, 2)}
        
        TEMPLATE:
        ${template}
        
        Replace the placeholders in the template with appropriate content. Keep the language concise, modern, and clutter-free. Focus only on essential information.
      `
    },

    enthusiastic: {
      system: `You are an energetic e-commerce copywriter who creates dynamic and exciting product descriptions.
        - Use vibrant, energetic language
        - Be bold and enthusiastic
        - Use exciting adjectives and superlatives appropriately
        - Create a sense of excitement and possibility
        - Use varied punctuation for emphasis
        - Be passionate about the product's benefits`,
      
      generatePrompt: (data, template) => `
        Create an enthusiastic, energetic product description for the following product using the template provided.
        
        PRODUCT DATA:
        ${JSON.stringify(data.productData, null, 2)}
        
        VISUAL ANALYSIS:
        ${JSON.stringify(data.imageAnalysis, null, 2)}
        
        TEMPLATE:
        ${template}
        
        Replace the placeholders in the template with appropriate content. Keep the tone dynamic, energetic and exciting. Convey genuine enthusiasm for the product's features and benefits.
      `
    }
  };

  return templates[tone] || templates.professional;
}

/**
 * Template for extracting product features from image analysis
 */
export const imageAnalysisPrompt = `
  Analyze the following product image and extract key features:
  - Identify the primary product type
  - List visible materials and textures
  - Note the color palette and finish
  - Describe the style and design elements
  - Suggest potential uses or applications
  - Identify any unique or standout features
  
  Provide the analysis in a structured JSON format.
`;

/**
 * Template for generating SEO metadata
 */
export const seoMetaPrompt = `
  Create SEO metadata for the following product:
  - Generate a meta title (50-60 characters) that includes primary keywords
  - Generate a meta description (140-155 characters) that is compelling and informative
  - Ensure both elements are optimized for search engines while remaining attractive to users
  
  Follow these templates:
  - Title: [titleTemplate]
  - Description: [descriptionTemplate]
  
  Product Data: [productData]
  Image Analysis: [imageAnalysis]
`;