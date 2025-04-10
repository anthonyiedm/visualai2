#!/bin/bash

# Shopify App Setup Script

# Check if jq is installed (needed for JSON processing)
if ! command -v jq &> /dev/null; then
    echo "jq not found. Installing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Function to check if required environment variables are set
check_env_vars() {
    local required_vars=("SHOPIFY_API_KEY" "SHOPIFY_API_SECRET" "SHOPIFY_APP_URL")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    return 0
}

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check environment variables
if ! check_env_vars; then
    echo "Please set the required environment variables and try again."
    exit 1
fi

echo "=== Shopify App Setup ==="
echo "App URL: $SHOPIFY_APP_URL"
echo "API Key: $SHOPIFY_API_KEY"

# Verify app URL is accessible
echo "Verifying app URL is accessible..."
curl -s -o /dev/null -w "%{http_code}" "$SHOPIFY_APP_URL/api/health" | grep -q "200"
if [ $? -ne 0 ]; then
    echo "Warning: App URL does not seem to be accessible. Make sure your app is deployed and the URL is correct."
else
    echo "App URL is accessible."
fi

# Instructions for Shopify Partner Dashboard setup
echo ""
echo "=== Shopify Partner Dashboard Setup Instructions ==="
echo "1. Go to your Shopify Partner Dashboard: https://partners.shopify.com"
echo "2. Navigate to Apps > Create App"
echo "3. Enter the following information:"
echo "   - App Name: VisualAi"
echo "   - App URL: $SHOPIFY_APP_URL"
echo "   - Allowed redirection URL(s): $SHOPIFY_APP_URL/api/auth/callback"
echo "4. Copy the API Key and API Secret to your .env file"
echo "5. Update your app's SHOPIFY_API_KEY and SHOPIFY_API_SECRET environment variables"
echo ""
echo "After completing these steps, your Shopify app will be ready for installation on Shopify stores."
echo ""
echo "To test your app, install it on a development store from your Partner Dashboard."
