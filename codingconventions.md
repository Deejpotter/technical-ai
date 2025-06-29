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

- Use Clerk for authentication. All protected endpoints must use the requireAuth() middleware from src/middleware/clerkAuth.ts (note: requireAuth must be called as a function).
- Document all changes to authentication logic and environment variables in codeupdates.md.
- Always keep ALLOWED_ORIGINS up to date with all frontend URLs.

## Admin & Role-Based Access Conventions

- Use Clerk's `publicMetadata` for role-based access:
  - `isAdmin: true` for admin access.
  - `isMaster: true` for master admin access.
- Protect sensitive endpoints with `requireMasterAdmin` middleware.
- Always check `isMaster` for master admin features.
- Set these fields in the Clerk dashboard for each user as needed.
- Ensure `.env` includes `CLERK_SECRET_KEY` for backend role checks.

## ShippingItem Model (2025-06-12)

- The `ShippingItem` type is now global (not user-specific) and only includes:
  - `_id`, `name`, `sku`, `length`, `width`, `height`, `weight` (all required)
- Do **not** add `userId`, `notes`, `category`, `imageUrl`, or `quantity` fields to `ShippingItem`.
- The `quantity` property is only used in the frontend UI for the "Selected Items" section and **should not** be stored in the database or backend models.
- All backend service and route logic must use only these fields for shipping items.
- Add or update comments in code to clarify the global, simplified model and the separation of UI-only fields like `quantity`.

## Logging Conventions

- Log all incoming API requests with method, path, and request body (for POST/PUT).
- Log all outgoing responses, especially errors, with status, error message, and userId if available.
- In middleware, log authentication and authorization events (success and failure).
- In services and data providers, log all major actions and errors.
- Use clear, contextual messages (e.g., [Users], [AI], [Auth], [Shipping], etc.) for easy filtering.
- Never log sensitive data (e.g., passwords, tokens).
- Use the backend console output to debug and monitor API activity.
- All errors must be logged with as much context as possible (userId, request path, etc.).

## Async Error Handling in Express

- Always use the `wrapAsync` utility (see `src/utils/wrapAsync.ts`) to wrap all async route handlers.
- This avoids repetitive try/catch blocks and ensures all errors are passed to Express's error middleware via `next(err)`.
- Example usage:

  ```js
  router.get('/api/some-route', wrapAsync(async (req, res) => { ... }));
  ```

- This is my preferred pattern for all async routes, as it keeps the codebase clean and avoids subtle bugs where errors might otherwise be swallowed or not logged properly.
- See the in-line comments in `wrapAsync.ts` for more details.

## OpenAI Integration Conventions (as of December 2024)

- **Always use function calling** for structured data extraction from OpenAI instead of JSON mode.
- Define strict function schemas with required fields to ensure data quality.
- Use descriptive function names and parameter descriptions for better AI understanding.
- Implement comprehensive validation of function call responses before processing.
- Handle function calling errors gracefully with appropriate fallbacks.
- Never allow placeholder values like "N/A", "UNKNOWN", or "NONE" in structured data extraction.
- Log all OpenAI requests and responses for debugging and monitoring.

## Invoice Processing Conventions (as of December 2024)

- All invoice processing must use OpenAI function calling for reliable structured data extraction:
  1. Extract text from file (PDF/TXT).
  2. Remove personal data (emails, phones, addresses) from text.
  3. Use function calling to parse items with strict validation.
  4. Check database first for existing SKUs before AI estimation.
  5. Use database data when available, AI estimation only as fallback.
  6. Automatically add new items to database for future efficiency.
- **Database-First Approach:** Always check existing data before using AI estimation.
- **SKU Validation:** Reject any items without valid, meaningful SKUs.
- **Quantity Preservation:** Maintain original invoice quantities throughout the pipeline.
- **Type Safety:** Use TypeScript interfaces for all data structures.
- Use `processInvoiceFileModular` as the single source of truth for invoice processing.
- Document all workflow changes in `codeupdates.md` and `README.md`.

## Data Validation Conventions

- Always validate OpenAI function call responses before using the data.
- Implement filtering to remove invalid or placeholder data early in the pipeline.
- Use TypeScript type guards for runtime validation of external data.
- Log validation failures with specific details for debugging.
- Provide meaningful fallbacks when validation fails.
- Never pass unvalidated external data to database operations.
