# Organization workspaces and tenant access

## Organization lifecycle
- Any authenticated user can create an organization. The creator receives an active owner membership.
- Organization slugs are generated from the organization name and are globally unique.
- Users can belong to multiple organizations; the authenticated profile includes active organization memberships.
- An organization can be read only by users with active membership.

## Membership lifecycle
- Organization owners and admins can add already-registered users by email.
- Supported roles: owner, admin, csm_manager, csm, analyst and viewer.
- Only an owner can grant admin. No endpoint can grant or transfer owner.
- Owner membership cannot be removed or demoted in this milestone.
- Member removal is a soft status change. A removed member can be reactivated by an authorized owner/admin.
- Invitation email delivery, SSO, MFA, SCIM and ownership transfer are not included.

## Permission matrix

| Role | Organization settings | Member administration | Customer data (future M4+) | Dashboards |
|---|---|---|---|---|
| owner | Read/write | Read/write | Read/write | Read |
| admin | Read/write | Read/write, cannot grant admin | Read/write | Read |
| csm_manager | Read | Read/write, cannot grant admin | Read/write | Read |
| csm | Read | Read | Read/write | Read |
| analyst | Read | Read | Read | Read |
| viewer | Read | Read | No access | Read |

Customer permissions are defined centrally for upcoming customer modules; this milestone only exposes organization and member administration routes.

## Tenant enforcement
- All organization-specific routes require a valid access token.
- The API validates the organization ID, active Membership and active Organization record.
- A verified organization context is attached server-side.
- Route authorization uses the server-owned permission matrix.
- Cross-tenant requests return a non-disclosing 404 response.
- The UI sends the organization ID as a route selector only; it never supplies a trusted role.

## Audit
Organization creation, profile updates, membership creation/reactivation, role changes and removals write actor-attributed organization audit events. No audit mutation endpoint is exposed.

## Limitations
This is a portfolio implementation. It does not yet provide email invitations, ownership transfer, MFA, SSO, SCIM, account recovery, customer CRUD, customer integrations or a production security certification. Use synthetic data only.
