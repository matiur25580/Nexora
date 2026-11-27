# Architecture

## Current foundation
Nexora starts as a modular monolith to keep local development and deployment approachable while maintaining clear domain boundaries. Each domain will own its routes, application services, persistence models, validation schemas, and tests as the product grows.

## Runtime components
- **Web application:** React + TypeScript + Vite. It consumes versioned HTTP APIs and later receives Socket.IO updates where useful.
- **API:** Express + TypeScript. Middleware handles security headers, CORS, JSON parsing, request logging, routing, and centralized errors.
- **Persistence:** MongoDB through Mongoose. Domain models and indexes will be introduced with their owning milestones.
- **Asynchronous work:** Redis/BullMQ is planned for scheduled jobs and durable workflows; it is not enabled in this foundation.
- **Integrations:** External systems will connect through explicit adapters and validated webhook boundaries.

## API conventions
- Base path: `/api/v1`
- Success envelope: `{ "data": ... }`
- Error envelope: `{ "error": { "code": "...", "message": "..." } }`
- Health endpoint: `GET /api/v1/health`

## Security principles
1. Authentication is required before organization-scoped resources are introduced.
2. Tenant context will be resolved from the authenticated principal and verified membership.
3. Every tenant-owned query and write must be scoped server-side.
4. Authorization is deny-by-default and enforced in service/API boundaries.
5. Sensitive operations produce append-only audit records.
6. Secrets and credentials are never committed or logged.

## Reliability principles
- Graceful shutdown closes the HTTP server and MongoDB connection.
- Health responses expose process and dependency state.
- Background jobs will use idempotency keys, bounded retries, and observable failure states.
- External webhook delivery will be authenticated, rate-limited, and replay-resistant.
