# Database Setup Guide for VisualAi

This guide will help you set up the PostgreSQL database for the VisualAi Shopify app.

## Local Development Setup

### Option 1: Using Docker (Recommended)

1. Install Docker if you haven't already: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

2. Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    container_name: visualai-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: visualai
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

3. Start the PostgreSQL container:

```bash
docker-compose up -d
```

4. Update your `.env` file with the database connection string:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/visualai
```

### Option 2: Using a Local PostgreSQL Installation

1. Install PostgreSQL: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

2. Create a new database:

```bash
psql -U postgres
CREATE DATABASE visualai;
\q
```

3. Update your `.env` file with the database connection string:

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/visualai
```

## Production Database Setup

### Option 1: Vercel Postgres

1. In your Vercel dashboard, go to Storage and create a new Postgres database.

2. Copy the connection string provided by Vercel.

3. Add the connection string to your Vercel environment variables as `DATABASE_URL`.

### Option 2: Supabase

1. Create a Supabase account: [https://supabase.com/](https://supabase.com/)

2. Create a new project and database.

3. Get the connection string from the Settings > Database section.

4. Add the connection string to your Vercel environment variables as `DATABASE_URL`.

### Option 3: Railway

1. Create a Railway account: [https://railway.app/](https://railway.app/)

2. Create a new PostgreSQL database.

3. Get the connection string from the Connect tab.

4. Add the connection string to your Vercel environment variables as `DATABASE_URL`.

## Database Schema Setup

After setting up your database and configuring the connection string, run the following commands to set up the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to the database
npm run db:push
```

## Verifying Database Connection

To verify that your database connection is working correctly, you can use the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

If the database connection is successful, you should see a response with `"database": { "connected": true }`.

## Troubleshooting

If you encounter database connection issues:

1. Verify that your database is running and accessible.
2. Check that your `DATABASE_URL` environment variable is correctly formatted.
3. Ensure that the database user has the necessary permissions.
4. Check for any network restrictions or firewall settings that might block the connection.
5. For production deployments, ensure that the database allows connections from your Vercel deployment region.
