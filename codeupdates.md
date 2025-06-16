# Code Updates Log

## (in progress) - June 12, 2025 (ShippingItem Simplification & Type Consistency)

- **Goal:** Simplify the `ShippingItem` logic in the `technical-ai` backend so that shipping items are global (not user-specific), and ensure the codebase and type definitions reflect this.
- **Completed:**
  - Reverted `ShippingItem` type to only include: `_id`, `name`, `sku`, `length`, `width`, `height`, `weight` (all required, no userId, notes, category, imageUrl, or quantity).
  - Audited and updated all service and route logic to remove user-specific and extra fields.
  - Fixed all TypeScript and runtime errors related to the new type.
  - Updated code comments to clarify the new, global logic.
- **Next Steps:**
  - Update all documentation (`README.md`, `codingconventions.md`) to reflect Clerk authentication, admin/master admin logic, and the new global ShippingItem model.
  - Run `yarn build` and `yarn test` to verify the app works and all tests pass.
  - Mark this entry as (completed) once all documentation and tests are up to date.

## (in progress) - June 11, 2025 (PDF Invoice Processing - Backend API)

- Objective: Create an API endpoint to receive PDF files from `cnc-tools` frontend, extract text, process with AI (OpenAI) to identify invoice items, and return structured data.
- This will serve as the primary backend for PDF processing to ensure reliability and avoid frontend/Next.js timeouts.
- Dependencies: `multer` for file uploads, `pdf-parse` for text extraction.
- Endpoint: Likely `POST /api/invoice/process-pdf`, protected by `requireAuth`.
- Service: Updates to `src/services/invoiceService.ts` to handle PDF buffer and integrate `pdf-parse`.
- Mounted protected invoiceRoutes at /api/invoice (PDF processing endpoint is now /api/invoice/process-pdf, Clerk-protected)
- Updated frontend PdfImport.backend.tsx to use /api/invoice/process-pdf and send file as 'invoiceFile'

## (paused) - June 11, 2025 (Box Shipping Calculator Implementation)

- This task is currently paused to prioritize the PDF Invoice Processing feature.
- Created `technical-ai/src/tests/BoxCalculations.test.ts` with initial unit tests for the `packItemsIntoMultipleBoxes` function.
- Next steps (when resumed): Implement the frontend UI for item input and results display in `cnc-tools/app/box-shipping-calculator/page.tsx`.

## (completed) - June 10, 2025 (User Management API & Master Admin Role)

- Created API endpoints for user management under `/api/users`:
  - `GET /api/users/list-users`: Lists all users. Requires Master Admin privileges.
  - `POST /api/users/update-user-role`: Updates a user's `publicMetadata.isAdmin` status. Requires Master Admin privileges.
- Implemented `src/middleware/requireMasterAdmin.ts` to protect routes that require master admin privileges. This middleware checks:
  - If the user is authenticated.
  - If `auth.sessionClaims.publicMetadata.isMaster` is `true`.
  - If `auth.userId` matches the `MASTER_ADMIN_USER_ID` environment variable.
- Updated `src/types/express.d.ts` to include `publicMetadata` in the `AuthenticatedRequest` type.
- Mounted user routes in `src/app.ts` under `/api/users`, protected by `requireAuth` (general authentication) and further by `requireMasterAdmin` at the route level.
- `.env` must include `MASTER_ADMIN_USER_ID` and `CLERK_SECRET_KEY`.
- Clerk metadata (`isAdmin`, `isMaster`) must be set in the Clerk dashboard for correct access control.

## (completed) - June 12, 2025 (Clerk Backend Migration)

- Migrated all backend authentication from deprecated @clerk/clerk-sdk-node and @clerk/backend to @clerk/express.
- Updated all imports and middleware to use requireAuth(), getAuth, and clerkClient from @clerk/express.
- Fixed all Express handler typing issues and ensured robust async error handling with wrapAsync.
- Updated requireAuth usage to requireAuth() (middleware factory) in app.ts and all routes.
- Updated src/types/express.d.ts to use AuthObject from @clerk/express.
- All build and type checks pass. All authentication and user management endpoints work as expected.
- Some BoxCalculations.test.ts tests still fail (business logic, not related to Clerk migration).
- Updated README.md and codingconventions.md to document Clerk backend usage and conventions.

## (completed) - June 12, 2025 (Logging Middleware & TypeScript Fix)

- Fixed TypeScript error for custom Express.Request property _requestTime by extending the type in app.ts.
- Logging middleware now works and build passes.
- All API requests, errors, and 404s are logged with timestamps and details.
- yarn test: BoxCalculations.test.ts still has 7 failing tests (business logic, not logging or build related).

## (in progress) - June 12, 2025 (BoxCalculations Logic)

- Investigating and debugging failing tests in BoxCalculations.test.ts. These are not related to logging or authentication.

---

## (completed) - June 9, 2025 (Component Library Deletion)

- Removed all references to the (now deleted) `@deejpotter/component-library`.
- The component library was deprecated and has been removed from the workspace.

---

## (completed) - June 9, 2025 (Clerk.dev Migration)

- Migrating backend authentication to Clerk (in progress)
- Added middleware/clerkAuth.ts for Clerk JWT verification (in progress)
- Updated app.ts to use Clerk middleware and parse ALLOWED_ORIGINS for CORS (in progress)
- Updated .env to document Clerk keys and mark old auth variables for removal (in progress)
- Migrated authentication to Clerk: added Clerk keys to .env, implemented middleware/clerkAuth.ts, and updated app.ts to use requireAuth for protected routes (in progress)
- Updated .env comments to clarify Clerk usage and note removal of old keys (in progress)
