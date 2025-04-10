# Supabase Database Setup Guide for VisualAi

This guide will walk you through setting up a PostgreSQL database using Supabase for your VisualAi Shopify app.

## Why Supabase?

Supabase is an excellent choice for your Shopify app because:
- It offers a generous free tier (up to 500MB storage and 100K rows)
- It's fully PostgreSQL-compatible (which your app is already designed for)
- It provides a user-friendly dashboard for database management
- It includes authentication services if you need them in the future
- It has built-in row-level security for advanced data protection

## Step 1: Create a Supabase Account

1. Visit [https://supabase.com/](https://supabase.com/) and click "Start your project"
2. Sign up using your GitHub account or email
3. Verify your email if required

## Step 2: Create a New Project

1. From the Supabase dashboard, click "New Project"
2. Enter a name for your project (e.g., "visualai-shopify")
3. Set a secure database password (save this for later use)
4. Choose a region closest to your target users
5. Click "Create new project"

Project creation may take a few minutes to complete.

## Step 3: Get Your Database Connection String

1. Once your project is created, go to the project dashboard
2. In the left sidebar, click on "Settings" (gear icon)
3. Click on "Database"
4. Scroll down to the "Connection string" section
5. Select "URI" from the dropdown
6. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xyzabcdefg.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with the database password you set during project creation

## Step 4: Set Up Your Database Schema

Supabase uses standard PostgreSQL, so you can use Prisma to set up your schema:

1. Add your connection string to your `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xyzabcdefg.supabase.co:5432/postgres
   ```

2. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

3. Push your schema to the database:
   ```bash
   npm run db:push
   ```

## Step 5: Verify Database Connection

1. Run the health check endpoint to verify your database connection:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. You should see a response with `"database": { "connected": true }`

## Step 6: Add Database Connection to Vercel

When deploying to Vercel, add your Supabase connection string as an environment variable:

1. In your Vercel project, go to "Settings" > "Environment Variables"
2. Add a new variable with the key `DATABASE_URL` and your Supabase connection string as the value
3. Save your changes and redeploy your application

## Database Management

You can manage your database directly from the Supabase dashboard:

1. Go to the "Table Editor" to view and edit your data
2. Use the "SQL Editor" to run custom queries
3. Check "Storage" for file uploads (if your app uses this feature)
4. Monitor usage in the "Reports" section

## Backup and Restore

Supabase automatically creates daily backups of your database. To create a manual backup:

1. Go to "Settings" > "Database"
2. Scroll down to the "Database Backups" section
3. Click "Generate a backup"

## Troubleshooting

If you encounter database connection issues:

1. Check that your connection string is correctly formatted
2. Verify that your database password is correct
3. Ensure that your IP address is allowed in the Supabase dashboard (Settings > Database > Network)
4. Check Supabase status at [https://status.supabase.com/](https://status.supabase.com/)

## Scaling Up

The free tier of Supabase is sufficient for development and small-scale production use. When your app grows:

1. Upgrade to a paid plan for more resources
2. Consider enabling connection pooling for better performance
3. Set up read replicas for high-traffic applications

## Security Best Practices

1. Never commit your database connection string to version control
2. Rotate your database password periodically
3. Use Supabase's Row Level Security for fine-grained access control
4. Enable SSL for database connections (enabled by default in Supabase)
5. Regularly audit your database access logs
