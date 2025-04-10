#!/bin/bash

# Deployment script for Vercel

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're logged in to Vercel
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in to Vercel. Please run 'vercel login' first."
    exit 1
fi

# Ensure environment variables are set
if [ ! -f .env ]; then
    echo "No .env file found. Creating from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env file from .env.example. Please update with your actual values."
        echo "Edit the .env file and then run this script again."
        exit 1
    else
        echo "No .env.example file found. Please create a .env file with required variables."
        exit 1
    fi
fi

# Check for required environment variables
required_vars=("SHOPIFY_API_KEY" "SHOPIFY_API_SECRET" "SHOPIFY_APP_URL" "OPENAI_API_KEY" "DATABASE_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    grep -q "^$var=" .env
    if [ $? -ne 0 ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "Missing required environment variables in .env file:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo "Please update your .env file and try again."
    exit 1
fi

# Run database migrations if needed
echo "Generating Prisma client..."
npm run db:generate

# Build the application
echo "Building the application..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete!"
