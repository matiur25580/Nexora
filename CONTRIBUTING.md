# Contributing to Nexora

## Prerequisites
- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop (recommended for local MongoDB)

## Local setup
1. Clone the repository.
2. Copy `.env.example` to `.env` and review the values.
3. Install dependencies with `npm install`.
4. Start MongoDB locally or run `docker compose up mongodb -d`.
5. Start both applications with `npm run dev`.

The API is available at `http://localhost:4000/api/v1`; health endpoint: `/api/v1/health`. The web app is available at `http://localhost:5173`.

## Quality checks
Run `npm run typecheck`, `npm test`, `npm run build`, `npm run lint`, and `npm run format:check` before opening a pull request.

## Engineering conventions
- Keep business logic in domain/application modules, not route handlers.
- Validate external input at system boundaries.
- Never trust tenant or role identifiers supplied by the browser.
- Do not log credentials, tokens, or sensitive customer content.
- Add tests for authorization, tenant isolation, failure cases, and business invariants.
- Document API contracts and operational configuration changes.
- Prefer small, reviewable pull requests with explicit acceptance criteria.
