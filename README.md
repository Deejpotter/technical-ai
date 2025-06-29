# Technical AI Project

## Overview

This project serves as a central repository for AI-related technical documentation, experiments, and shared utilities. It aims to support various AI initiatives by providing a common ground for resources and best practices.

## Key Areas

* **Documentation:** Standards, guidelines, and architectural overviews.
* **Experiments:** Proof-of-concept implementations and research findings.
* **Utilities:** Shared scripts, tools, and configurations.

## Technologies & Conventions

* **Primary Language:** Python for AI/ML tasks, TypeScript for any web-related utilities.
* **Documentation Format:** Markdown for all documentation files.
* **Version Control:** Git, following conventional branching models (e.g., GitFlow or similar).
* **Linting/Formatting:** Prettier for Markdown and TypeScript, Black/Flake8 for Python (or as per specific sub-project needs).

## Project Structure

    ├── README.md            # Project overview and documentation
    ├── codeupdates.md       # Changelog and updates
    ├── codingconventions.md # Coding standards and best practices
    ├── docs/                # Additional documentation (if any)
    ├── experiments/         # AI experiments and proof-of-concepts
    ├── scripts/            # Utility scripts
    ├── src/                # Source code for any web-related utilities
    │   ├── routes/          # API route handlers
    │   ├── middleware/      # Custom middleware
    │   ├── services/        # Business logic and services
    │   └── utils/          # Utility functions and helpers
    └── tests/              # Automated tests

## API Endpoints

### Health Check

* `GET /api/health`: Returns HTTP 200 and a simple JSON payload. Used for deployment health checks.

### User Management (Master Admin Only)

The following endpoints are used for managing user roles and require Master Admin privileges. Access is controlled by the `requireMasterAdmin` middleware, which verifies the user's ID against the `MASTER_ADMIN_USER_ID` environment variable and checks for `publicMetadata.isMaster === true`.

* **`GET /api/users/list-users`**
  * **Description**: Retrieves a list of all users from Clerk.
  * **Protection**: Master Admin.
  * **Response**: JSON array of user objects.

* **`POST /api/users/update-user-role`**
  * **Description**: Updates the `publicMetadata.isAdmin` status for a specified user.
  * **Protection**: Master Admin.
  * **Request Body**:

    ```json
    {
      "userIdToUpdate": "user_xxxxxxxxxxxx",
      "isAdmin": true
    }
    ```

  * **Response**: Success message or error details.

### Shipping Item Management (Protected)

The following endpoints manage shipping items for the Box Shipping Calculator:

* **`GET /api/shipping/items`**
  * **Description**: Retrieves all shipping items from the database.
  * **Protection**: Clerk authentication required.
  * **Response**: JSON array of shipping item objects.

* **`POST /api/shipping/items`**
  * **Description**: Creates a new shipping item.
  * **Protection**: Clerk authentication required.
  * **Request Body**: JSON object with shipping item data (name, sku, length, width, height, weight).
  * **Response**: Created shipping item object.

* **`PUT /api/shipping/items/:id`**
  * **Description**: Updates an existing shipping item by ID.
  * **Protection**: Clerk authentication required.
  * **Request Body**: JSON object with updated shipping item data.
  * **Response**: Updated shipping item object.

* **`DELETE /api/shipping/items/:id`**
  * **Description**: Deletes a shipping item by ID.
  * **Protection**: Clerk authentication required.
  * **Response**: Success confirmation.

### Invoice Processing (Protected)

* The PDF invoice processing endpoint is `/api/invoice/process-pdf` and is protected by Clerk authentication.
* Frontend must send the file as `invoiceFile` in the FormData.

## ShippingItem Model (Updated January 2025)

* The `ShippingItem` type is now global (not user-specific) and only includes:
  * `_id`, `name`, `sku`, `length`, `width`, `height`, `weight` (all required)
* Do not add userId, notes, category, imageUrl, or quantity fields to `ShippingItem`.
* All service and route logic must use only these fields for shipping items.
* Add or update comments in code to clarify the global, simplified model.
* **CRUD Operations**: Full Create, Read, Update, Delete operations are supported via the shipping endpoints.
* **Frontend Integration**: The frontend performs optimistic UI updates with backend synchronization for immediate user feedback.

## Clerk Authentication & Admin Roles

* All authentication is handled by Clerk using @clerk/express. Endpoints requiring authentication use the requireAuth() middleware from src/middleware/clerkAuth.ts.
* requireAuth() must be called as a function when used as Express middleware.
* Admin and Master Admin roles are determined by Clerk `publicMetadata`:
  * `isAdmin: true` for admin access.
  * `isMaster: true` (and userId matches `MASTER_ADMIN_USER_ID` in `.env`) for master admin access.
* Only the Master Admin can manage user roles via the user management endpoints.
* Never include sensitive config data (like Clerk API keys) in documentation or code comments.
* See `codingconventions.md` for more details on role-based access and environment variable setup.

## User Management API & Admin Roles

The backend provides endpoints for user management, protected by a two-tiered admin system using Clerk metadata and environment variables.

### Endpoints

* `GET /api/users/list-users`: List all users. Requires Master Admin privileges.
* `POST /api/users/update-user-role`: Update a user's `publicMetadata.isAdmin` status. Requires Master Admin privileges.

### Admin Role Logic

* **Admin**: Any user with `publicMetadata.isAdmin: true` in Clerk.
* **Master Admin**: User with `publicMetadata.isMaster: true` and a userId matching `MASTER_ADMIN_USER_ID` in `.env`.
* Only the Master Admin can manage user roles via these endpoints.

### Configuration & Troubleshooting

* Set `CLERK_SECRET_KEY` and `MASTER_ADMIN_USER_ID` in your `.env` file.
* Set user roles in Clerk dashboard publicMetadata:
  * Master Admin: `{ "isAdmin": true, "isMaster": true }`
  * Admin: `{ "isAdmin": true }`
* If admin endpoints do not work, check:
  * The backend is running and accessible.
  * The logged-in user has the correct Clerk metadata and userId.
  * Environment variables are set correctly.

### Environment Variables

Ensure the following environment variables are set in your `.env` file:

* `CLERK_SECRET_KEY`: Your Clerk secret key for backend authentication and API calls. This is crucial for verifying JWTs and interacting with the Clerk API.
* `MASTER_ADMIN_USER_ID`: The Clerk User ID of the designated Master Admin. This user will have special privileges, such as managing other users' admin roles.
* `PORT`: The port on which the server will run (e.g., `5000`).
* `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS (e.g., `http://localhost:3000,https://your-frontend-domain.com`).

## Logging & Debugging

* All API requests, responses, and errors are now logged to the backend console.
* Logs include method, path, request body, userId (if available), and error details.
* Use the backend console output to debug issues and verify API activity.
* If you see errors in the frontend but not in the backend console, check that the backend is running and logging is not suppressed.
* See `codingconventions.md` for more details on logging conventions.

## Getting Started

1. **Clone the repo:** `git clone <repo-url>`
2. **Install dependencies:** `yarn install` (for TypeScript) or `pip install -r requirements.txt` (for Python)
3. **Run tests:** `yarn test` (TypeScript) or `pytest` (Python)
4. **Build the project:** `yarn build` (TypeScript) or follow Python-specific build steps
5. **Start development server:** `yarn dev` (TypeScript) or use a Python server (e.g., Flask, Django)

## Contributing

* Follow the conventions in `codingconventions.md`.
* Update `README.md`, `codingconventions.md`, and `codeupdates.md` with every significant change.
* Prefer updating and improving files over creating new ones.

## See Also

* [`codingconventions.md`](./codingconventions.md) — Coding standards and best practices
* [`codeupdates.md`](./codeupdates.md) — Change log and in-progress work

---

*This project is designed to be a comprehensive resource for AI technical needs, ensuring consistency, quality, and efficiency across various AI initiatives.*

## Invoice Processing Workflow (as of December 2024)

The backend processes invoice files (PDF or TXT) using a modern OpenAI function calling approach:

1. **Text Extraction:** Extracts text from uploaded files (PDF/TXT).
2. **Personal Data Scrubbing:** Removes PII (emails, phone numbers, addresses) from extracted text.
3. **AI Function Calling:** Uses OpenAI function calling to extract structured item data with strict validation:
   * Item name and description
   * SKU/product code (never allows "N/A" or placeholder values)
   * Quantity from invoice
   * Estimated weight (fallback only)
4. **Database Integration:** For each extracted item:
   * Checks database for existing SKU first
   * Uses database data (dimensions, weight) when available
   * Falls back to AI dimension estimation only when needed
   * Automatically adds new items to database for future efficiency
5. **Type Safety:** All steps use TypeScript with comprehensive error handling.

**Key Features:**

* Function calling ensures structured, reliable data extraction
* SKU validation prevents placeholder values from entering the system
* Database-first approach minimizes AI usage and improves accuracy
* Preserves original invoice quantities throughout the pipeline
* Automatic database population for improved future performance

See `src/services/invoiceService.ts` for implementation details.

## OpenAI Function Calling Migration (December 2024)

The invoice processing system has been completely migrated from JSON mode to OpenAI function calling for improved reliability and structured data extraction.

### What Changed

**Before:** Used OpenAI JSON mode with prompt-based instructions for data formatting
**After:** Uses OpenAI function calling with strict schemas for guaranteed data structure

### Benefits

* **Reliability:** Function calling provides guaranteed structured output format
* **Validation:** Built-in validation of required fields and data types
* **Error Reduction:** Eliminates JSON parsing errors and malformed responses
* **Performance:** More efficient processing with fewer retry cycles
* **Data Quality:** Strict SKU validation prevents placeholder values

### Implementation

    // Function schema defines exact structure
    const extractItemsFunction = {
      name: "extract_invoice_items",
      description: "Extract all line items from an invoice with their details",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                sku: { type: "string" }, 
                quantity: { type: "number" },
                weight: { type: "number" }
              },
              required: ["name", "sku", "quantity", "weight"]
            }
          }
        }
      }
    };

### Legacy Code Removal

All deprecated functions have been removed to prevent confusion:

* ❌ `getOrCreateShippingItemsFromInvoice` (removed)
* ❌ `processInvoiceFileAndExtractItems` (removed)
* ✅ `processInvoiceFileModular` (current implementation)

The system now has a single, clear pathway for invoice processing using modern OpenAI function calling.

## Optimistic UI Updates & Frontend/Backend Sync (January 2025)

The application implements optimistic UI updates for better user experience:

### Pattern Overview

1. **Immediate UI Updates**: Changes are reflected in the UI immediately upon user action.
2. **Background Sync**: Backend API calls happen in the background to persist changes.
3. **Error Handling**: If backend calls fail, UI can be reverted or show error states.
4. **Consistency**: Frontend state management ensures UI stays in sync with backend data.

### Implementation Guidelines

* **State Management**: Parent components manage shared state and pass update callbacks to child components.
* **Callback Props**: Use `onItemUpdate`, `onItemDelete` patterns for immediate state updates.
* **Error Handling**: Always handle both success and failure cases for backend operations.
* **Loading States**: Provide visual feedback during operations when appropriate.

### SSR/Client Consistency

To avoid Next.js hydration errors:

* Use `isMounted` state to ensure consistent server-side and client-side rendering.
* Use predictable, deterministic IDs instead of time-based IDs for temporary items.
* Ensure initial state is the same on server and client.

### Best Practices

* Test both optimistic updates and actual backend sync.
* Implement proper error boundaries and fallback states.
* Document state flow and callback patterns in component comments.
* Use TypeScript for type safety in callback functions and state management.

## Testing Best Practices (January 2025)

### API Endpoint Testing

* Test all CRUD operations (GET, POST, PUT, DELETE) with proper authentication.
* Verify HTTP status codes and response formats for both success and error cases.
* Use mock authentication tokens for consistent testing.
* Test edge cases like invalid IDs, malformed request bodies, and missing authentication.

### Integration Testing

* Test frontend-backend integration with actual API calls during development.
* Use PowerShell or curl commands to verify endpoint functionality independently.
* Test optimistic UI updates by simulating both successful and failed backend operations.

### Error Handling Testing

* Verify that proper error messages and status codes are returned.
* Test that failed operations don't corrupt application state.
* Ensure proper logging of errors with sufficient context for debugging.

### Example PowerShell API Testing

    # Test GET endpoint
    Invoke-RestMethod -Uri "http://localhost:5000/api/shipping/items" -Method GET -Headers @{Authorization="Bearer $jwt"}

    # Test POST endpoint
    $body = @{name="Test Item"; sku="TEST001"; length=10; width=5; height=3; weight=2} | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:5000/api/shipping/items" -Method POST -Headers @{Authorization="Bearer $jwt"; "Content-Type"="application/json"} -Body $body
