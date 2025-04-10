# Setup Guide for VisualAi Shopify App

## Prerequisites
- Node.js 16.x or higher
- npm 8.x or higher
- PostgreSQL database
- Shopify Partner account
- OpenAI API key

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/anthonyiedm/VisualAi.git
cd VisualAi
```

2. Create a `.env` file in the root directory with the following variables:
```
# Shopify API credentials
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app-url.com

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key

# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/visualai

# App information
NEXT_PUBLIC_APP_NAME=VisualAi
NEXT_PUBLIC_APP_VERSION=1.0.0

# Node environment
NODE_ENV=development
PORT=3000
```

3. Install dependencies:
```bash
npm install
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Access the app at `http://localhost:3000`

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to Vercel:
```bash
vercel
```

4. Set environment variables in Vercel dashboard or using CLI:
```bash
vercel env add SHOPIFY_API_KEY
vercel env add SHOPIFY_API_SECRET
vercel env add SHOPIFY_APP_URL
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
```

5. Deploy to production:
```bash
vercel --prod
```

### Database Setup for Production

1. Provision a PostgreSQL database (recommended providers: Supabase, Railway, or Vercel Postgres)
2. Update the `DATABASE_URL` environment variable with your production database connection string
3. Run database migrations:
```bash
npm run db:push
```

## Shopify App Setup

1. Create a new app in your Shopify Partner dashboard
2. Set the App URL to your deployed Vercel URL
3. Configure the Allowed redirection URL(s) to include:
   - `https://your-app-url.com/api/auth/callback`
4. Copy the API Key and API Secret Key to your environment variables
5. Update the `SHOPIFY_APP_URL` environment variable with your deployed URL

## Testing

1. Install the app on a development store
2. Navigate to the app in your Shopify admin
3. Test the product description generation functionality

## Troubleshooting

- Check the Vercel deployment logs for any errors
- Verify all environment variables are correctly set
- Ensure the database connection is working properly
- Check the OpenAI API key has sufficient credits
