# Architecture

## Current foundation

Nexora starts as a modular monolith to keep local development and deployment approachable while maintaining clear domain boundaries. Each domain owns its routes, application services, persistence models, validation schemas, and tests.

## Runtime components

- **Web application:** React + TypeScript + Vite. It consumes versioned HTTP APIs and later receives Socket.IO updates where useful.
- **API:** Express + TypeScript. Middleware handles security headers, CORS, JSON parsing, request logging, routing, and centralized errors.
- **Persistence:** MongoDB through Mongoose. Domain models and indexes are introduced with their owning milestones.
- **Asynchronous work:** Redis/BullMQ is planned for scheduled jobs and durable workflows; it is not enabled yet.
- **Integrations:** External systems connect through explicit adapters and validated webhook boundaries.

## Authentication and session lifecycle (Milestone 2)

- Registration validates normalized email, display name, and password policy.
- Passwords are stored as salted scrypt hashes; plaintext passwords are never persisted.
- Access tokens are short-lived HS256 JWTs with issuer, audience, subject, and token-type validation.
- Refresh tokens are high-entropy opaque values delivered only in an HttpOnly cookie. MongoDB stores SHA-256 digests, never raw refresh tokens.
- Refresh attempts atomically revoke the presented session before issuing a replacement, preventing the same refresh token from being used twice.
- Logout revokes the presented refresh session. Expired session documents are removed by a MongoDB TTL index.
- Authentication endpoints are rate-limited. Production requires a unique access-token secret and secure cookies over HTTPS.
- Organization membership, tenant authorization, MFA, password reset, and device/session management UI remain future work.

## API conventions

- Base path: `/api/v1`
- Success envelope: `{ "data": ... }`
- Error envelope: `{ "error": { "code": "...", "message": "..." } }`
- Health endpoint: `GET /api/v1/health`

## Security principles

1. Authentication is required before organization-scoped resources are introduced.
2. Tenant context is resolved from the authenticated principal and verified membership.
3. Every tenant-owned query and write is scoped server-side.
4. Authorization is deny-by-default and enforced in service/API boundaries.
5. Sensitive operations produce append-only audit records.
6. Secrets and credentials are never committed or logged.

## Reliability principles

- Graceful shutdown closes the HTTP server and MongoDB connection.
- Health responses expose process and dependency state.
- Background jobs use idempotency keys, bounded retries, and observable failure states.
- External webhook delivery is authenticated, rate-limited, and replay-resistant.


## Organization tenancy (Milestone 3)

- A user may belong to multiple organizations through Membership records.
- Organization IDs in route paths are selectors only; the API checks the authenticated user's active membership before returning organization data.
- The server attaches a verified organization context only after checking both the membership and active organization record.
- Role permissions are resolved by a server-owned matrix. The client cannot submit a role or membership status as an authorization claim.
- Owner membership is protected from removal or role change. Ownership transfer is deferred until a dedicated two-party workflow exists.
- Member addition currently supports already-registered Nexora users; invitation delivery is not implemented.
- Membership removal is soft (status=removed), and a removed member can be reactivated after a new authorization check.
- Organization/member changes create organization-scoped audit events.
