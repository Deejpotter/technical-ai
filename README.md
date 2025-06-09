# Technical AI Backend

## Overview

This app handles the backend code for all my web apps. It is designed to be abstract and extensible, so any current or future frontend can communicate with the backend and use its endpoints. The backend exposes a set of RESTful APIs for business logic, AI features, and calculations, and is structured to make adding new endpoints and features straightforward.

- **Universal API:** All frontend apps (current and future) interact with this backend via HTTP endpoints. The backend is not tied to any specific frontend framework or UI.
- **Extensible Design:** New endpoints and features can be added easily as new business needs arise, without breaking existing functionality.
- **Authentication:** Uses Clerk for secure authentication. The backend verifies Clerk JWTs for protected routes, allowing only authorized users to access sensitive endpoints. See `.env` for Clerk keys.
- **Testing & Reliability:** The project uses Jest for automated testing. If all tests pass with `yarn test`, the app can be trusted to work as expected. `yarn build` is used to check for TypeScript and build errors.
- **Deployment Ready:** Listens on the port specified by the `PORT` environment variable for compatibility with cloud platforms (e.g., Render, Heroku, Netlify Functions).

## Design Philosophy

- **Abstract:** The backend is not coupled to any one frontend or business case. All logic is exposed via clear, documented API endpoints.
- **Maintainable:** Code is modular, with routes, middleware, and services separated by feature. Comments explain the purpose of each part of the code.
- **Documented:** All changes are tracked in `codeupdates.md`. Coding standards are in `codingconventions.md`.

## Key Features

- **AI Endpoints:** Integrates with OpenAI and Anthropic APIs for chat, Q&A, and reasoning.
- **Business Logic:** Handles calculations, data processing, and other backend logic for multiple apps.
- **Health Checks:** `/api/health` endpoint for deployment and uptime monitoring.
- **Error Handling:** Centralized error handler returns consistent JSON errors and never exposes sensitive details.

## How to Use

- **Run tests:** `yarn test` (trust the app if all tests pass)
- **Build:** `yarn build` (check for TypeScript/build errors)
- **Add new endpoints:** Create a new route file in `src/routes/` and register it in `app.ts`.
- **Authentication:** Protect routes by adding the `requireAuth` middleware.

## Frontend Integration Guide

### API Base URL

For local development, set your frontend to use the backend API at:

    http://localhost:5000

(Replace 5000 with your backend port if different.)

Example environment variable:

    REACT_APP_API_URL=http://localhost:5000
    # or for Next.js:
    NEXT_PUBLIC_API_URL=http://localhost:5000

### Authentication (Clerk)

- The backend uses Clerk for authentication. All protected routes require a valid Clerk JWT, which is verified using the backend's Clerk secret key.
- Frontend apps must use Clerk for login/signup and send the JWT in the Authorization header for protected API calls.
- CORS is configured using the ALLOWED_ORIGINS environment variable, which should include all frontend app URLs.
- See `src/middleware/clerkAuth.ts` for the authentication middleware implementation.

### Making API Requests

Example (with fetch):

    // Get JWT from Clerk
    const token = clerk.currentUser()?.getIdToken();

    // Call a protected endpoint
    fetch(`${process.env.REACT_APP_API_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ inputCode: "Hello", model: "gpt-3.5-turbo" }),
    })
      .then(res => res.json())
      .then(data => {
        // handle response
      });

See backend route files for required fields (e.g., inputCode, model for /api/ai/chat).
All responses are JSON, with errors returned as { error, message }.

### Health Check

GET /api/health returns:

    { "status": "ok", "message": "API is healthy" }

### Error Handling

All errors are returned as JSON with an error and message field.

Example:

    { "error": "Unauthorized", "message": "Missing or invalid Authorization header." }

## Contributing/Extending

- Follow the conventions in `codingconventions.md`.
- Update `README.md`, `codingconventions.md`, and `codeupdates.md` with every significant change.
- Prefer updating and improving files over creating new ones.

## See Also

- [`codingconventions.md`](./codingconventions.md) — Coding standards and best practices
- [`codeupdates.md`](./codeupdates.md) — Change log and in-progress work

---

*This backend is designed to be the single source of truth for all business and AI logic, making it easy to maintain, extend, and trust as your app ecosystem grows.*
