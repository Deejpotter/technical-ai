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

### Invoice Processing (Protected)

* The PDF invoice processing endpoint is `/api/invoice/process-pdf` and is protected by Clerk authentication.
* Frontend must send the file as `invoiceFile` in the FormData.

## ShippingItem Model (2025-06-12)

* The `ShippingItem` type is now global (not user-specific) and only includes:
  * `_id`, `name`, `sku`, `length`, `width`, `height`, `weight` (all required)
* Do not add userId, notes, category, imageUrl, or quantity fields to `ShippingItem`.
* All service and route logic must use only these fields for shipping items.
* Add or update comments in code to clarify the global, simplified model.

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
