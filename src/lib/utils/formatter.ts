/**
 * Extract and structure image features from AI analysis
 */
export function extractImageFeatures(analysisResult: any): any {
  // If the analysis is already well-structured, return it as is
  if (
    analysisResult &&
    typeof analysisResult === 'object' &&
    (analysisResult.features || 
     analysisResult.materials || 
     analysisResult.colors || 
     analysisResult.style)
  ) {
    return analysisResult;
  }

  // Otherwise, try to extract structured data from the analysis
  const structured: Record<string, any> = {};

  // Extract common fields that might be in the analysis
  const possibleFields = [
    'product_type', 'productType', 'type',
    'materials', 'material',
    'colors', 'color', 'colorPalette',
    'style', 'design', 'designElements',
    'features', 'keyFeatures',
    'uses', 'applications', 'potentialUses',
    'dimensions', 'size', 'measurements'
  ];

  for (const field of possibleFields) {
    if (analysisResult[field] !== undefined) {
      // Convert camelCase or snake_case to readable format
      const formattedField = field
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim();
      
      structured[formattedField] = analysisResult[field];
    }
  }

  // If we couldn't extract structured data, return the original
  if (Object.keys(structured).length === 0) {
    return analysisResult;
  }

  return structured;
}

/**
 * Format product description based on template
 */
export function formatProductDescription(description: string, template: string): string {
  // If the description already follows the template structure, return it as is
  if (description.includes('[product_intro]') || 
      description.includes('[features_list]') ||
      description.includes('[technical_specs]')) {
    return description;
  }

  // If the template is simple or not provided, return the description as is
  if (!template || template.trim() === '') {
    return description;
  }

  // Check if the description is already HTML formatted
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(description);
  
  // If the description is already in HTML format and the template contains HTML,
  // we'll assume the AI has already applied the template
  if (isHtml && template.includes('<')) {
    return description;
  }

  // For plain text descriptions with HTML templates, we need to apply some basic formatting
  if (!isHtml && template.includes('<')) {
    // Split description into paragraphs
    const paragraphs = description.split(/\n\n+/);
    
    // Assume first paragraph is intro
    const intro = paragraphs[0];
    
    // Assume subsequent paragraphs are features or details
    const features = paragraphs.slice(1);
    
    // Create a features list if there are multiple paragraphs
    let featuresList = '';
    if (features.length > 0) {
      featuresList = '<ul>' + 
        features.map(feature => `<li>${feature.trim()}</li>`).join('') + 
        '</ul>';
    }
    
    // Replace placeholders in template
    return template
      .replace('[product_intro]', intro)
      .replace('[features_list]', featuresList)
      .replace('[technical_specs]', ''); // No technical specs in this simple conversion
  }

  // For plain text templates and descriptions, just return the description
  return description;
}

/**
 * Format product title
 */
export function formatProductTitle(
  title: string, 
  template: string, 
  data: { [key: string]: any }
): string {
  if (!template || template.trim() === '') {
    return title;
  }

  // Replace placeholders in template
  let formattedTitle = template;
  
  // Common placeholders
  const placeholders: { [key: string]: string } = {
    '[title]': data.title || title,
    '[brand_name]': data.vendor || data.brand || '',
    '[product_type]': data.productType || data.product_type || '',
    '[primary_feature]': data.primaryFeature || 
      (data.features && data.features.length > 0 ? data.features[0] : ''),
    '[primary_keyword]': data.primaryKeyword || data.primary_keyword || '',
    '[color]': data.color || (data.variants && data.variants[0]?.color) || '',
    '[material]': data.material || (data.variants && data.variants[0]?.material) || '',
  };

  // Replace all placeholders
  for (const [placeholder, value] of Object.entries(placeholders)) {
    formattedTitle = formattedTitle.replace(
      new RegExp(placeholder, 'g'), 
      value
    );
  }

  // Remove any remaining placeholders
  formattedTitle = formattedTitle.replace(/\[[^\]]+\]/g, '');
  
  // Clean up multiple spaces, dashes, and pipes
  formattedTitle = formattedTitle
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();

  return formattedTitle;
}

/**
 * Format product meta description
 */
export function formatMetaDescription(
  description: string, 
  template: string, 
  data: { [key: string]: any }
): string {
  if (!template || template.trim() === '') {
    return description;
  }

  // Replace placeholders in template
  let formattedDescription = template;
  
  // Common placeholders
  const placeholders: { [key: string]: string } = {
    '[short_description]': description.split('.')[0] || '',
    '[key_features]': data.keyFeatures || 
      (data.features && data.features.slice(0, 3).join(', ')) || '',
    '[brand_name]': data.vendor || data.brand || '',
    '[product_type]': data.productType || data.product_type || '',
    '[cta]': 'Shop now.' // Default call to action
  };

  // Replace all placeholders
  for (const [placeholder, value] of Object.entries(placeholders)) {
    formattedDescription = formattedDescription.replace(
      new RegExp(placeholder, 'g'), 
      value
    );
  }

  // Remove any remaining placeholders
  formattedDescription = formattedDescription.replace(/\[[^\]]+\]/g, '');
  
  // Clean up multiple spaces
  formattedDescription = formattedDescription.replace(/\s+/g, ' ').trim();

  // Ensure it's not too long (155 chars max for meta description)
  if (formattedDescription.length > 155) {
    formattedDescription = formattedDescription.substring(0, 152) + '...';
  }

  return formattedDescription;
}