# Better Auth Multi-Tenancy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Better Auth with organization plugin and magic link authentication to the verichan platform.

**Architecture:** Better Auth mounts on the Elysia API server using `.mount()` + macro pattern. Organization plugin replaces the existing `client` table. Magic links via Resend for passwordless auth. Frontend uses `better-auth/react` with TanStack Router guards.

**Tech Stack:** better-auth, resend, drizzle-orm, elysia, react, @tanstack/react-router

**Design doc:** `docs/plans/2026-03-05-better-auth-multitenancy-design.md`

---

## Phase 1: Backend Auth Setup

### Task 1: Install API dependencies

**Files:**
- Modify: `apps/api/package.json`

**Step 1: Install better-auth and resend in the API package**

Run:
```bash
cd apps/api && bun add better-auth resend
```

**Step 2: Verify installation**

Run:
```bash
cd apps/api && bun pm ls | grep -E "better-auth|resend"
```
Expected: Both packages listed.

**Step 3: Commit**

```bash
git add apps/api/package.json bun.lock
git commit -m "feat: add better-auth and resend dependencies"
```

---

### Task 2: Create access control configuration

**Files:**
- Create: `apps/api/src/auth/permissions.ts`

**Step 1: Write the failing test**

Create: `apps/api/src/auth/permissions.test.ts`

```typescript
import { describe, test, expect } from "bun:test";
import { ac, admin, manager, viewer, reviewer } from "./permissions";

describe("access control", () => {
  test("admin has full org permissions", () => {
    expect(ac.hasPermission({ role: "admin", permissions: { organization: ["update"] } })).toBe(true);
    expect(ac.hasPermission({ role: "admin", permissions: { member: ["create", "update", "delete"] } })).toBe(true);
    expect(ac.hasPermission({ role: "admin", permissions: { invitation: ["create", "cancel"] } })).toBe(true);
  });

  test("manager has operational permissions but not member management", () => {
    expect(ac.hasPermission({ role: "manager", permissions: { verificationSession: ["read"] } })).toBe(true);
    expect(ac.hasPermission({ role: "manager", permissions: { webhook: ["create"] } })).toBe(true);
    expect(ac.hasPermission({ role: "manager", permissions: { member: ["create"] } })).toBe(false);
  });

  test("viewer has read-only permissions", () => {
    expect(ac.hasPermission({ role: "viewer", permissions: { verificationSession: ["read"] } })).toBe(true);
    expect(ac.hasPermission({ role: "viewer", permissions: { webhook: ["create"] } })).toBe(false);
  });

  test("reviewer has review permissions", () => {
    expect(ac.hasPermission({ role: "reviewer", permissions: { review: ["read", "decide"] } })).toBe(true);
    expect(ac.hasPermission({ role: "reviewer", permissions: { verificationSession: ["read"] } })).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && bun test src/auth/permissions.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create: `apps/api/src/auth/permissions.ts`

```typescript
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  verificationSession: ["read", "list"],
  apiKey: ["create", "read", "update", "delete"],
  webhook: ["create", "read", "update", "delete"],
  review: ["read", "decide"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  verificationSession: ["read", "list"],
  apiKey: ["create", "read", "update", "delete"],
  webhook: ["create", "read", "update", "delete"],
});

export const manager = ac.newRole({
  verificationSession: ["read", "list"],
  apiKey: ["read"],
  webhook: ["create", "read", "update", "delete"],
});

export const viewer = ac.newRole({
  verificationSession: ["read", "list"],
});

export const reviewer = ac.newRole({
  review: ["read", "decide"],
  verificationSession: ["read", "list"],
});
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && bun test src/auth/permissions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/auth/permissions.ts apps/api/src/auth/permissions.test.ts
git commit -m "feat: add access control roles and permissions"
```

---

### Task 3: Create Better Auth server configuration

**Files:**
- Create: `apps/api/src/auth/index.ts`

**Step 1: Create the auth server instance**

```typescript
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "../database";
import * as schema from "../database/schema";
import { ac, admin, manager, viewer, reviewer } from "./permissions";

const resend = new Resend(Bun.env.RESEND_API_KEY);

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: Bun.env.EMAIL_FROM || "noreply@verichan.com",
          to: email,
          subject: "Sign in to Verichan",
          html: `<p>Click <a href="${url}">here</a> to sign in to Verichan.</p><p>This link expires in 5 minutes.</p>`,
        });
      },
      disableSignUp: true,
    }),
    organization({
      ac,
      roles: { admin, manager, viewer, reviewer },
      allowUserToCreateOrganization: false,
      creatorRole: "admin",
      async sendInvitationEmail(data) {
        const inviteLink = `${Bun.env.WEB_URL || "http://localhost:5173"}/invite/${data.id}`;
        await resend.emails.send({
          from: Bun.env.EMAIL_FROM || "noreply@verichan.com",
          to: data.email,
          subject: `You've been invited to ${data.organization.name} on Verichan`,
          html: `<p>You've been invited to join <strong>${data.organization.name}</strong> as a <strong>${data.role}</strong>.</p><p>Click <a href="${inviteLink}">here</a> to accept the invitation.</p>`,
        });
      },
    }),
  ],
});

export type Auth = typeof auth;
```

**Step 2: Verify it compiles**

Run: `cd apps/api && bun build --no-bundle src/auth/index.ts --outdir /tmp/auth-check 2>&1 | head -5`
Expected: No type errors (may show warnings about missing env vars at runtime, that's fine).

**Step 3: Commit**

```bash
git add apps/api/src/auth/index.ts
git commit -m "feat: configure Better Auth with magic link and organization plugins"
```

---

### Task 4: Generate Better Auth database schema

**Files:**
- Create: `apps/api/src/database/schema/auth.ts`
- Modify: `apps/api/src/database/schema.ts`

**Step 1: Generate schema using Better Auth CLI**

Run:
```bash
cd apps/api && doppler run --no-fallback -- bunx auth@latest generate --output ./src/database/schema/auth.ts --config ./src/auth/index.ts --yes
```

This reads the auth config (with magic link + organization plugins) and generates a Drizzle-compatible schema file with all required tables: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`.

**Step 2: Review generated schema**

Run: `cat apps/api/src/database/schema/auth.ts`

Verify it contains tables: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`. If the CLI generates column names differently than expected, adjust manually.

**Step 3: Export auth schema from barrel file**

Modify `apps/api/src/database/schema.ts` — add this line before the relations export:

```typescript
export * from "./schema/auth";
```

The full file should be:
```typescript
export * from "./schema/enums";
export * from "./schema/auth";
export * from "./schema/client";
export * from "./schema/verification";
export * from "./schema/document";
export * from "./schema/review";
export * from "./schema/audit";
export * from "./schema/relations";
```

**Step 4: Commit**

```bash
git add apps/api/src/database/schema/auth.ts apps/api/src/database/schema.ts
git commit -m "feat: add Better Auth database schema"
```

---

### Task 5: Update existing schema — replace client with organization references

**Files:**
- Modify: `apps/api/src/database/schema/client.ts`
- Modify: `apps/api/src/database/schema/verification.ts`
- Modify: `apps/api/src/database/schema/review.ts`
- Modify: `apps/api/src/database/schema/relations.ts`

**Step 1: Update client.ts — replace client table, update FKs to organization**

The `client` table is replaced by Better Auth's `organization` table. Remove the `client` table. Update `apiKey` and `webhookEndpoint` to reference the `organization` table from `auth.ts`.

Replace `apps/api/src/database/schema/client.ts` with:

```typescript
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
    keyHash: text("key_hash").notNull(),
    label: varchar("label", { length: 255 }),
    environment: varchar("environment", { length: 10 }).notNull().default("live"),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_key_organization_id_idx").on(table.organizationId),
    uniqueIndex("api_key_key_hash_idx").on(table.keyHash),
  ],
);

export const webhookEndpoint = pgTable(
  "webhook_endpoint",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    url: text("url").notNull(),
    secretHash: text("secret_hash").notNull(),
    events: text("events").array(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("webhook_endpoint_organization_id_idx").on(table.organizationId),
  ],
);
```

Note: The `client` table and its `clientRelations` are removed. `apiKey.clientId` becomes `apiKey.organizationId`. `webhookEndpoint.clientId` becomes `webhookEndpoint.organizationId`.

**Step 2: Update verification.ts — add FK to organization**

In `apps/api/src/database/schema/verification.ts`, update the `organizationId` field to reference the organization table:

Add import at top:
```typescript
import { organization } from "./auth";
```

Change the `organizationId` field in `verificationSession` from:
```typescript
organizationId: text("organization_id").notNull(),
```
To:
```typescript
organizationId: text("organization_id")
  .notNull()
  .references(() => organization.id),
```

**Step 3: Update review.ts — add reviewerId FK to user**

In `apps/api/src/database/schema/review.ts`, update `reviewerId` to reference the user table:

Add import at top:
```typescript
import { user } from "./auth";
```

Change the `reviewerId` field in `review` from:
```typescript
reviewerId: text("reviewer_id"),
```
To:
```typescript
reviewerId: text("reviewer_id").references(() => user.id),
```

Also update `reviewNote.authorId` similarly:
```typescript
authorId: text("author_id").references(() => user.id),
```

**Step 4: Update relations.ts — replace client relations with organization**

Update `apps/api/src/database/schema/relations.ts`:

- Remove `client` import and `clientRelations`
- Import `organization`, `member`, `user` from `"./auth"`
- Update `apiKeyRelations` to reference `organization` instead of `client`
- Update `webhookEndpointRelations` to reference `organization` instead of `client`
- Add `organizationRelations` with apiKeys, webhookEndpoints, members, verificationSessions
- Add `userRelations` with reviews

Replace the full file with:

```typescript
import { relations } from "drizzle-orm";
import { organization, member, user } from "./auth";
import { apiKey, webhookEndpoint } from "./client";
import { verificationSession, verificationStep } from "./verification";
import { document, selfie } from "./document";
import { review, reviewNote } from "./review";
import { sessionStatusHistory, webhookDelivery } from "./audit";

// --- Auth relations ---

export const organizationRelations = relations(organization, ({ many }) => ({
  apiKeys: many(apiKey),
  webhookEndpoints: many(webhookEndpoint),
  members: many(member),
  verificationSessions: many(verificationSession),
}));

export const userRelations = relations(user, ({ many }) => ({
  reviews: many(review),
}));

// --- API Key / Webhook relations ---

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  organization: one(organization, {
    fields: [apiKey.organizationId],
    references: [organization.id],
  }),
}));

export const webhookEndpointRelations = relations(
  webhookEndpoint,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [webhookEndpoint.organizationId],
      references: [organization.id],
    }),
    deliveries: many(webhookDelivery),
  }),
);

// --- Verification relations ---

export const verificationSessionRelations = relations(
  verificationSession,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [verificationSession.organizationId],
      references: [organization.id],
    }),
    steps: many(verificationStep),
    reviews: many(review),
    statusHistory: many(sessionStatusHistory),
    webhookDeliveries: many(webhookDelivery),
  }),
);

export const verificationStepRelations = relations(
  verificationStep,
  ({ one, many }) => ({
    session: one(verificationSession, {
      fields: [verificationStep.sessionId],
      references: [verificationSession.id],
    }),
    documents: many(document),
    selfies: many(selfie),
    reviewNotes: many(reviewNote),
  }),
);

// --- Document relations ---

export const documentRelations = relations(document, ({ one }) => ({
  step: one(verificationStep, {
    fields: [document.stepId],
    references: [verificationStep.id],
  }),
}));

export const selfieRelations = relations(selfie, ({ one }) => ({
  step: one(verificationStep, {
    fields: [selfie.stepId],
    references: [verificationStep.id],
  }),
}));

// --- Review relations ---

export const reviewRelations = relations(review, ({ one, many }) => ({
  session: one(verificationSession, {
    fields: [review.sessionId],
    references: [verificationSession.id],
  }),
  reviewer: one(user, {
    fields: [review.reviewerId],
    references: [user.id],
  }),
  notes: many(reviewNote),
}));

export const reviewNoteRelations = relations(reviewNote, ({ one }) => ({
  review: one(review, {
    fields: [reviewNote.reviewId],
    references: [review.id],
  }),
  step: one(verificationStep, {
    fields: [reviewNote.stepId],
    references: [verificationStep.id],
  }),
  author: one(user, {
    fields: [reviewNote.authorId],
    references: [user.id],
  }),
}));

// --- Audit relations ---

export const sessionStatusHistoryRelations = relations(
  sessionStatusHistory,
  ({ one }) => ({
    session: one(verificationSession, {
      fields: [sessionStatusHistory.sessionId],
      references: [verificationSession.id],
    }),
  }),
);

export const webhookDeliveryRelations = relations(
  webhookDelivery,
  ({ one }) => ({
    endpoint: one(webhookEndpoint, {
      fields: [webhookDelivery.webhookEndpointId],
      references: [webhookEndpoint.id],
    }),
    session: one(verificationSession, {
      fields: [webhookDelivery.sessionId],
      references: [verificationSession.id],
    }),
  }),
);
```

**Step 5: Verify types compile**

Run: `cd apps/api && bunx tsc --noEmit`
Expected: No errors. If there are import issues (e.g., the generated auth.ts exports differently), adjust the imports.

**Step 6: Commit**

```bash
git add apps/api/src/database/schema/
git commit -m "feat: replace client table with organization, add auth FKs"
```

---

### Task 6: Generate and apply database migration

**Files:**
- Create: `apps/api/drizzle/<migration>.sql` (auto-generated)

**Step 1: Remove old migration (dev only, no production data)**

```bash
rm -rf apps/api/drizzle
```

**Step 2: Generate fresh migration**

Run:
```bash
cd apps/api && doppler run --no-fallback -- drizzle-kit generate
```
Expected: New migration file created in `apps/api/drizzle/`.

**Step 3: Review generated SQL**

Run: `cat apps/api/drizzle/*.sql`
Verify it creates all tables: user, session, account, verification, organization, member, invitation, api_key, webhook_endpoint, verification_session, verification_step, document, selfie, review, review_note, session_status_history, webhook_delivery.

**Step 4: Apply migration**

Run:
```bash
cd apps/api && doppler run --no-fallback -- drizzle-kit migrate
```
Expected: Migration applied successfully.

**Step 5: Commit**

```bash
git add apps/api/drizzle/
git commit -m "feat: regenerate database migration with auth tables"
```

---

### Task 7: Mount Better Auth in Elysia

**Files:**
- Modify: `apps/api/src/index.ts`

**Step 1: Add Better Auth mount and session macro**

Update `apps/api/src/index.ts`:

```typescript
import { Elysia } from "elysia";
import { db } from "./database";
import { auth } from "./auth";
import { clientsRouter } from "./routes/v1/clients";
import { sessionsRouter } from "./routes/v1/sessions";
import { verificationRouter } from "./routes/v1/verification";
import { reviewsRouter } from "./routes/v1/reviews";
import { verifyRouter } from "./routes/v1/verify";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 3000;

const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

const app = new Elysia()
  .decorate("db", db)
  .use(betterAuthPlugin)
  .get("/", () => "verichan")
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(clientsRouter)
  .use(sessionsRouter)
  .use(verificationRouter)
  .use(reviewsRouter)
  .use(verifyRouter)
  .listen(port);

console.log(`Server running at ${app.server?.url}`);
```

**Step 2: Verify server starts**

Run: `cd apps/api && doppler run --no-fallback -- timeout 5 bun src/index.ts 2>&1 || true`
Expected: "Server running at http://localhost:3000" (will timeout after 5s, that's fine).

**Step 3: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat: mount Better Auth handler in Elysia with session macro"
```

---

### Task 8: Create auth middleware guards

**Files:**
- Create: `apps/api/src/auth/guards.ts`
- Create: `apps/api/src/auth/guards.test.ts`

**Step 1: Write the failing test**

Create `apps/api/src/auth/guards.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { requireRole, requireReviewer } from "./guards";

describe("requireRole guard", () => {
  test("returns 403 when user role is not in allowed roles", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "viewer",
      }))
      .use(requireRole(["admin"]))
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(403);
  });

  test("allows request when user role matches", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "admin",
      }))
      .use(requireRole(["admin", "manager"]))
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && bun test src/auth/guards.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `apps/api/src/auth/guards.ts`:

```typescript
import { Elysia } from "elysia";
import { auth } from "./index";

/**
 * Resolve the current user's role in their active organization.
 * Use this as a base plugin before role-checking guards.
 */
export const resolveOrgMember = new Elysia({ name: "resolve-org-member" })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

/**
 * Guard that checks if the authenticated user has one of the allowed roles
 * in their active organization.
 */
export function requireRole(allowedRoles: string[]) {
  return new Elysia({ name: `require-role:${allowedRoles.join(",")}` })
    .onBeforeHandle(({ memberRole, set }) => {
      if (!memberRole || !allowedRoles.includes(memberRole as string)) {
        set.status = 403;
        return { error: "Forbidden: insufficient role" };
      }
    });
}

/**
 * Guard that checks if the user is a reviewer (member of the verichan org).
 */
export function requireReviewer() {
  return new Elysia({ name: "require-reviewer" })
    .onBeforeHandle(({ memberRole, set }) => {
      if (!memberRole || !["reviewer", "admin"].includes(memberRole as string)) {
        set.status = 403;
        return { error: "Forbidden: reviewer access required" };
      }
    });
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && bun test src/auth/guards.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/auth/guards.ts apps/api/src/auth/guards.test.ts
git commit -m "feat: add role-based auth guards"
```

---

### Task 9: Create seed script for internal verichan organization

**Files:**
- Create: `apps/api/src/database/seed.ts`

**Step 1: Write the seed script**

```typescript
import { db } from "./index";
import { auth } from "../auth";

const VERICHAN_ORG_SLUG = "verichan";

async function seed() {
  console.log("Seeding database...");

  // Check if verichan org exists
  const existingOrg = await auth.api.getFullOrganization({
    query: { organizationId: VERICHAN_ORG_SLUG },
  }).catch(() => null);

  if (existingOrg) {
    console.log("Verichan organization already exists, skipping seed.");
    return;
  }

  // Create the seed admin user first (needed to create org)
  const seedEmail = Bun.env.SEED_ADMIN_EMAIL;
  if (!seedEmail) {
    console.error("SEED_ADMIN_EMAIL env var required for seeding.");
    process.exit(1);
  }

  console.log(`Creating seed admin user: ${seedEmail}`);
  console.log("Verichan org will be created when the first admin signs in and is set up manually via the API.");
  console.log("Use the Better Auth API to:");
  console.log("  1. Create user via magic link");
  console.log("  2. auth.api.createOrganization({ body: { name: 'Verichan', slug: 'verichan' }, headers })");
  console.log("  3. Add reviewers via invitation");

  console.log("Seed complete.");
}

seed().catch(console.error);
```

**Step 2: Add seed script to package.json**

In `apps/api/package.json`, add to scripts:
```json
"db:seed": "doppler run --no-fallback -- bun src/database/seed.ts"
```

**Step 3: Commit**

```bash
git add apps/api/src/database/seed.ts apps/api/package.json
git commit -m "feat: add database seed script for verichan org"
```

---

## Phase 2: Frontend Auth Setup

### Task 10: Install frontend dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install better-auth in the web package**

Run:
```bash
cd apps/web && bun add better-auth
```

**Step 2: Commit**

```bash
git add apps/web/package.json bun.lock
git commit -m "feat: add better-auth client dependency to web"
```

---

### Task 11: Create auth client

**Files:**
- Create: `apps/web/src/lib/auth-client.ts`

**Step 1: Create the auth client instance**

```typescript
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  plugins: [
    magicLinkClient(),
    organizationClient(),
  ],
});
```

**Step 2: Add VITE_API_URL to Vite config env types**

Create `apps/web/src/env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/auth-client.ts apps/web/src/env.d.ts
git commit -m "feat: create Better Auth client with magic link and organization plugins"
```

---

### Task 12: Create login page

**Files:**
- Create: `apps/web/src/routes/login.tsx`

**Step 1: Create the login route**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Failed to send magic link");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-gray-600">
            We sent a sign-in link to <strong>{email}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            The link expires in 5 minutes.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to Verichan</h1>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add apps/web/src/routes/login.tsx
git commit -m "feat: add magic link login page"
```

---

### Task 13: Create invitation acceptance page

**Files:**
- Create: `apps/web/src/routes/invite/$invitationId.tsx`

**Step 1: Create the invite route**

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/invite/$invitationId")({
  component: InvitePage,
});

function InvitePage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [status, setStatus] = useState<"loading" | "accepting" | "needsLogin" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      setStatus("needsLogin");
      return;
    }

    // User is logged in, accept the invitation
    setStatus("accepting");
    authClient.organization.acceptInvitation({
      invitationId,
    }).then(({ error }) => {
      if (error) {
        setError(error.message || "Failed to accept invitation");
        setStatus("error");
      } else {
        navigate({ to: "/dashboard" });
      }
    });
  }, [session, sessionLoading, invitationId, navigate]);

  if (status === "loading" || status === "accepting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Accepting invitation...</p>
      </div>
    );
  }

  if (status === "needsLogin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Accept Invitation</h1>
          <p className="text-gray-600">Sign in to accept your invitation.</p>
          <a
            href={`/login?redirect=/invite/${invitationId}`}
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/invite/
git commit -m "feat: add invitation acceptance page"
```

---

### Task 14: Add route guards with TanStack Router

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/routes/dashboard/route.tsx`
- Create: `apps/web/src/routes/dashboard/index.tsx`
- Create: `apps/web/src/routes/review/route.tsx`
- Create: `apps/web/src/routes/review/index.tsx`

**Step 1: Update root route to provide auth context**

Replace `apps/web/src/routes/__root.tsx`:

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return <Outlet />;
}
```

**Step 2: Create dashboard layout with auth guard**

Create `apps/web/src/routes/dashboard/route.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { user: session.user, session: session.session };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Verichan Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={() => authClient.signOut()}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 3: Create dashboard index page**

Create `apps/web/src/routes/dashboard/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="mt-2 text-gray-600">Welcome to Verichan.</p>
    </div>
  );
}
```

**Step 4: Create review layout with auth guard**

Create `apps/web/src/routes/review/route.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/review")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    // Check active org is the verichan org
    const { data: activeOrg } = await authClient.organization.getFullOrganization({
      query: { organizationId: session.session.activeOrganizationId },
    }).catch(() => ({ data: null }));

    if (!activeOrg || activeOrg.slug !== "verichan") {
      throw redirect({ to: "/dashboard" });
    }

    return { user: session.user, session: session.session };
  },
  component: ReviewLayout,
});

function ReviewLayout() {
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Verichan Review</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{user.email}</span>
          <button
            onClick={() => authClient.signOut()}
            className="text-sm text-red-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 5: Create review index page**

Create `apps/web/src/routes/review/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/review/")({
  component: ReviewIndex,
});

function ReviewIndex() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Review Queue</h2>
      <p className="mt-2 text-gray-600">Verification sessions awaiting review.</p>
    </div>
  );
}
```

**Step 6: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

**Step 7: Commit**

```bash
git add apps/web/src/routes/
git commit -m "feat: add dashboard and review routes with auth guards"
```

---

## Phase 3: CORS and API Proxy

### Task 15: Add CORS support for frontend-backend communication

**Files:**
- Modify: `apps/api/src/index.ts`
- Modify: `apps/web/vite.config.ts`

**Step 1: Install CORS plugin for Elysia**

Run:
```bash
cd apps/api && bun add @elysiajs/cors
```

**Step 2: Add CORS to Elysia server**

In `apps/api/src/index.ts`, add CORS import and use it:

Add import:
```typescript
import { cors } from "@elysiajs/cors";
```

Add `.use(cors(...))` before `.use(betterAuthPlugin)`:
```typescript
const app = new Elysia()
  .use(cors({
    origin: Bun.env.WEB_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .decorate("db", db)
  .use(betterAuthPlugin)
  // ... rest of routes
```

**Step 3: Add API proxy to Vite dev config**

In `apps/web/vite.config.ts`, add proxy config in the `server` block:

```typescript
server: {
  host: true,
  open: false,
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
  },
},
```

**Step 4: Commit**

```bash
git add apps/api/src/index.ts apps/api/package.json apps/web/vite.config.ts bun.lock
git commit -m "feat: add CORS support and API proxy for auth"
```

---

## Phase 4: Typecheck and Verify

### Task 16: Run full typecheck across monorepo

**Step 1: Run typecheck**

Run:
```bash
bun run typecheck
```
Expected: No errors.

If there are errors, fix them. Common issues:
- Generated auth schema may use slightly different types — adjust imports
- Drizzle relation definitions may need updating if table exports changed
- TanStack Router generated route tree may need regeneration: `cd apps/web && bunx tsc --noEmit` triggers it

**Step 2: Run tests**

Run:
```bash
cd apps/api && bun test
```
Expected: All tests pass.

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve typecheck errors from auth integration"
```

---

## Summary

| Task | Description | Phase |
|------|-------------|-------|
| 1 | Install API dependencies (better-auth, resend) | Backend |
| 2 | Create access control roles and permissions | Backend |
| 3 | Create Better Auth server configuration | Backend |
| 4 | Generate Better Auth database schema | Backend |
| 5 | Update existing schema — replace client with organization | Backend |
| 6 | Generate and apply database migration | Backend |
| 7 | Mount Better Auth in Elysia | Backend |
| 8 | Create auth middleware guards | Backend |
| 9 | Create seed script | Backend |
| 10 | Install frontend dependencies | Frontend |
| 11 | Create auth client | Frontend |
| 12 | Create login page | Frontend |
| 13 | Create invitation acceptance page | Frontend |
| 14 | Add route guards with TanStack Router | Frontend |
| 15 | Add CORS and API proxy | Integration |
| 16 | Run full typecheck and verify | Verification |

## Environment Variables Needed

Add these to Doppler:
- `RESEND_API_KEY` — Resend API key for sending emails
- `EMAIL_FROM` — Sender email address (e.g., `noreply@verichan.com`)
- `WEB_URL` — Frontend URL (e.g., `http://localhost:5173` for dev)
- `BETTER_AUTH_SECRET` — Secret key for session encryption (min 32 chars, generate with `openssl rand -base64 32`)
