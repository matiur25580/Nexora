# Nexora

**Enterprise Customer Success & Revenue Intelligence Platform**

Nexora is a multi-tenant SaaS platform for customer lifecycle management, customer health intelligence, product adoption, retention workflows, and revenue operations.

> Status: Milestone 2 — Enterprise Authentication & Session Lifecycle (in progress)

## Product direction

Nexora brings customer accounts, subscriptions, product usage, support activity, feedback, renewal signals, and customer-success workflows into one operational workspace. Its design priorities are explainability, tenant isolation, auditability, and measurable business outcomes.

## Current capabilities

- TypeScript monorepo with React/Vite web application and Express/Mongoose API
- Environment validation, structured request logging, centralized errors, Docker and CI
- User registration and login with scrypt password hashing
- Short-lived signed access tokens and rotating opaque refresh sessions
- HttpOnly refresh-token cookie, server-side token digests, session revocation and expiry
- Protected current-user endpoint and rate-limited authentication entry points

## Planned capabilities

- Organization workspaces, membership, and granular permission policies
- Customer 360 profiles and lifecycle timelines
- Explainable customer health scoring and retention signals
- Product usage event ingestion and adoption analytics
- Onboarding, support/SLA, renewal, and feedback workflows
- Configurable automation and human-reviewed AI assistance
- Executive revenue and retention intelligence
- Integrations, webhooks, notifications, and audit history

## Architecture

The implementation is a TypeScript modular monolith:

- `apps/api`: Node.js, Express, Mongoose, Zod, structured logging
- `apps/web`: React, Vite, TypeScript, responsive application shell
- MongoDB: operational persistence
- Docker Compose: local development services
- GitHub Actions: continuous integration

Domain modules will be introduced incrementally. Nexora intentionally avoids premature microservices and unverified AI/predictive claims.

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md), [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), and [docs/ROADMAP.md](./docs/ROADMAP.md).

## Delivered capabilities

- Secure account registration and login with password hashing, short-lived access tokens and rotating refresh sessions.
- Organization creation and switching, active membership verification, role-based member administration and organization audit events (M3 branch).

See [docs/ORGANIZATIONS.md](docs/ORGANIZATIONS.md) for the tenant and role security model.

## Security

Never commit secrets. Copy `.env.example` to `.env` and generate a unique signing secret (for example, `openssl rand -base64 48`) for `ACCESS_TOKEN_SECRET`; the API refuses to start without an explicit value. Docker Compose also requires it. In production, use a separately generated high-entropy secret and enable secure cookies behind HTTPS. Tenant context must be derived from authenticated membership and enforced server-side; client-supplied organization identifiers are never authorization evidence.

## License

To be selected before public distribution.
