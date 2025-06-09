# Code Updates Log

## [2025-06-08] Migration Plan Initiated

- Created `codingconventions.md` and `codeupdates.md`.
- Noted that `README.md` was empty and will be updated with architecture and implementation plan.
- Next: Identify backend logic in `sample code` for migration to Express, and list frontend/interface files for removal.

## [2025-06-08] Migration Plan: Backend Logic and Cleanup

- Identified backend logic in `sample code` for migration:
  - `utils/data/MongoDBProvider.ts`, `DataService.ts`
  - `app/actions/data-actions.ts`, `processInvoice.ts`, `chat.ts`
  - `app/box-shipping-calculator/BoxCalculations.ts`
  - `app/table-enclosure-calculator/calcUtils.ts`, `constants.ts`
  - `types/mongodb/*`, `types/box-shipping-calculator/*`
- Identified frontend/interface files for removal:
  - All `.tsx` files in `sample code/app/` subfolders (except pure calculation logic)
  - All files in `sample code/components/` and `sample code/contexts/`
  - All `page.tsx` files and UI components
- Next: Begin migration of backend logic to `src/` and remove frontend/interface files.

## [2025-06-08] Backend Migration (in progress)

- Migrating backend logic from `sample code` to `src/`:
  - DataService
  - Calculation utilities
  - Business logic (actions)
- Removing frontend/interface files from `sample code` (in progress)
- Documentation and type updates (in progress)

## [2025-06-08] Calculation Utilities & Types Migration (in progress)

- Migrating calculation utilities from `sample code/app/table-enclosure-calculator/` to `src/services/`
- Migrating box shipping types from `sample code/types/box-shipping-calculator/` to `src/types/`

## [2025-06-08] Migrated `table-enclosure-calc.ts`

- Migrated all functions from `sample code/app/table-enclosure-calculator/calcUtils.ts` to `src/services/table-enclosure-calc.ts`.
- Updated import paths to use `./table-enclosure-constants`.
- Added explicit types for `doorPanels` and `panels` arrays to resolve TypeScript errors.
- Added default fallbacks for `EXTRUSION_OPTIONS.find()` calls to prevent potential runtime errors if an extrusion profile is not found, ensuring `extrusion2020` and `extrusion2040` are always defined.
- Renamed exported constants from original file to `CALCULATION_CONSTANTS` to avoid potential naming conflicts.

## [2025-06-08] Standardized File Header Comments

- Added consistent top-level JSDoc-style comments to all TypeScript files in the `src/` directory.
- Ensured comments include 'Updated', 'Author', and 'Description' fields, matching the user's preferred style.

## [2025-06-09] DataProvider and MongoDB Connection Logic Migration

- Migrated `DataProvider` interface to `src/data/DataProvider.ts`.
- Migrated MongoDB connection logic to `src/data/mongodb.ts` and created a sample `.env` file.

## [2025-06-09] Project Renaming and Continued Migration

- Renamed project from "cnc-technical-ai" to "technical-ai".
  - Updated `package.json` (name, description, repository URL).
  - Updated `README.md` (title, overview).
  - Updated filepath comment in `src/utils/logger.ts`.
- Continued migration of `DataProvider` interface and MongoDB connection logic.

## [2025-06-08] AI Chat Endpoint Implementation

- Migrated `sample code/app/actions/chat.ts` and `sample code/utils/chatStream.ts` to `src/services/aiService.ts` and `src/utils/chatStream.ts` respectively.
- Installed `endent` package.
- Created `ChatBody` interface in `src/types/chat.ts`.
- Implemented the `POST /api/ai/chat` endpoint in `src/routes/ai.ts`.
  - Added Swagger JSDoc comments for the endpoint.
  - Ensured proper handling of WHATWG ReadableStream for streaming responses.

## [2025-06-09] Express Server Start Logic (completed)

- Confirmed that the app now starts the Express server and listens on the correct port for both local and deployment environments.
- Updated `README.md` and `codingconventions.md` with port binding info.
- Ran `yarn build` and `yarn test` successfully after the change.
- This resolves the Render deployment issue: the app will now keep a port open as required.

## [2025-06-09] Backend Basics: Error Handling, 404s, and Health Check (in progress)

- Added centralized error handling middleware to `src/app.ts` with detailed comments.
- Added 404 handler for unknown API routes in `src/app.ts`.
- Implemented `/api/health` endpoint for deployment and monitoring.
- Updated `README.md` with documentation for health check and error handling.
- Updated `codingconventions.md` to include error handling, 404, and health check conventions.
- These changes improve reliability, maintainability, and deployment readiness.

## [2025-06-09] Project Overview & Documentation Update (in progress)

- Expanded README.md with a detailed overview, design philosophy, features, usage, and contributing sections.
- Clarified the backend's purpose as a universal, abstract API for all current and future web apps.
- Added extensibility and abstraction guidelines to codingconventions.md.
- All changes are in progress and will be marked as completed after review and testing.

## [2025-06-09] Frontend Integration Guide (in progress)

- Added a Frontend Integration Guide to README.md, covering:
  - API base URL and environment variable setup
  - Authentication flow with Netlify Identity
  - Example API requests from the frontend
  - Health check and error handling patterns
- This helps frontend developers migrate from server actions to using the backend API directly.

## [2025-06-09] Auth0 Migration Steps (in progress)

- Updated .env to add AUTH0_DOMAIN, AUTH0_AUDIENCE, and AUTH0_ISSUER for Auth0 JWT verification (in progress)
- Installed jose for JWT verification (in progress)
- Replaced Netlify Identity JWT middleware with Auth0-compatible middleware in requireAuth.ts (in progress)
- User must fill in Auth0 values from Netlify UI/Auth0 dashboard

## [2025-06-09] Clerk Migration Steps (in progress)

- Migrating backend authentication to Clerk (in progress)
- Added middleware/clerkAuth.ts for Clerk JWT verification (in progress)
- Updated app.ts to use Clerk middleware and parse ALLOWED_ORIGINS for CORS (in progress)
- Updated .env to document Clerk keys and mark old auth variables for removal (in progress)
- Migrated authentication to Clerk: added Clerk keys to .env, implemented middleware/clerkAuth.ts, and updated app.ts to use requireAuth for protected routes (in progress)
- Updated .env comments to clarify Clerk usage and note removal of old keys (in progress)
