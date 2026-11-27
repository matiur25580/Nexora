# Nexora

**Enterprise Customer Success & Revenue Intelligence Platform**

Nexora is a multi-tenant SaaS platform for customer lifecycle management, customer health intelligence, product adoption, retention workflows, and revenue operations.

> Status: Milestone 1 — Enterprise Foundation (in progress)

## Product direction

Nexora brings customer accounts, subscriptions, product usage, support activity, feedback, renewal signals, and customer-success workflows into one operational workspace. Its design priorities are explainability, tenant isolation, auditability, and measurable business outcomes.

## Planned capabilities

- Organization workspaces, identity, membership, and permission policies
- Customer 360 profiles and lifecycle timelines
- Explainable customer health scoring and retention signals
- Product usage event ingestion and adoption analytics
- Onboarding, support/SLA, renewal, and feedback workflows
- Configurable automation and human-reviewed AI assistance
- Executive revenue and retention intelligence
- Integrations, webhooks, notifications, and audit history

## Architecture

The initial implementation is a TypeScript modular monolith:

- `apps/api`: Node.js, Express, Mongoose, Zod, structured logging
- `apps/web`: React, Vite, TypeScript, responsive application shell
- MongoDB: operational persistence
- Docker Compose: local development services
- GitHub Actions: continuous integration

Domain modules will be introduced incrementally. The initial foundation intentionally avoids premature microservices and unverified AI/predictive claims.

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md), [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), and [docs/ROADMAP.md](./docs/ROADMAP.md).

## Security

Never commit secrets. Copy `.env.example` to `.env` for local development. Tenant context must ultimately be derived from authenticated membership and enforced server-side; client-supplied organization identifiers are never authorization evidence.

## License

To be selected before public distribution.
