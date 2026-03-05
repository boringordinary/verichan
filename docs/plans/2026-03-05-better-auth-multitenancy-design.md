# Better Auth Multi-Tenancy Design

## Overview

Add user authentication and multi-tenancy to verichan using Better Auth with the organization plugin. All access is invitation-only — no self-service signup.

## User Contexts

Two types of authenticated users:

- **Customer org users** — Log in via magic link to manage their org's verification sessions, API keys, and webhooks.
- **Internal reviewers** — Log in via magic link to a special "verichan" org, review verification submissions across all customer orgs.

## Auth Stack

- **Better Auth** — Core auth library with Drizzle adapter on existing PostgreSQL database
- **Magic link** — Passwordless email authentication (no passwords, no social login)
- **Organization plugin** — Multi-tenancy with roles and invitations
- **Resend** — Email delivery for magic links and invitations

## Roles & Permissions

### Customer Organizations

| Role    | Description                                                              |
|---------|--------------------------------------------------------------------------|
| Admin   | Full org control: settings, API keys, webhooks, members, billing         |
| Manager | Operational control: verification sessions, results, webhooks            |
| Viewer  | Read-only access to sessions and results                                 |

### Internal Verichan Organization

| Role     | Description                                      |
|----------|--------------------------------------------------|
| Admin    | Manage the reviewer team                         |
| Reviewer | Review verification submissions from all orgs    |

## Data Model

### New Tables (Better Auth managed)

- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `account` — id, userId, providerId, accountId
- `session` — id, userId, token, expiresAt, activeOrganizationId
- `verification` — id, identifier, value, expiresAt (magic link tokens)
- `organization` — id, name, slug, logo, metadata, createdAt
- `member` — id, userId, organizationId, role, createdAt
- `invitation` — id, email, inviterId, organizationId, role, status, expiresAt

### Schema Integration

- `api_key.organizationId` → foreign key to `organization.id`
- `webhook_endpoint.organizationId` → foreign key to `organization.id`
- `verification_session.organizationId` → foreign key to `organization.id`
- `review` table gets `reviewerId` column → foreign key to `user.id`

Existing tables and API key authentication for external consumers remain unchanged.

## Authentication Strategies

Two auth strategies coexist:

| Context           | Auth Method   | Used By                     |
|-------------------|---------------|-----------------------------|
| `/api/auth/*`     | Better Auth   | Handles auth endpoints      |
| `/api/v1/*`       | API key       | External API consumers      |
| `/dashboard/*`    | Session-based | Dashboard UI users          |
| `/review/*`       | Session-based | Internal reviewers          |

## Middleware & Authorization

### Session Middleware

Elysia derive plugin extracts user and active organization from session cookie.

### Guards

- `requireAuth()` — Validates active session exists
- `requireRole(roles)` — Validates user has one of the specified roles in their active org
- `requireReviewer()` — Validates user is a member of the verichan org

### Query Scoping

All org-scoped queries filter by `session.activeOrganizationId` to prevent cross-org data access.

## Frontend

### Auth Client

Shared Better Auth client instance in `apps/web` with `magicLink` and `organizationClient` plugins.

### Routes

```
/login                → Magic link request form
/auth/verify          → Magic link callback (auto-verifies, redirects)
/dashboard            → Org-scoped dashboard (sessions, API keys, webhooks)
/dashboard/settings   → Org settings, members, invitations
/review               → Reviewer interface (verification queue)
```

### Route Protection

- TanStack Router `beforeLoad` guards check session status
- No session → redirect to `/login`
- Session but no active org → redirect to org selector
- Wrong org type → redirect appropriately

### Key UI Flows

1. **Magic link login** — Enter email → "Check your email" → Click link → Redirect to dashboard or review UI
2. **Invitation acceptance** — Invite email → Click link → Magic link login → Auto-joined to org → Dashboard
3. **Org switcher** — Dropdown in header for users in multiple orgs
4. **Member management** (Admin only) — Invite by email, assign role, remove members

## Files to Create/Modify

### `apps/api/`

| File | Action | Purpose |
|------|--------|---------|
| `src/auth.ts` | Create | Better Auth server instance with Drizzle adapter, plugins, Resend |
| `src/index.ts` | Modify | Mount `/api/auth/*`, add session middleware |
| `src/middleware/session.ts` | Create | Elysia derive plugin for session extraction |
| `src/middleware/guards.ts` | Create | `requireAuth()`, `requireRole()`, `requireReviewer()` |
| `src/database/schema/auth.ts` | Create | Drizzle schema for Better Auth tables |
| `src/database/schema/client.ts` | Modify | Add FK to organization table |
| `src/database/schema/verification.ts` | Modify | Add FK to organization table |
| `src/database/schema/review.ts` | Modify | Add `reviewerId` FK to user table |

### `apps/web/`

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/auth-client.ts` | Create | Better Auth client instance |
| `src/routes/login.tsx` | Create | Magic link login page |
| `src/routes/auth/verify.tsx` | Create | Magic link callback handler |
| `src/routes/dashboard/` | Create | Protected dashboard routes |
| `src/routes/review/` | Create | Protected reviewer routes |
| `src/components/org-switcher.tsx` | Create | Organization selector |
| `src/components/member-manager.tsx` | Create | Invite/manage members UI |

## Migration Steps

1. Install `better-auth` and `resend`
2. Configure Better Auth with Drizzle adapter
3. Generate and run DB migration for auth tables
4. Update existing `organizationId` columns to reference `organization` table
5. Seed the internal "verichan" organization
6. Wire up API routes and middleware
7. Build frontend auth flows and route guards

## Explicitly Excluded (YAGNI)

- No 2FA
- No social login
- No self-service signup
- No teams within organizations
- No dynamic access control
- No custom fields on auth tables
