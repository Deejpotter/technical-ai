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
