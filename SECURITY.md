# Security Best Practices for VisualAi Shopify App

This document outlines security best practices for deploying and maintaining the VisualAi Shopify app.

## API Keys and Secrets

### OpenAI API Key
- Store the OpenAI API key as an environment variable, never in code
- Use a dedicated API key for this application
- Set up usage limits in the OpenAI dashboard to prevent unexpected charges
- Rotate the API key periodically (recommended every 90 days)

### Shopify API Credentials
- Store Shopify API key and secret as environment variables
- Never commit these values to version control
- Use separate API credentials for development and production environments
- Limit app scopes to only what's necessary for functionality

## Environment Variables

- Use Vercel's environment variable encryption for sensitive values
- Set up separate environment variables for development and production
- Avoid exposing environment variables to the client-side code
- Use the `.env.example` file as a template, but never include actual values

## Database Security

- Use strong, unique passwords for database access
- Enable SSL for database connections in production
- Implement database connection pooling to manage connections efficiently
- Back up your database regularly
- Use parameterized queries to prevent SQL injection (Prisma handles this automatically)

## Authentication and Authorization

- Always verify Shopify session tokens for API requests
- Validate webhook signatures for incoming webhooks
- Implement rate limiting to prevent abuse
- Use HTTPS for all communications
- Set secure and SameSite cookies for session management

## Content Security Policy

- The app includes a Content Security Policy that allows embedding in Shopify admin
- Review and update the CSP headers if additional resources need to be loaded
- Test CSP configuration using the [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Error Handling

- Use generic error messages in production to avoid leaking implementation details
- Log detailed error information server-side for debugging
- Implement structured error responses for API endpoints
- Add request IDs to error responses for traceability

## Monitoring and Logging

- Set up monitoring for unusual API usage patterns
- Implement logging for security-relevant events
- Review logs regularly for suspicious activity
- Consider using a service like Sentry for error tracking

## Regular Updates

- Keep dependencies updated to patch security vulnerabilities
- Run `npm audit` regularly to check for security issues
- Subscribe to security advisories for critical dependencies
- Plan for regular security reviews of your codebase

## Deployment Security

- Use Vercel's built-in security features for deployment
- Implement preview deployments for testing changes before production
- Use branch protection rules in GitHub to prevent unauthorized changes
- Require code reviews before merging to main branches
