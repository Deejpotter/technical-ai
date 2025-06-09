# Code Updates Log

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
