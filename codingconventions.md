# Coding Conventions

## General Principles

- Use TypeScript for all backend logic.
- Follow Express.js best practices for API structure.
- Use detailed comments to explain the purpose of code, especially for business logic and API endpoints.
- Keep code modular: separate routes, middleware, and services.
- Use async/await for asynchronous operations.
- Prefer updating and improving existing files over creating new ones.

## File/Folder Structure

- Place all backend logic in the `src/` directory.
- Organize by feature: `routes/`, `services/`, `middleware/`, `data/`, `types/`.
- Remove frontend/interface files from backend folders after migration.

## Documentation

- Update `README.md` and `codeupdates.md` with every significant change.
- Document all API endpoints and business logic changes.

## Port Binding for Deployment

- Always use `process.env.PORT` for the server port in Express apps.
- Provide a fallback (e.g., 5000) for local development.
- Never hardcode the port for deployment; deployment platforms require dynamic port assignment.

## Error Handling & 404s

- All API errors must return a JSON response with an appropriate HTTP status code.
- Use centralized error handling middleware in Express to catch and log errors.
- Implement a 404 handler for unknown API routes that returns a JSON error.
- Never expose stack traces or sensitive error details in production responses.

## Health Check Endpoint

- Always provide a `/api/health` endpoint that returns HTTP 200 and a simple JSON payload.
- Use this endpoint for deployment health checks and uptime monitoring.

## Extensibility & Abstraction

- Design all endpoints and services to be generic and reusable across multiple frontend apps.
- Avoid hardcoding business logic for a single frontend; expose logic via clear API contracts.
- When adding new features, prefer extending existing files and modules over creating redundant code.
- Document the purpose and usage of new endpoints and services in code comments and the README.

## Authentication & CORS

- Use Clerk for authentication. All protected endpoints must use the requireAuth middleware from src/middleware/clerkAuth.ts.
- Document all changes to authentication logic and environment variables in codeupdates.md.
- Always keep ALLOWED_ORIGINS up to date with all frontend URLs.
