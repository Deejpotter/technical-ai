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
