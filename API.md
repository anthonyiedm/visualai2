# API Documentation for VisualAi Shopify App

This document provides information about the API endpoints available in the VisualAi Shopify app.

## Authentication

All API endpoints (except health check) require authentication using a Shopify session token.
Include the token in the Authorization header:

```
Authorization: Bearer YOUR_SESSION_TOKEN
```

## Endpoints

### Health Check

```
GET /api/health
```

Checks the health of the application and its dependencies.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-04-04T04:58:27.000Z",
  "environment": "production",
  "version": "1.0.0",
  "database": {
    "connected": true
  },
  "services": {
    "openai": {
      "configured": true
    },
    "shopify": {
      "configured": true
    }
  },
  "session": {
    "shop": "your-store.myshopify.com",
    "isActive": true
  }
}
```

### Processing Status

```
GET /api/processing/status
```

Retrieves the status of product description generation jobs.

**Query Parameters:**
- `jobId` (optional): Filter by specific job ID
- `status` (optional): Filter by status (pending, processing, completed, error)
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "jobs": [
    {
      "id": "job-id",
      "shopId": "shop-id",
      "productId": "product-id",
      "productTitle": "Product Title",
      "originalDesc": "Original description",
      "generatedDesc": "Generated description",
      "generatedMeta": "Generated meta",
      "imageAnalysis": {},
      "status": "completed",
      "creditsUsed": 1,
      "createdAt": "2025-04-04T04:58:27.000Z",
      "completedAt": "2025-04-04T04:58:27.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalItems": 1,
    "totalPages": 1
  },
  "stats": {
    "total": 1,
    "completed": 1,
    "processing": 0,
    "error": 0,
    "pending": 0
  },
  "overallProgress": 100
}
```

### Settings

```
GET /api/settings
```

Retrieves the shop settings.

**Response:**
```json
{
  "id": "settings-id",
  "shopId": "shop-id",
  "defaultTone": "professional",
  "includeMeta": true,
  "autoSave": false,
  "productTitleTemplate": "[title] - [primary_keyword]",
  "productDescTemplate": "[product_intro]\n\n[features_list]",
  "metaTitleTemplate": "[title] - [primary_keyword] | [brand_name]",
  "metaDescTemplate": "[short_description] Features: [key_features]. [cta]",
  "visualAnalysisDepth": "standard",
  "autoDetectType": true,
  "enhancedMaterials": true,
  "colorAnalysis": true,
  "emailUpdates": true,
  "creditAlerts": true,
  "productUpdates": true,
  "createdAt": "2025-04-04T04:58:27.000Z",
  "updatedAt": "2025-04-04T04:58:27.000Z"
}
```

```
PUT /api/settings
```

Updates the shop settings.

**Request Body:**
```json
{
  "defaultTone": "enthusiastic",
  "includeMeta": true,
  "autoSave": true,
  "productTitleTemplate": "[title] - [primary_keyword]",
  "productDescTemplate": "[product_intro]\n\n[features_list]",
  "metaTitleTemplate": "[title] - [primary_keyword] | [brand_name]",
  "metaDescTemplate": "[short_description] Features: [key_features]. [cta]",
  "visualAnalysisDepth": "detailed",
  "autoDetectType": true,
  "enhancedMaterials": true,
  "colorAnalysis": true,
  "emailUpdates": false,
  "creditAlerts": true,
  "productUpdates": false
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    // Updated settings object
  }
}
```

### Credits

```
GET /api/credits
```

Retrieves the shop credits information.

**Response:**
```json
{
  "id": "credits-id",
  "shopId": "shop-id",
  "available": 100,
  "total": 150,
  "resetDate": "2025-05-01T00:00:00.000Z",
  "lastPurchased": "2025-04-01T00:00:00.000Z",
  "createdAt": "2025-04-01T00:00:00.000Z",
  "updatedAt": "2025-04-04T04:58:27.000Z"
}
```

### Products

```
GET /api/products
```

Retrieves products from the Shopify store.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 250)
- `cursor` (optional): Pagination cursor
- `query` (optional): Search query

**Response:**
```json
{
  "products": [
    {
      "id": "product-id",
      "title": "Product Title",
      "description": "Product description",
      "images": [
        {
          "id": "image-id",
          "src": "https://cdn.shopify.com/image.jpg",
          "alt": "Image alt text"
        }
      ],
      "variants": [
        {
          "id": "variant-id",
          "title": "Variant Title",
          "price": "19.99"
        }
      ]
    }
  ],
  "pagination": {
    "hasNextPage": true,
    "nextCursor": "next-cursor"
  }
}
```

```
POST /api/products/:id/generate
```

Generates a product description for a specific product.

**Request Body:**
```json
{
  "tone": "professional",
  "template": "[product_intro]\n\n[features_list]",
  "includeMeta": true,
  "visualAnalysisDepth": "standard",
  "autoSave": false
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-id",
  "status": "pending"
}
```

## Rate Limits

All API endpoints are subject to rate limiting:
- 5 requests per minute per shop for processing status
- 10 requests per minute per shop for other endpoints

When rate limit is exceeded, the API will respond with a 429 status code and a Retry-After header.
