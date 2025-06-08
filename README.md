# CNC Technical AI Backend

## Overview

This project is a centralized Express.js backend API for CNC-related AI and business logic, designed to serve multiple frontend applications. It uses TypeScript, OpenAI/Anthropic APIs, and Netlify Identity for authentication.

## Architecture & Implementation Plan

### Backend Structure

- Centralized Express API
- JWT authentication via Netlify Identity
- RESTful endpoints: `/api/ai/chat`, `/api/cnc/estimate`, etc.
- Organized by feature: `routes/`, `services/`, `middleware/`, `data/`, `types/`

### Authentication Flow

- Netlify Identity JWT verification middleware
- No user data storage required

### AI Integration

- OpenAI and Anthropic APIs for chat, Q&A, and reasoning
- Future: LangChain.js agents for advanced workflows

### Implementation Steps

1. Set up Express backend with auth middleware
2. Migrate backend logic from `sample code` to Express
3. Remove frontend/interface files from backend folders
4. Update and maintain documentation (`README.md`, `codingconventions.md`, `codeupdates.md`)

## Testing

- Use `yarn test` to run Jest tests and verify backend functionality
- Use `yarn build` to compile TypeScript and check for build errors

## Conventions

See `codingconventions.md` for detailed coding standards.

## Change Log

See `codeupdates.md` for a history of codebase changes.
