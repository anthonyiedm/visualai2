import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api'; // Reverted imports
import prisma from '../prisma';

// Define interfaces for expected GraphQL responses (adjust fields as needed)
interface ShopifyProduct {
  id: string;
  title: string;
  descriptionHtml: string;
  images: {
    edges: Array<{ node: { url: string } }>;
  };
  featuredImage?: { url: string };
  // Add other fields you need
}

interface ShopifyCollection {
  id: string;
  title: string;
  productsCount: number; // Note: Getting this efficiently might require adjustments
  // Add other fields you need
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

interface ProductsQueryResult {
  products: {
    edges: Array<{ node: ShopifyProduct; cursor: string }>;
    pageInfo: PageInfo;
  };
}

interface ProductQueryResult {
  product: ShopifyProduct;
}

interface CollectionsQueryResult {
  collections: {
    edges: Array<{ node: ShopifyCollection; cursor: string }>;
    pageInfo: PageInfo;
  };
}

interface ProductUpdateMutationResult {
  productUpdate?: { // Make optional for error cases
    product: ShopifyProduct;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

// Generic type for the GraphQL response body
interface GraphQLResponseBody<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[]; extensions?: any }>;
  extensions?: any;
}

// --- Additional Interfaces for Detailed Product/Metafields/SEO ---

interface Metafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

interface Seo {
  title?: string;
  description?: string;
}

// More detailed product interface including fields from graphql.ts query
interface ShopifyProductDetailed extends ShopifyProduct {
  handle: string;
  description: string; // Raw description
  productType: string;
  vendor: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  metafields: {
    edges: Array<{ node: Metafield }>;
  };
  seo: Seo;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: string;
        compareAtPrice?: string;
        sku?: string;
        barcode?: string;
        inventoryQuantity?: number;
      };
    }>;
  };
}

interface ProductWithMetafieldsQueryResult {
  product: ShopifyProductDetailed | null; // Product might not be found
}

// Interface for the result of a single metafieldSet operation
interface MetafieldSetResult {
  metafield: Metafield | null; // Metafield might be null if creation failed
  userErrors: Array<{ field: string[]; message: string }>;
}

// Interface for the result of the dynamic metafield update mutation
// Uses a Record to handle dynamic keys like metafield0, metafield1, etc.
type MetafieldUpdateMutationResultData = Record<string, MetafieldSetResult>;

interface ProductSeoUpdateResult {
   productUpdate?: {
     product: {
       id: string;
       seo: Seo;
     };
     userErrors: Array<{ field: string[]; message: string }>;
   };
}


/**
 * Initialize the Shopify API client (remains mostly the same)
 */
export const shopify = shopifyApi({ // Reverted to original instance creation
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: [
    'read_products',
    'write_products',
    'read_product_listings',
    'read_content',
    'write_content'
    // Add any other required scopes
  ],
  hostName: process.env.SHOPIFY_APP_URL || '',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  // Ensure you have session storage configured if not using default
});

/**
 * Get a Shopify GraphQL client for a specific shop
 */
// Infer the client type using ReturnType on the constructor
type ShopifyGraphqlClient = InstanceType<typeof shopify.clients.Graphql>;
async function getShopifyGraphqlClient(shop: string): Promise<{ client: ShopifyGraphqlClient; session: Session }> {
  const shopData = await prisma.shop.findUnique({
    where: { shopifyDomain: shop }
  });

  if (!shopData || !shopData.shopifyToken) {
    throw new Error(`No token found for shop ${shop}`);
  }

  // Create a session object. Use customAppSession or loadOfflineSession depending on your auth strategy
  // Assuming customAppSession for simplicity here, adjust if using offline tokens
  const session = shopify.session.customAppSession(shop);
  session.accessToken = shopData.shopifyToken;
  session.shop = shop; // Ensure shop is set on the session

  const client = new shopify.clients.Graphql({ session });
  return { client, session };
}

// --- GraphQL Queries and Mutations ---

const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          descriptionHtml
          featuredImage {
             url
          }
          images(first: 1) { # Fetch only first image for list view efficiency
            edges {
              node {
                url
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const GET_PRODUCT_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      descriptionHtml
      images(first: 10) { # Fetch more images for single product view
        edges {
          node {
            url
          }
        }
      }
      featuredImage {
         url
      }
      # Add other fields as needed
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        descriptionHtml
        # Add fields you want returned after update
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_COLLECTIONS_QUERY = `
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          productsCount # This field exists directly in GraphQL
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const GET_PRODUCTS_BY_COLLECTION_QUERY = `
  query GetProductsByCollection($collectionId: ID!, $first: Int!, $after: String) {
    collection(id: $collectionId) {
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            title
            descriptionHtml
            featuredImage {
               url
            }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// Query from graphql.ts for detailed product fetch
const GET_PRODUCT_WITH_METAFIELDS_QUERY = `
  query GetProductWithMetafields($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      description
      descriptionHtml
      productType
      vendor
      tags
      status
      createdAt
      updatedAt
      featuredImage {
        id
        url
        altText
      }
      images(first: 10) {
        edges {
          node {
            id
            url
            altText
          }
        }
      }
      metafields(first: 10) { # Consider pagination if more metafields are expected
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
      seo {
        title
        description
      }
      variants(first: 10) { # Consider pagination
        edges {
          node {
            id
            title
            price
            compareAtPrice
            sku
            barcode
            inventoryQuantity
          }
        }
      }
    }
  }
`;

// Mutation from graphql.ts for SEO update
const UPDATE_PRODUCT_SEO_MUTATION = `
  mutation ProductSeoUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;


// --- Refactored API Functions ---

/**
 * Fetch products from Shopify using GraphQL
 */
export async function fetchProducts(shop: string, limit = 10, cursor?: string) {
  const { client } = await getShopifyGraphqlClient(shop);

  // T in client.query<T> refers to the type of response.body
  const response = await client.query<GraphQLResponseBody<ProductsQueryResult>>({
    data: {
      query: GET_PRODUCTS_QUERY,
      variables: {
        first: limit,
        after: cursor,
      },
    },
  });

  // Access data and errors directly from response.body
  if (!response.body?.data?.products || response.body?.errors) {
    console.error("GraphQL Error fetching products:", response.body?.errors);
    throw new Error("Failed to fetch products");
  }

  return {
    products: response.body.data.products.edges.map((edge: { node: ShopifyProduct; cursor: string }) => edge.node),
    pageInfo: response.body.data.products.pageInfo,
  };
}

/**
 * Fetch a single product from Shopify using GraphQL
 */
export async function fetchProduct(shop: string, productId: string): Promise<ShopifyProduct | null> {
  const { client } = await getShopifyGraphqlClient(shop);
  // Ensure productId is in the correct GID format (e.g., "gid://shopify/Product/12345")
  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;


  const response = await client.query<GraphQLResponseBody<ProductQueryResult>>({
    data: {
      query: GET_PRODUCT_QUERY,
      variables: { id: gid },
    },
  });

   if (!response.body?.data?.product || response.body?.errors) {
    console.error(`GraphQL Error fetching product ${gid}:`, response.body?.errors);
    // Decide if throwing an error or returning null is better
    return null;
  }

  return response.body.data.product;
}

/**
 * Update a product in Shopify using GraphQL
 */
export async function updateProduct(shop: string, productId: string, data: { title?: string; descriptionHtml?: string; /* other fields */ }) {
  const { client } = await getShopifyGraphqlClient(shop);
  // Ensure productId is in the correct GID format
  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;

  const input = {
    id: gid,
    ...data, // Spread the fields to update
  };

  const response = await client.query<GraphQLResponseBody<ProductUpdateMutationResult>>({
    data: {
      query: UPDATE_PRODUCT_MUTATION,
      variables: { input },
    },
  });

  const userErrors = response.body?.data?.productUpdate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    console.error("GraphQL User Errors updating product:", userErrors);
    throw new Error(`Failed to update product: ${userErrors[0].message}`);
  }

  if (!response.body?.data?.productUpdate?.product || response.body?.errors) {
     console.error("GraphQL Error updating product:", response.body?.errors);
     throw new Error("Failed to update product");
  }

  return response.body.data.productUpdate.product;
}

/**
 * Fetch collections from Shopify using GraphQL
 */
export async function fetchCollections(shop: string, limit = 10, cursor?: string) {
  const { client } = await getShopifyGraphqlClient(shop);

  const response = await client.query<GraphQLResponseBody<CollectionsQueryResult>>({
    data: {
      query: GET_COLLECTIONS_QUERY,
      variables: {
        first: limit,
        after: cursor,
      },
    },
  });

  if (!response.body?.data?.collections || response.body?.errors) {
     console.error("GraphQL Error fetching collections:", response.body?.errors);
     throw new Error("Failed to fetch collections");
  }

  return {
    collections: response.body.data.collections.edges.map((edge: { node: ShopifyCollection; cursor: string }) => edge.node),
    pageInfo: response.body.data.collections.pageInfo,
  };
}

/**
 * Fetch products by collection ID using GraphQL
 */
export async function fetchProductsByCollection(shop: string, collectionId: string, limit = 10, cursor?: string) {
  const { client } = await getShopifyGraphqlClient(shop);
  // Ensure collectionId is in the correct GID format
  const gid = collectionId.startsWith('gid://') ? collectionId : `gid://shopify/Collection/${collectionId}`;

  // Note: The query asks for collection { products { ... } }
  // So the data type is { collection: { products: ... } | null }
  const response = await client.query<GraphQLResponseBody<{ collection: { products: ProductsQueryResult['products'] } | null }>>({
    data: {
      query: GET_PRODUCTS_BY_COLLECTION_QUERY,
      variables: {
        collectionId: gid,
        first: limit,
        after: cursor,
      },
    },
  });

  if (!response.body?.data?.collection?.products || response.body?.errors) {
     console.error(`GraphQL Error fetching products for collection ${gid}:`, response.body?.errors);
     throw new Error("Failed to fetch products for collection");
  }

  return {
    products: response.body.data.collection.products.edges.map((edge: { node: ShopifyProduct; cursor: string }) => edge.node),
    pageInfo: response.body.data.collection.products.pageInfo,
  };
}


/**
 * Get a product's main image URL (adjust based on GraphQL structure)
 */
export function getProductImageUrl(product: ShopifyProduct | null): string | null {
  if (!product) return null;

  // Use featuredImage if available, otherwise the first image
  if (product.featuredImage?.url) {
    return product.featuredImage.url;
  }
  if (product.images?.edges?.length > 0 && product.images.edges[0].node?.url) {
    return product.images.edges[0].node.url;
  }
  return null;
}


// --- Consolidated Functions from graphql.ts ---

/**
 * Fetch detailed product data including metafields using GraphQL
 * (Adapted from graphql.ts)
 */
export async function fetchProductWithMetafields(shop: string, productId: string): Promise<ShopifyProductDetailed | null> {
  const { client } = await getShopifyGraphqlClient(shop);
  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;

  const response = await client.query<GraphQLResponseBody<ProductWithMetafieldsQueryResult>>({
    data: {
      query: GET_PRODUCT_WITH_METAFIELDS_QUERY,
      variables: { id: gid },
    },
  });

  if (!response.body?.data?.product || response.body?.errors) {
    console.error(`GraphQL Error fetching detailed product ${gid}:`, response.body?.errors);
    return null;
  }

  // Add basic type assertion if needed, or refine ShopifyProductDetailed interface
  return response.body.data.product as ShopifyProductDetailed;
}

/**
 * Update product metafields using GraphQL
 * (Adapted from graphql.ts, keeping dynamic mutation generation)
 */
export async function updateProductMetafields(shop: string, productId: string, metafields: Array<{ namespace: string; key: string; type: string; value: string }>) {
  const { client } = await getShopifyGraphqlClient(shop);
  const productGid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;

  // Escape quotes in values
  const escapeQuotes = (str: string) => str.replace(/"/g, '\\"');

  // Create metafield update mutations string dynamically
  const metafieldInputs = metafields.map((metafield, index) => {
    // Basic validation
    if (!metafield.namespace || !metafield.key || !metafield.type || metafield.value === undefined || metafield.value === null) {
        console.warn(`Skipping invalid metafield data for key ${metafield.key}:`, metafield);
        return ''; // Skip invalid entries
    }
    return `
      metafield${index}: metafieldSet(
        metafields: [{
          namespace: "${escapeQuotes(metafield.namespace)}"
          key: "${escapeQuotes(metafield.key)}"
          ownerId: "${productGid}"
          type: "${escapeQuotes(metafield.type)}"
          value: "${escapeQuotes(metafield.value)}"
        }]
      ) {
        metafields {
          id
          key
          value
          namespace
          type
        }
        userErrors {
          field
          message
        }
      }
    `;
  }).filter(Boolean).join('\n'); // Filter out empty strings from skipped entries

  if (!metafieldInputs) {
    console.log("No valid metafields to update.");
    return { data: {}, errors: null }; // Or handle as appropriate
  }

  const mutation = `mutation { ${metafieldInputs} }`;

  // The response type uses a Record for dynamic keys
  const response = await client.query<GraphQLResponseBody<MetafieldUpdateMutationResultData>>({
    data: { query: mutation }
  });

  // Check for general errors or errors within specific metafieldSet results
   if (response.body?.errors || Object.values(response.body?.data ?? {}).some(result => (result as MetafieldSetResult).userErrors?.length > 0)) {
     console.error("GraphQL Error updating metafields:", response.body?.errors, response.body?.data);
     // Consider throwing a more specific error based on userErrors
     throw new Error("Failed to update one or more metafields.");
   }

  return response.body.data; // Return the data part containing results for each metafieldSet
}


/**
 * Update product SEO fields using GraphQL
 * (Adapted from graphql.ts)
 */
export async function updateProductSeo(shop: string, productId: string, seoData: { title?: string; description?: string }) {
  const { client } = await getShopifyGraphqlClient(shop);
  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;

  // Prepare input, ensuring quotes are escaped and null/undefined fields are omitted
  const seoInput: { title?: string; description?: string } = {};
  if (seoData.title !== undefined && seoData.title !== null) {
      seoInput.title = seoData.title;
  }
   if (seoData.description !== undefined && seoData.description !== null) {
      seoInput.description = seoData.description;
  }

  // Only proceed if there's something to update
  if (Object.keys(seoInput).length === 0) {
      console.log("No SEO data provided for update.");
      return null; // Or handle as appropriate
  }

  const input = {
    id: gid,
    seo: seoInput,
  };

  const response = await client.query<GraphQLResponseBody<ProductSeoUpdateResult>>({
    data: {
      query: UPDATE_PRODUCT_SEO_MUTATION,
      variables: { input },
    },
  });

  const userErrors = response.body?.data?.productUpdate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    console.error("GraphQL User Errors updating product SEO:", userErrors);
    throw new Error(`Failed to update product SEO: ${userErrors[0].message}`);
  }

  if (!response.body?.data?.productUpdate?.product || response.body?.errors) {
     console.error("GraphQL Error updating product SEO:", response.body?.errors);
     throw new Error("Failed to update product SEO");
  }

  return response.body.data.productUpdate.product.seo;
}