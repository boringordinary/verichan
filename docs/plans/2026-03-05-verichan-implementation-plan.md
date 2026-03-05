# Verichan Identity & Age Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the verichan verification API with identity verification (ID + selfie + liveness) and age verification (document-based and estimation-based tiers), backed by AWS Textract/Rekognition with temporary S3 storage.

**Architecture:** Elysia REST API with versioned `/v1` routes, Drizzle ORM + PostgreSQL, async processing pipeline with fail-fast behavior. AWS S3 for temporary image storage, Textract for document OCR, Rekognition for face detection/comparison/liveness. Provider calls behind adapter interfaces.

**Tech Stack:** Bun, Elysia, Drizzle ORM, PostgreSQL, AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/client-textract`, `@aws-sdk/client-rekognition`), Zod (already in project)

**Design doc:** `docs/plans/2026-03-05-verichan-identity-verification-design.md`

---

### Task 1: Install AWS SDK dependencies

**Files:**
- Modify: `apps/api/package.json`

**Step 1: Install packages**

```bash
cd apps/api && bun add @aws-sdk/client-s3 @aws-sdk/client-textract @aws-sdk/client-rekognition @aws-sdk/s3-request-presigner
```

**Step 2: Verify install**

```bash
cd apps/api && bun run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/api/package.json bun.lock
git commit -m "chore: add AWS SDK dependencies"
```

---

### Task 2: Update database schema — enums

**Files:**
- Modify: `apps/api/src/database/schema/enums.ts`
- Test: `apps/api/src/database/schema/__tests__/enums.test.ts`

**Step 1: Write test for new enums**

```typescript
// apps/api/src/database/schema/__tests__/enums.test.ts
import { test, expect } from "bun:test";
import {
  sessionStatus,
  stepStatus,
  stepType,
  documentType,
  serviceType,
  verificationTier,
  reviewDecision,
  webhookDeliveryStatus,
} from "../enums";

test("sessionStatus includes processing", () => {
  expect(sessionStatus.enumValues).toContain("processing");
});

test("stepType includes liveness", () => {
  expect(stepType.enumValues).toContain("liveness");
});

test("serviceType enum exists with correct values", () => {
  expect(serviceType.enumValues).toEqual([
    "identity_verification",
    "age_verification",
  ]);
});

test("verificationTier enum exists with correct values", () => {
  expect(verificationTier.enumValues).toEqual(["document", "estimation"]);
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/database/schema/__tests__/enums.test.ts
```

Expected: FAIL — `serviceType` and `verificationTier` not exported, `processing` not in sessionStatus, `liveness` not in stepType.

**Step 3: Update enums**

```typescript
// apps/api/src/database/schema/enums.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const sessionStatus = pgEnum("session_status", [
  "created",
  "in_progress",
  "submitted",
  "processing",
  "in_review",
  "approved",
  "rejected",
  "needs_resubmission",
  "expired",
  "cancelled",
]);

export const stepStatus = pgEnum("step_status", [
  "pending",
  "submitted",
  "processing",
  "approved",
  "rejected",
  "skipped",
]);

export const stepType = pgEnum("step_type", [
  "document",
  "selfie",
  "liveness",
]);

export const documentType = pgEnum("document_type", [
  "passport",
  "drivers_license",
  "national_id",
  "residence_permit",
  "other",
]);

export const serviceType = pgEnum("service_type", [
  "identity_verification",
  "age_verification",
]);

export const verificationTier = pgEnum("verification_tier", [
  "document",
  "estimation",
]);

export const reviewDecision = pgEnum("review_decision", [
  "approved",
  "rejected",
  "needs_resubmission",
]);

export const webhookDeliveryStatus = pgEnum("webhook_delivery_status", [
  "pending",
  "delivered",
  "failed",
  "retrying",
]);
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/database/schema/__tests__/enums.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/database/schema/enums.ts apps/api/src/database/schema/__tests__/enums.test.ts
git commit -m "feat: add serviceType, verificationTier enums; add processing/liveness values"
```

---

### Task 3: Update database schema — verification tables

Adds `service`, `tier`, `token`, `result_data`, `submitted_at` to verification_session. Adds `error_code`, `error_message`, `provider_response` to verification_step. Removes PII fields (`subjectFirstName`, `subjectLastName`, `subjectEmail`) from session — we only store DOB for age calculation.

**Files:**
- Modify: `apps/api/src/database/schema/verification.ts`

**Step 1: Update verification_session and verification_step**

```typescript
// apps/api/src/database/schema/verification.ts
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import {
  sessionStatus,
  serviceType,
  stepStatus,
  stepType,
  verificationTier,
} from "./enums";

export const verificationSession = pgTable(
  "verification_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id").notNull(),
    externalUserId: varchar("external_user_id", { length: 255 }),
    service: serviceType("service").notNull(),
    tier: verificationTier("tier").notNull(),
    status: sessionStatus("status").default("created").notNull(),
    token: text("token")
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    redirectUrl: text("redirect_url"),
    webhookUrl: text("webhook_url"),
    metadata: jsonb("metadata"),
    resultData: jsonb("result_data"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at").notNull(),
    submittedAt: timestamp("submitted_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("verification_session_organization_id_idx").on(table.organizationId),
    index("verification_session_status_idx").on(table.status),
    index("verification_session_org_ext_user_idx").on(
      table.organizationId,
      table.externalUserId,
    ),
    index("verification_session_created_at_idx").on(table.createdAt),
    uniqueIndex("verification_session_token_idx").on(table.token),
  ],
);

export const verificationStep = pgTable(
  "verification_step",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => verificationSession.id),
    type: stepType("type").notNull(),
    status: stepStatus("status").default("pending").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    config: jsonb("config"),
    resultData: jsonb("result_data"),
    providerResponse: jsonb("provider_response"),
    errorCode: varchar("error_code", { length: 50 }),
    errorMessage: text("error_message"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("verification_step_session_id_idx").on(table.sessionId),
    index("verification_step_session_type_idx").on(
      table.sessionId,
      table.type,
    ),
  ],
);
```

**Step 2: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS (relations.ts and other files reference verificationSession/verificationStep by import, column names may cause issues — fix any).

**Step 3: Commit**

```bash
git add apps/api/src/database/schema/verification.ts
git commit -m "feat: update verification schema with service, tier, token, pipeline fields"
```

---

### Task 4: Update database schema — document and selfie tables

Adds `purged_at` to both. Adds `similarity_score`, `liveness_score`, `liveness_session_id` to selfie.

**Files:**
- Modify: `apps/api/src/database/schema/document.ts`

**Step 1: Update document and selfie tables**

```typescript
// apps/api/src/database/schema/document.ts
import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { documentType } from "./enums";
import { verificationStep } from "./verification";

export const document = pgTable(
  "document",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    stepId: text("step_id")
      .notNull()
      .references(() => verificationStep.id),
    documentType: documentType("document_type").notNull(),
    side: varchar("side", { length: 10 }),
    fileKey: text("file_key").notNull(),
    fileBucket: varchar("file_bucket", { length: 255 }).notNull(),
    fileMimeType: varchar("file_mime_type", { length: 100 }),
    fileSizeBytes: integer("file_size_bytes"),
    extractedData: jsonb("extracted_data"),
    purgedAt: timestamp("purged_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("document_step_id_idx").on(table.stepId)],
);

export const selfie = pgTable(
  "selfie",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    stepId: text("step_id")
      .notNull()
      .references(() => verificationStep.id),
    fileKey: text("file_key").notNull(),
    fileBucket: varchar("file_bucket", { length: 255 }).notNull(),
    fileMimeType: varchar("file_mime_type", { length: 100 }),
    fileSizeBytes: integer("file_size_bytes"),
    captureMethod: varchar("capture_method", { length: 50 }),
    similarityScore: decimal("similarity_score", { precision: 5, scale: 2 }),
    livenessScore: decimal("liveness_score", { precision: 5, scale: 2 }),
    livenessSessionId: varchar("liveness_session_id", { length: 255 }),
    purgedAt: timestamp("purged_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("selfie_step_id_idx").on(table.stepId)],
);
```

**Step 2: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/database/schema/document.ts
git commit -m "feat: add purgedAt, liveness/similarity scores to document schema"
```

---

### Task 5: Update database schema — api_key table + add client table

Adds `client` table and `environment` field to api_key.

**Files:**
- Modify: `apps/api/src/database/schema/client.ts`

**Step 1: Update client schema**

```typescript
// apps/api/src/database/schema/client.ts
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const client = pgTable(
  "client",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    webhookUrl: text("webhook_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
);

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id),
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
    index("api_key_client_id_idx").on(table.clientId),
    uniqueIndex("api_key_key_hash_idx").on(table.keyHash),
  ],
);

export const webhookEndpoint = pgTable(
  "webhook_endpoint",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id),
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
    index("webhook_endpoint_client_id_idx").on(table.clientId),
  ],
);
```

**Step 2: Update schema.ts barrel export** — add client table export

```typescript
// apps/api/src/database/schema.ts
export * from "./schema/enums";
export * from "./schema/client";
export * from "./schema/verification";
export * from "./schema/document";
export * from "./schema/review";
export * from "./schema/audit";
export * from "./schema/relations";
```

No change needed — already exports client.

**Step 3: Update relations.ts** — all references to `organizationId` become `clientId`, add client relations

Update `apps/api/src/database/schema/relations.ts`:
- Import `client` from `./client`
- Add `clientRelations` for client -> apiKeys, webhookEndpoints, sessions
- Update `apiKey` and `webhookEndpoint` relations to reference `client`
- Update `verificationSession` relation to reference `client`

```typescript
// apps/api/src/database/schema/relations.ts
import { relations } from "drizzle-orm";
import { client, apiKey, webhookEndpoint } from "./client";
import { verificationSession, verificationStep } from "./verification";
import { document, selfie } from "./document";
import { review, reviewNote } from "./review";
import { sessionStatusHistory, webhookDelivery } from "./audit";

// --- Client relations ---

export const clientRelations = relations(client, ({ many }) => ({
  apiKeys: many(apiKey),
  webhookEndpoints: many(webhookEndpoint),
  sessions: many(verificationSession),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  client: one(client, {
    fields: [apiKey.clientId],
    references: [client.id],
  }),
}));

export const webhookEndpointRelations = relations(
  webhookEndpoint,
  ({ one, many }) => ({
    client: one(client, {
      fields: [webhookEndpoint.clientId],
      references: [client.id],
    }),
    deliveries: many(webhookDelivery),
  }),
);

// --- Verification relations ---

export const verificationSessionRelations = relations(
  verificationSession,
  ({ one, many }) => ({
    client: one(client, {
      fields: [verificationSession.organizationId],
      references: [client.id],
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

**Step 4: Update audit.ts** — change `organizationId` references if needed

The audit.ts file references `verificationSession` and `webhookEndpoint` — no changes needed since it references by id, not organizationId.

**Step 5: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 6: Generate migration**

```bash
cd apps/api && bun run db:generate
```

**Step 7: Commit**

```bash
git add apps/api/src/database/schema/
git commit -m "feat: add client table, update schema for verichan design"
```

---

### Task 6: Configuration module

**Files:**
- Create: `apps/api/src/lib/config.ts`
- Test: `apps/api/src/lib/__tests__/config.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/lib/__tests__/config.test.ts
import { test, expect } from "bun:test";
import { config } from "../config";

test("config has default threshold values", () => {
  expect(config.minSimilarityScore).toBe(90);
  expect(config.minLivenessScore).toBe(90);
  expect(config.minAge).toBe(18);
  expect(config.maxVerificationAttempts).toBe(5);
  expect(config.verificationExpiryDays).toBe(365);
  expect(config.sessionExpiryMinutes).toBe(30);
});

test("config has AWS settings", () => {
  expect(config.aws.region).toBeDefined();
  expect(config.aws.s3TempBucket).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/lib/__tests__/config.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// apps/api/src/lib/config.ts
function envInt(key: string, fallback: number): number {
  const val = Bun.env[key];
  return val ? parseInt(val, 10) : fallback;
}

function envStr(key: string, fallback: string): string {
  return Bun.env[key] ?? fallback;
}

export const config = {
  minSimilarityScore: envInt("MIN_SIMILARITY_SCORE", 90),
  minLivenessScore: envInt("MIN_LIVENESS_SCORE", 90),
  minAge: envInt("MIN_AGE", 18),
  maxVerificationAttempts: envInt("MAX_VERIFICATION_ATTEMPTS", 5),
  verificationExpiryDays: envInt("VERIFICATION_EXPIRY_DAYS", 365),
  sessionExpiryMinutes: envInt("SESSION_EXPIRY_MINUTES", 30),
  maxFileSizeBytes: envInt("MAX_FILE_SIZE_BYTES", 5 * 1024 * 1024),
  aws: {
    region: envStr("AWS_REGION", "us-east-1"),
    s3TempBucket: envStr("AWS_S3_TEMP_BUCKET", "verichan-temp"),
    accessKeyId: Bun.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: Bun.env.AWS_SECRET_ACCESS_KEY,
  },
} as const;
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/lib/__tests__/config.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/lib/
git commit -m "feat: add configuration module with env var thresholds"
```

---

### Task 7: AWS clients — shared instances

**Files:**
- Create: `apps/api/src/aws/clients.ts`
- Test: `apps/api/src/aws/__tests__/clients.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/aws/__tests__/clients.test.ts
import { test, expect } from "bun:test";
import { s3Client, textractClient, rekognitionClient } from "../clients";

test("s3Client is defined", () => {
  expect(s3Client).toBeDefined();
});

test("textractClient is defined", () => {
  expect(textractClient).toBeDefined();
});

test("rekognitionClient is defined", () => {
  expect(rekognitionClient).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/aws/__tests__/clients.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// apps/api/src/aws/clients.ts
import { S3Client } from "@aws-sdk/client-s3";
import { TextractClient } from "@aws-sdk/client-textract";
import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { config } from "../lib/config";

const clientConfig = {
  region: config.aws.region,
  ...(config.aws.accessKeyId && config.aws.secretAccessKey
    ? {
        credentials: {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        },
      }
    : {}),
};

export const s3Client = new S3Client(clientConfig);
export const textractClient = new TextractClient(clientConfig);
export const rekognitionClient = new RekognitionClient(clientConfig);
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/aws/__tests__/clients.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/aws/
git commit -m "feat: add shared AWS client instances"
```

---

### Task 8: S3 temp storage service

**Files:**
- Create: `apps/api/src/aws/s3.ts`
- Test: `apps/api/src/aws/__tests__/s3.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/aws/__tests__/s3.test.ts
import { test, expect } from "bun:test";
import { generateTempKey, buildS3Ref } from "../s3";

test("generateTempKey creates key with session prefix", () => {
  const key = generateTempKey("session-123", "front.jpg");
  expect(key).toStartWith("sessions/session-123/");
  expect(key).toEndWith(".jpg");
});

test("buildS3Ref creates correct S3Object structure", () => {
  const ref = buildS3Ref("my-key");
  expect(ref).toEqual({
    Bucket: expect.any(String),
    Name: "my-key",
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/aws/__tests__/s3.test.ts
```

Expected: FAIL

**Step 3: Write implementation**

```typescript
// apps/api/src/aws/s3.ts
import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "./clients";
import { config } from "../lib/config";

export function generateTempKey(sessionId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const uniqueId = crypto.randomUUID();
  return `sessions/${sessionId}/${uniqueId}.${ext}`;
}

export function buildS3Ref(key: string) {
  return {
    Bucket: config.aws.s3TempBucket,
    Name: key,
  };
}

export async function uploadTemp(
  sessionId: string,
  fileName: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; bucket: string }> {
  const key = generateTempKey(sessionId, fileName);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.aws.s3TempBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, bucket: config.aws.s3TempBucket };
}

export async function deleteTemp(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.aws.s3TempBucket,
      Key: key,
    }),
  );
}

export async function deleteTempBatch(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: config.aws.s3TempBucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    }),
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/aws/__tests__/s3.test.ts
```

Expected: PASS (unit tests only test pure functions, not S3 calls)

**Step 5: Commit**

```bash
git add apps/api/src/aws/s3.ts apps/api/src/aws/__tests__/s3.test.ts
git commit -m "feat: add S3 temp storage service"
```

---

### Task 9: API key auth middleware

**Files:**
- Create: `apps/api/src/middleware/api-key-auth.ts`
- Test: `apps/api/src/middleware/__tests__/api-key-auth.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/middleware/__tests__/api-key-auth.test.ts
import { test, expect } from "bun:test";
import { extractApiKey, hashApiKey } from "../api-key-auth";

test("extractApiKey extracts Bearer token", () => {
  expect(extractApiKey("Bearer vk_live_abc123")).toBe("vk_live_abc123");
});

test("extractApiKey returns null for missing header", () => {
  expect(extractApiKey(undefined)).toBeNull();
  expect(extractApiKey("")).toBeNull();
});

test("extractApiKey returns null for non-Bearer auth", () => {
  expect(extractApiKey("Basic abc123")).toBeNull();
});

test("hashApiKey produces consistent hash", async () => {
  const hash1 = await hashApiKey("test-key");
  const hash2 = await hashApiKey("test-key");
  expect(hash1).toBe(hash2);
});

test("hashApiKey produces different hash for different keys", async () => {
  const hash1 = await hashApiKey("key-1");
  const hash2 = await hashApiKey("key-2");
  expect(hash1).not.toBe(hash2);
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/middleware/__tests__/api-key-auth.test.ts
```

Expected: FAIL

**Step 3: Write implementation**

```typescript
// apps/api/src/middleware/api-key-auth.ts
import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { apiKey } from "../database/schema/client";

export function extractApiKey(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const apiKeyAuth = new Elysia({ name: "api-key-auth" }).derive(
  async ({ headers, set }) => {
    const rawKey = extractApiKey(headers.authorization);
    if (!rawKey) {
      set.status = 401;
      throw new Error("Missing API key");
    }

    const hash = await hashApiKey(rawKey);
    const [found] = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.keyHash, hash))
      .limit(1);

    if (!found || !found.isActive) {
      set.status = 401;
      throw new Error("Invalid API key");
    }

    if (found.expiresAt && found.expiresAt < new Date()) {
      set.status = 401;
      throw new Error("API key expired");
    }

    // Update last used (fire and forget)
    db.update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, found.id))
      .execute();

    return {
      clientId: found.clientId,
      apiKeyId: found.id,
      apiKeyEnvironment: found.environment,
    };
  },
);
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/middleware/__tests__/api-key-auth.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/middleware/
git commit -m "feat: add API key auth middleware"
```

---

### Task 10: Session token auth middleware

**Files:**
- Create: `apps/api/src/middleware/session-token-auth.ts`
- Test: `apps/api/src/middleware/__tests__/session-token-auth.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/middleware/__tests__/session-token-auth.test.ts
import { test, expect } from "bun:test";
import { extractSessionToken } from "../session-token-auth";

test("extractSessionToken extracts Bearer token", () => {
  expect(extractSessionToken("Bearer session-token-123")).toBe("session-token-123");
});

test("extractSessionToken returns null for missing header", () => {
  expect(extractSessionToken(undefined)).toBeNull();
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/middleware/__tests__/session-token-auth.test.ts
```

Expected: FAIL

**Step 3: Write implementation**

```typescript
// apps/api/src/middleware/session-token-auth.ts
import { Elysia } from "elysia";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../database";
import { verificationSession } from "../database/schema/verification";

export function extractSessionToken(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export const sessionTokenAuth = new Elysia({ name: "session-token-auth" }).derive(
  async ({ headers, params, set }) => {
    const token = extractSessionToken(headers.authorization);
    if (!token) {
      set.status = 401;
      throw new Error("Missing session token");
    }

    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.token, token),
          gt(verificationSession.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      set.status = 401;
      throw new Error("Invalid or expired session token");
    }

    const sessionId = (params as Record<string, string>).sessionId;
    if (sessionId && session.id !== sessionId) {
      set.status = 403;
      throw new Error("Token does not match session");
    }

    return { session };
  },
);
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/middleware/__tests__/session-token-auth.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/middleware/session-token-auth.ts apps/api/src/middleware/__tests__/session-token-auth.test.ts
git commit -m "feat: add session token auth middleware"
```

---

### Task 11: Session endpoints — create, get, list

**Files:**
- Create: `apps/api/src/routes/v1/sessions.ts`
- Test: `apps/api/src/routes/v1/__tests__/sessions.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/routes/v1/__tests__/sessions.test.ts
import { test, expect, describe } from "bun:test";
import { Elysia } from "elysia";
import { sessionsRouter, CreateSessionSchema } from "../sessions";

describe("CreateSessionSchema validation", () => {
  test("accepts valid identity_verification document request", () => {
    const body = {
      service: "identity_verification",
      tier: "document",
    };
    // Schema should accept this
    expect(body.service).toBe("identity_verification");
    expect(body.tier).toBe("document");
  });

  test("accepts valid age_verification estimation request", () => {
    const body = {
      service: "age_verification",
      tier: "estimation",
    };
    expect(body.service).toBe("age_verification");
    expect(body.tier).toBe("estimation");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/routes/v1/__tests__/sessions.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// apps/api/src/routes/v1/sessions.ts
import { Elysia, t } from "elysia";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  verificationSession,
  verificationStep,
} from "../../database/schema/verification";
import { apiKeyAuth } from "../../middleware/api-key-auth";
import { config } from "../../lib/config";

export const CreateSessionSchema = t.Object({
  service: t.Union([
    t.Literal("identity_verification"),
    t.Literal("age_verification"),
  ]),
  tier: t.Union([t.Literal("document"), t.Literal("estimation")]),
  external_user_id: t.Optional(t.String()),
  redirect_url: t.Optional(t.String()),
  webhook_url: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const sessionsRouter = new Elysia({ prefix: "/v1/sessions" })
  .use(apiKeyAuth)
  .post(
    "",
    async ({ body, clientId }) => {
      // Rate limit check
      if (body.external_user_id) {
        const recentAttempts = await db
          .select({ count: sql<number>`count(*)` })
          .from(verificationSession)
          .where(
            and(
              eq(verificationSession.organizationId, clientId),
              eq(verificationSession.externalUserId, body.external_user_id),
              sql`${verificationSession.createdAt} > now() - interval '24 hours'`,
            ),
          );
        if (recentAttempts[0].count >= config.maxVerificationAttempts) {
          return {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Maximum ${config.maxVerificationAttempts} verification attempts per 24 hours`,
            },
          };
        }
      }

      const expiresAt = new Date(
        Date.now() + config.sessionExpiryMinutes * 60 * 1000,
      );

      const [session] = await db
        .insert(verificationSession)
        .values({
          organizationId: clientId,
          externalUserId: body.external_user_id,
          service: body.service,
          tier: body.tier,
          redirectUrl: body.redirect_url,
          webhookUrl: body.webhook_url,
          metadata: body.metadata,
          expiresAt,
        })
        .returning();

      // Create initial verification steps based on service + tier
      const steps = [];
      if (body.tier === "document") {
        steps.push(
          { sessionId: session.id, type: "liveness" as const, sortOrder: 0 },
          { sessionId: session.id, type: "selfie" as const, sortOrder: 1 },
          { sessionId: session.id, type: "document" as const, sortOrder: 2 },
        );
      } else {
        // estimation tier — selfie only
        steps.push(
          { sessionId: session.id, type: "selfie" as const, sortOrder: 0 },
        );
      }

      await db.insert(verificationStep).values(steps);

      return {
        success: true,
        data: {
          session_id: session.id,
          token: session.token,
          status: session.status,
          hosted_url: `/v1/verify/${session.token}`,
          expires_at: session.expiresAt.toISOString(),
        },
      };
    },
    { body: CreateSessionSchema },
  )
  .get("", async ({ clientId, query }) => {
    const limit = Math.min(parseInt(query.limit ?? "20"), 100);
    const offset = parseInt(query.offset ?? "0");

    const sessions = await db
      .select()
      .from(verificationSession)
      .where(eq(verificationSession.organizationId, clientId))
      .orderBy(desc(verificationSession.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: sessions.map((s) => ({
        session_id: s.id,
        service: s.service,
        tier: s.tier,
        status: s.status,
        created_at: s.createdAt.toISOString(),
        expires_at: s.expiresAt.toISOString(),
        completed_at: s.completedAt?.toISOString() ?? null,
      })),
    };
  })
  .get("/:sessionId", async ({ clientId, params }) => {
    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.id, params.sessionId),
          eq(verificationSession.organizationId, clientId),
        ),
      )
      .limit(1);

    if (!session) {
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }

    return {
      success: true,
      data: {
        session_id: session.id,
        service: session.service,
        tier: session.tier,
        status: session.status,
        result_data: session.resultData,
        created_at: session.createdAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        submitted_at: session.submittedAt?.toISOString() ?? null,
        completed_at: session.completedAt?.toISOString() ?? null,
      },
    };
  })
  .get("/:sessionId/result", async ({ clientId, params }) => {
    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.id, params.sessionId),
          eq(verificationSession.organizationId, clientId),
        ),
      )
      .limit(1);

    if (!session) {
      return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
    }

    if (!["approved", "rejected", "needs_resubmission"].includes(session.status)) {
      return {
        success: false,
        error: { code: "NOT_COMPLETE", message: "Session has not been processed yet" },
      };
    }

    return {
      success: true,
      data: {
        session_id: session.id,
        status: session.status,
        result_data: session.resultData,
        completed_at: session.completedAt?.toISOString() ?? null,
      },
    };
  });
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/routes/v1/__tests__/sessions.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/routes/
git commit -m "feat: add session CRUD endpoints"
```

---

### Task 12: Verification flow endpoints — liveness, documents, selfie, submit

**Files:**
- Create: `apps/api/src/routes/v1/verification.ts`

**Step 1: Write implementation**

```typescript
// apps/api/src/routes/v1/verification.ts
import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db } from "../../database";
import {
  verificationSession,
  verificationStep,
} from "../../database/schema/verification";
import { document, selfie } from "../../database/schema/document";
import { sessionTokenAuth } from "../../middleware/session-token-auth";
import { uploadTemp } from "../../aws/s3";
import { rekognitionClient } from "../../aws/clients";
import { CreateFaceLivenessSessionCommand } from "@aws-sdk/client-rekognition";
import { config } from "../../lib/config";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG and PNG files are accepted" };
  }
  if (file.size > config.maxFileSizeBytes) {
    return { valid: false, error: `File size exceeds ${config.maxFileSizeBytes / (1024 * 1024)}MB limit` };
  }
  return { valid: true };
}

export const verificationRouter = new Elysia({ prefix: "/v1/sessions" })
  .use(sessionTokenAuth)
  // Create liveness session
  .post("/:sessionId/liveness-session", async ({ session, set }) => {
    if (session.status !== "created" && session.status !== "in_progress") {
      set.status = 400;
      return {
        success: false,
        error: { code: "INVALID_STATE", message: "Session cannot accept liveness at this stage" },
      };
    }

    const result = await rekognitionClient.send(
      new CreateFaceLivenessSessionCommand({}),
    );

    // Update session status to in_progress
    await db
      .update(verificationSession)
      .set({ status: "in_progress" })
      .where(eq(verificationSession.id, session.id));

    return {
      success: true,
      data: {
        liveness_session_id: result.SessionId,
      },
    };
  })
  // Upload document
  .post(
    "/:sessionId/documents",
    async ({ session, body, set }) => {
      if (session.status !== "created" && session.status !== "in_progress") {
        set.status = 400;
        return {
          success: false,
          error: { code: "INVALID_STATE", message: "Session cannot accept documents at this stage" },
        };
      }

      const fileValidation = validateFile(body.file);
      if (!fileValidation.valid) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: body.file.size > config.maxFileSizeBytes ? "FILE_TOO_LARGE" : "INVALID_FILE_TYPE",
            message: fileValidation.error,
          },
        };
      }

      // Find the document step
      const [docStep] = await db
        .select()
        .from(verificationStep)
        .where(
          and(
            eq(verificationStep.sessionId, session.id),
            eq(verificationStep.type, "document"),
          ),
        )
        .limit(1);

      if (!docStep) {
        set.status = 400;
        return {
          success: false,
          error: { code: "INVALID_STATE", message: "No document step for this session" },
        };
      }

      // Upload to S3
      const buffer = Buffer.from(await body.file.arrayBuffer());
      const { key, bucket } = await uploadTemp(
        session.id,
        body.file.name ?? `document-${body.side}.${body.file.type === "image/png" ? "png" : "jpg"}`,
        buffer,
        body.file.type,
      );

      // Create document record
      const [doc] = await db
        .insert(document)
        .values({
          stepId: docStep.id,
          documentType: body.document_type,
          side: body.side,
          fileKey: key,
          fileBucket: bucket,
          fileMimeType: body.file.type,
          fileSizeBytes: body.file.size,
        })
        .returning();

      // Update session + step status
      await db
        .update(verificationSession)
        .set({ status: "in_progress" })
        .where(eq(verificationSession.id, session.id));

      await db
        .update(verificationStep)
        .set({ status: "submitted" })
        .where(eq(verificationStep.id, docStep.id));

      return {
        success: true,
        data: {
          document_id: doc.id,
          document_type: doc.documentType,
          side: doc.side,
        },
      };
    },
    {
      body: t.Object({
        document_type: t.Union([
          t.Literal("passport"),
          t.Literal("drivers_license"),
          t.Literal("national_id"),
          t.Literal("residence_permit"),
          t.Literal("other"),
        ]),
        side: t.Union([t.Literal("front"), t.Literal("back")]),
        file: t.File(),
      }),
    },
  )
  // Upload selfie
  .post(
    "/:sessionId/selfie",
    async ({ session, body, set }) => {
      if (session.status !== "created" && session.status !== "in_progress") {
        set.status = 400;
        return {
          success: false,
          error: { code: "INVALID_STATE", message: "Session cannot accept selfie at this stage" },
        };
      }

      const fileValidation = validateFile(body.file);
      if (!fileValidation.valid) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: body.file.size > config.maxFileSizeBytes ? "FILE_TOO_LARGE" : "INVALID_FILE_TYPE",
            message: fileValidation.error,
          },
        };
      }

      // Find the selfie step
      const [selfieStep] = await db
        .select()
        .from(verificationStep)
        .where(
          and(
            eq(verificationStep.sessionId, session.id),
            eq(verificationStep.type, "selfie"),
          ),
        )
        .limit(1);

      if (!selfieStep) {
        set.status = 400;
        return {
          success: false,
          error: { code: "INVALID_STATE", message: "No selfie step for this session" },
        };
      }

      // Upload to S3
      const buffer = Buffer.from(await body.file.arrayBuffer());
      const { key, bucket } = await uploadTemp(
        session.id,
        body.file.name ?? `selfie.${body.file.type === "image/png" ? "png" : "jpg"}`,
        buffer,
        body.file.type,
      );

      // Create selfie record
      const [selfieRecord] = await db
        .insert(selfie)
        .values({
          stepId: selfieStep.id,
          fileKey: key,
          fileBucket: bucket,
          fileMimeType: body.file.type,
          fileSizeBytes: body.file.size,
        })
        .returning();

      // Update session + step status
      await db
        .update(verificationSession)
        .set({ status: "in_progress" })
        .where(eq(verificationSession.id, session.id));

      await db
        .update(verificationStep)
        .set({ status: "submitted" })
        .where(eq(verificationStep.id, selfieStep.id));

      return {
        success: true,
        data: {
          selfie_id: selfieRecord.id,
        },
      };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  )
  // Submit for processing
  .post("/:sessionId/submit", async ({ session, set }) => {
    if (session.status !== "in_progress") {
      set.status = 400;
      return {
        success: false,
        error: { code: "INVALID_STATE", message: "Session is not ready for submission" },
      };
    }

    // Update session status to submitted
    await db
      .update(verificationSession)
      .set({ status: "submitted", submittedAt: new Date() })
      .where(eq(verificationSession.id, session.id));

    // Trigger pipeline asynchronously (fire and forget)
    // Import dynamically to avoid circular deps
    const { runPipeline } = await import("../../services/verification/pipeline");
    runPipeline(session.id).catch((err) => {
      console.error(`Pipeline failed for session ${session.id}:`, err);
    });

    return {
      success: true,
      data: {
        session_id: session.id,
        status: "submitted",
      },
    };
  });
```

**Step 2: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: may fail on pipeline import — that's fine, we build it next.

**Step 3: Commit**

```bash
git add apps/api/src/routes/v1/verification.ts
git commit -m "feat: add verification flow endpoints (liveness, documents, selfie, submit)"
```

---

### Task 13: Pipeline orchestrator

**Files:**
- Create: `apps/api/src/services/verification/pipeline.ts`
- Test: `apps/api/src/services/verification/__tests__/pipeline.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/services/verification/__tests__/pipeline.test.ts
import { test, expect, describe } from "bun:test";
import { getStepsForService } from "../pipeline";

describe("getStepsForService", () => {
  test("identity_verification document tier has 5 steps", () => {
    const steps = getStepsForService("identity_verification", "document");
    expect(steps).toEqual([
      "liveness",
      "face_detection",
      "document_ocr",
      "face_comparison",
      "age_calculation",
    ]);
  });

  test("age_verification document tier has 5 steps", () => {
    const steps = getStepsForService("age_verification", "document");
    expect(steps).toEqual([
      "liveness",
      "face_detection",
      "document_ocr",
      "face_comparison",
      "age_calculation",
    ]);
  });

  test("age_verification estimation tier has 2 steps", () => {
    const steps = getStepsForService("age_verification", "estimation");
    expect(steps).toEqual(["face_detection", "age_estimation"]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/services/verification/__tests__/pipeline.test.ts
```

Expected: FAIL

**Step 3: Write implementation**

```typescript
// apps/api/src/services/verification/pipeline.ts
import { eq } from "drizzle-orm";
import { db } from "../../database";
import {
  verificationSession,
  verificationStep,
} from "../../database/schema/verification";
import { document, selfie } from "../../database/schema/document";
import { sessionStatusHistory } from "../../database/schema/audit";
import { deleteTempBatch } from "../../aws/s3";
import { checkLiveness } from "./steps/liveness";
import { detectFaces } from "./steps/face-detection";
import { extractIdData } from "./steps/document-ocr";
import { compareFaces } from "./steps/face-comparison";
import { calculateAge } from "./steps/age-calculation";
import { estimateAge } from "./steps/age-estimation";

type PipelineStep =
  | "liveness"
  | "face_detection"
  | "document_ocr"
  | "face_comparison"
  | "age_calculation"
  | "age_estimation";

export function getStepsForService(
  service: string,
  tier: string,
): PipelineStep[] {
  if (tier === "estimation") {
    return ["face_detection", "age_estimation"];
  }
  return [
    "liveness",
    "face_detection",
    "document_ocr",
    "face_comparison",
    "age_calculation",
  ];
}

export interface PipelineContext {
  sessionId: string;
  service: string;
  tier: string;
  selfieS3Key?: string;
  selfieS3Bucket?: string;
  documentS3Key?: string;
  documentS3Bucket?: string;
  documentBackS3Key?: string;
  livenessSessionId?: string;
  extractedDob?: string;
  extractedCountry?: string;
  similarityScore?: number;
  livenessScore?: number;
  estimatedAge?: number;
  estimatedAgeConfidence?: number;
}

export interface StepResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  data?: Record<string, unknown>;
  flagForReview?: boolean;
}

async function updateSessionStatus(
  sessionId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string,
) {
  await db
    .update(verificationSession)
    .set({ status: toStatus as any, ...(toStatus === "approved" || toStatus === "rejected" || toStatus === "needs_resubmission" ? { completedAt: new Date() } : {}) })
    .where(eq(verificationSession.id, sessionId));

  await db.insert(sessionStatusHistory).values({
    sessionId,
    fromStatus: fromStatus as any,
    toStatus: toStatus as any,
    reason,
  });
}

export async function runPipeline(sessionId: string): Promise<void> {
  // Load session
  const [session] = await db
    .select()
    .from(verificationSession)
    .where(eq(verificationSession.id, sessionId))
    .limit(1);

  if (!session) throw new Error(`Session ${sessionId} not found`);

  await updateSessionStatus(sessionId, session.status, "processing");

  // Load associated data
  const steps = await db
    .select()
    .from(verificationStep)
    .where(eq(verificationStep.sessionId, sessionId));

  const selfieStep = steps.find((s) => s.type === "selfie");
  const docStep = steps.find((s) => s.type === "document");

  let selfieRecord: typeof selfie.$inferSelect | undefined;
  if (selfieStep) {
    const [found] = await db
      .select()
      .from(selfie)
      .where(eq(selfie.stepId, selfieStep.id))
      .limit(1);
    selfieRecord = found;
  }

  let documentRecords: (typeof document.$inferSelect)[] = [];
  if (docStep) {
    documentRecords = await db
      .select()
      .from(document)
      .where(eq(document.stepId, docStep.id));
  }

  const frontDoc = documentRecords.find((d) => d.side === "front");
  const backDoc = documentRecords.find((d) => d.side === "back");

  // Build context
  const ctx: PipelineContext = {
    sessionId,
    service: session.service,
    tier: session.tier,
    selfieS3Key: selfieRecord?.fileKey,
    selfieS3Bucket: selfieRecord?.fileBucket,
    documentS3Key: frontDoc?.fileKey,
    documentS3Bucket: frontDoc?.fileBucket,
    documentBackS3Key: backDoc?.fileKey,
    livenessSessionId: selfieRecord?.livenessSessionId ?? undefined,
  };

  const pipelineSteps = getStepsForService(session.service, session.tier);
  let flagForReview = false;

  for (let i = 0; i < pipelineSteps.length; i++) {
    const stepName = pipelineSteps[i];
    let result: StepResult;

    try {
      switch (stepName) {
        case "liveness":
          result = await checkLiveness(ctx);
          break;
        case "face_detection":
          result = await detectFaces(ctx);
          break;
        case "document_ocr":
          result = await extractIdData(ctx);
          break;
        case "face_comparison":
          result = await compareFaces(ctx);
          break;
        case "age_calculation":
          result = await calculateAge(ctx);
          break;
        case "age_estimation":
          result = await estimateAge(ctx);
          break;
        default:
          result = { success: false, errorCode: "UNKNOWN_STEP", errorMessage: `Unknown step: ${stepName}` };
      }
    } catch (err) {
      result = {
        success: false,
        errorCode: "INTERNAL_ERROR",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      };
    }

    if (result.flagForReview) {
      flagForReview = true;
    }

    if (!result.success) {
      // Fail fast — record error and reject
      await updateSessionStatus(sessionId, "processing", "rejected", `Step ${i + 1} (${stepName}) failed: ${result.errorCode}`);

      await db
        .update(verificationSession)
        .set({
          resultData: {
            decision: "rejected",
            failed_step: i + 1,
            failed_step_name: stepName,
            error_code: result.errorCode,
            error_message: result.errorMessage,
            ...ctx,
          },
        })
        .where(eq(verificationSession.id, sessionId));

      await purgeImages(ctx);
      return;
    }

    // Merge step data into context
    if (result.data) {
      Object.assign(ctx, result.data);
    }
  }

  // All steps passed
  if (flagForReview) {
    await updateSessionStatus(sessionId, "processing", "in_review", "Low confidence — flagged for manual review");
  } else {
    await updateSessionStatus(sessionId, "processing", "approved");
  }

  await db
    .update(verificationSession)
    .set({
      resultData: {
        decision: flagForReview ? "in_review" : "approved",
        similarity_score: ctx.similarityScore,
        liveness_score: ctx.livenessScore,
        estimated_age: ctx.estimatedAge,
        extracted_dob: ctx.extractedDob,
        extracted_country: ctx.extractedCountry,
      },
    })
    .where(eq(verificationSession.id, sessionId));

  // Update selfie record with scores
  if (selfieRecord) {
    await db
      .update(selfie)
      .set({
        similarityScore: ctx.similarityScore?.toString(),
        livenessScore: ctx.livenessScore?.toString(),
      })
      .where(eq(selfie.id, selfieRecord.id));
  }

  // Update document extracted data
  if (frontDoc && ctx.extractedDob) {
    await db
      .update(document)
      .set({
        extractedData: {
          date_of_birth: ctx.extractedDob,
          country: ctx.extractedCountry,
        },
      })
      .where(eq(document.id, frontDoc.id));
  }

  await purgeImages(ctx);

  // TODO: Task 18 — fire webhook
}

async function purgeImages(ctx: PipelineContext): Promise<void> {
  const keys: string[] = [];
  if (ctx.selfieS3Key) keys.push(ctx.selfieS3Key);
  if (ctx.documentS3Key) keys.push(ctx.documentS3Key);
  if (ctx.documentBackS3Key) keys.push(ctx.documentBackS3Key);

  if (keys.length > 0) {
    await deleteTempBatch(keys);
  }

  // Mark as purged in DB
  if (ctx.selfieS3Key) {
    await db.update(selfie).set({ purgedAt: new Date() }).where(eq(selfie.fileKey, ctx.selfieS3Key));
  }
  if (ctx.documentS3Key) {
    await db.update(document).set({ purgedAt: new Date() }).where(eq(document.fileKey, ctx.documentS3Key));
  }
  if (ctx.documentBackS3Key) {
    await db.update(document).set({ purgedAt: new Date() }).where(eq(document.fileKey, ctx.documentBackS3Key));
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/services/verification/__tests__/pipeline.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/services/verification/
git commit -m "feat: add verification pipeline orchestrator"
```

---

### Task 14: Pipeline steps — liveness, face detection, document OCR, face comparison, age calculation, age estimation

**Files:**
- Create: `apps/api/src/services/verification/steps/liveness.ts`
- Create: `apps/api/src/services/verification/steps/face-detection.ts`
- Create: `apps/api/src/services/verification/steps/document-ocr.ts`
- Create: `apps/api/src/services/verification/steps/face-comparison.ts`
- Create: `apps/api/src/services/verification/steps/age-calculation.ts`
- Create: `apps/api/src/services/verification/steps/age-estimation.ts`
- Test: `apps/api/src/services/verification/steps/__tests__/age-calculation.test.ts`

**Step 1: Write failing test for age calculation (pure logic, testable without AWS)**

```typescript
// apps/api/src/services/verification/steps/__tests__/age-calculation.test.ts
import { test, expect, describe } from "bun:test";
import { calculateAgeFromDob } from "../age-calculation";

describe("calculateAgeFromDob", () => {
  test("calculates age correctly for past date", () => {
    const dob = new Date("1990-01-15");
    const now = new Date("2026-03-05");
    expect(calculateAgeFromDob(dob, now)).toBe(36);
  });

  test("handles birthday not yet passed this year", () => {
    const dob = new Date("1990-12-25");
    const now = new Date("2026-03-05");
    expect(calculateAgeFromDob(dob, now)).toBe(35);
  });

  test("handles birthday today", () => {
    const dob = new Date("1990-03-05");
    const now = new Date("2026-03-05");
    expect(calculateAgeFromDob(dob, now)).toBe(36);
  });

  test("returns 0 for future date", () => {
    const dob = new Date("2027-01-01");
    const now = new Date("2026-03-05");
    expect(calculateAgeFromDob(dob, now)).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/services/verification/steps/__tests__/age-calculation.test.ts
```

Expected: FAIL

**Step 3: Implement all pipeline steps**

```typescript
// apps/api/src/services/verification/steps/liveness.ts
import {
  GetFaceLivenessSessionResultsCommand,
} from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export async function checkLiveness(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.livenessSessionId) {
    return {
      success: false,
      errorCode: "LIVENESS_FAILED",
      errorMessage: "No liveness session ID provided",
    };
  }

  const result = await rekognitionClient.send(
    new GetFaceLivenessSessionResultsCommand({
      SessionId: ctx.livenessSessionId,
    }),
  );

  const confidence = result.Confidence ?? 0;

  if (confidence < config.minLivenessScore) {
    return {
      success: false,
      errorCode: "LIVENESS_FAILED",
      errorMessage: `Liveness confidence ${confidence.toFixed(1)} below threshold ${config.minLivenessScore}`,
    };
  }

  return {
    success: true,
    data: { livenessScore: confidence },
  };
}
```

```typescript
// apps/api/src/services/verification/steps/face-detection.ts
import { DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { buildS3Ref } from "../../../aws/s3";
import type { PipelineContext, StepResult } from "../pipeline";

export async function detectFaces(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.selfieS3Key || !ctx.selfieS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No selfie uploaded",
    };
  }

  const result = await rekognitionClient.send(
    new DetectFacesCommand({
      Image: {
        S3Object: {
          Bucket: ctx.selfieS3Bucket,
          Name: ctx.selfieS3Key,
        },
      },
      Attributes: ["ALL"],
    }),
  );

  const faces = result.FaceDetails ?? [];

  if (faces.length === 0) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No face detected in selfie",
    };
  }

  if (faces.length > 1) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Multiple faces detected in selfie — exactly one face required",
    };
  }

  const face = faces[0];

  // Check for sunglasses
  if (face.Sunglasses?.Value === true && (face.Sunglasses.Confidence ?? 0) > 80) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Sunglasses detected — please remove sunglasses",
    };
  }

  // Check eyes open
  if (face.EyesOpen?.Value === false && (face.EyesOpen.Confidence ?? 0) > 80) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Eyes appear closed — please keep eyes open",
    };
  }

  return { success: true };
}
```

```typescript
// apps/api/src/services/verification/steps/document-ocr.ts
import { AnalyzeIDCommand } from "@aws-sdk/client-textract";
import { textractClient } from "../../../aws/clients";
import type { PipelineContext, StepResult } from "../pipeline";

export async function extractIdData(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.documentS3Key || !ctx.documentS3Bucket) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: "No document uploaded",
    };
  }

  const documentPages = [
    {
      S3Object: {
        Bucket: ctx.documentS3Bucket,
        Name: ctx.documentS3Key,
      },
    },
  ];

  if (ctx.documentBackS3Key) {
    documentPages.push({
      S3Object: {
        Bucket: ctx.documentS3Bucket,
        Name: ctx.documentBackS3Key,
      },
    });
  }

  const result = await textractClient.send(
    new AnalyzeIDCommand({ DocumentPages: documentPages }),
  );

  const identityDocuments = result.IdentityDocuments ?? [];
  if (identityDocuments.length === 0) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: "Could not parse identity document",
    };
  }

  // Extract fields
  const fields = identityDocuments[0].IdentityDocumentFields ?? [];
  const fieldMap = new Map<string, { value: string; confidence: number }>();

  for (const field of fields) {
    const key = field.Type?.Text;
    const value = field.ValueDetection?.Text;
    const confidence = field.ValueDetection?.Confidence ?? 0;
    if (key && value) {
      fieldMap.set(key, { value, confidence });
    }
  }

  const dob = fieldMap.get("DATE_OF_BIRTH");
  const expiry = fieldMap.get("EXPIRATION_DATE");
  const country = fieldMap.get("COUNTRY");

  if (!dob) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: "Could not extract date of birth from document",
    };
  }

  // Check if document is expired
  if (expiry) {
    const expiryDate = new Date(expiry.value);
    if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
      return {
        success: false,
        errorCode: "ID_EXPIRED",
        errorMessage: "Identity document has expired",
      };
    }
  }

  // Flag for review if low confidence
  const lowConfidence = dob.confidence < 80;

  return {
    success: true,
    flagForReview: lowConfidence,
    data: {
      extractedDob: dob.value,
      extractedCountry: country?.value,
    },
  };
}
```

```typescript
// apps/api/src/services/verification/steps/face-comparison.ts
import { CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export async function compareFaces(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.selfieS3Key || !ctx.selfieS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: "No selfie available for comparison",
    };
  }

  if (!ctx.documentS3Key || !ctx.documentS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: "No document available for comparison",
    };
  }

  const result = await rekognitionClient.send(
    new CompareFacesCommand({
      SourceImage: {
        S3Object: {
          Bucket: ctx.selfieS3Bucket,
          Name: ctx.selfieS3Key,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: ctx.documentS3Bucket,
          Name: ctx.documentS3Key,
        },
      },
      SimilarityThreshold: 0,
    }),
  );

  const matches = result.FaceMatches ?? [];
  if (matches.length === 0) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: "No matching face found between selfie and document",
    };
  }

  const similarity = matches[0].Similarity ?? 0;

  if (similarity < config.minSimilarityScore) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: `Face similarity ${similarity.toFixed(1)} below threshold ${config.minSimilarityScore}`,
    };
  }

  return {
    success: true,
    data: { similarityScore: similarity },
  };
}
```

```typescript
// apps/api/src/services/verification/steps/age-calculation.ts
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export function calculateAgeFromDob(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export async function calculateAge(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.extractedDob) {
    return {
      success: false,
      errorCode: "UNDERAGE",
      errorMessage: "No date of birth available",
    };
  }

  const dob = new Date(ctx.extractedDob);
  if (isNaN(dob.getTime())) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: `Could not parse date of birth: ${ctx.extractedDob}`,
    };
  }

  const age = calculateAgeFromDob(dob);

  if (age < config.minAge) {
    return {
      success: false,
      errorCode: "UNDERAGE",
      errorMessage: `Age ${age} is below minimum required age of ${config.minAge}`,
    };
  }

  return { success: true };
}
```

```typescript
// apps/api/src/services/verification/steps/age-estimation.ts
import { DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export async function estimateAge(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.selfieS3Key || !ctx.selfieS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No selfie available for age estimation",
    };
  }

  const result = await rekognitionClient.send(
    new DetectFacesCommand({
      Image: {
        S3Object: {
          Bucket: ctx.selfieS3Bucket,
          Name: ctx.selfieS3Key,
        },
      },
      Attributes: ["ALL"],
    }),
  );

  const faces = result.FaceDetails ?? [];
  if (faces.length === 0) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No face detected for age estimation",
    };
  }

  const face = faces[0];
  const ageRange = face.AgeRange;

  if (!ageRange || ageRange.Low === undefined || ageRange.High === undefined) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Could not estimate age from selfie",
    };
  }

  const estimatedAge = Math.floor((ageRange.Low + ageRange.High) / 2);
  const confidence = face.Confidence ?? 0;

  // If the entire range is below minimum age, reject
  if (ageRange.High < config.minAge) {
    return {
      success: false,
      errorCode: "UNDERAGE",
      errorMessage: `Estimated age range ${ageRange.Low}-${ageRange.High} is below minimum ${config.minAge}`,
    };
  }

  // If the low end is below minimum, flag for review
  const borderline = ageRange.Low < config.minAge;

  return {
    success: true,
    flagForReview: borderline,
    data: {
      estimatedAge,
      estimatedAgeConfidence: confidence,
    },
  };
}
```

**Step 4: Run tests**

```bash
cd apps/api && bun test src/services/verification/steps/__tests__/age-calculation.test.ts
```

Expected: PASS

**Step 5: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/services/
git commit -m "feat: add verification pipeline steps (liveness, face detection, OCR, comparison, age)"
```

---

### Task 15: Review endpoints

**Files:**
- Create: `apps/api/src/routes/v1/reviews.ts`

**Step 1: Write implementation**

```typescript
// apps/api/src/routes/v1/reviews.ts
import { Elysia, t } from "elysia";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "../../database";
import { review, reviewNote } from "../../database/schema/review";
import { verificationSession } from "../../database/schema/verification";
import { sessionStatusHistory } from "../../database/schema/audit";
import { apiKeyAuth } from "../../middleware/api-key-auth";

export const reviewsRouter = new Elysia({ prefix: "/v1/reviews" })
  .use(apiKeyAuth)
  .get("", async ({ clientId }) => {
    const reviews = await db
      .select()
      .from(review)
      .innerJoin(
        verificationSession,
        eq(review.sessionId, verificationSession.id),
      )
      .where(
        and(
          eq(verificationSession.organizationId, clientId),
          isNull(review.decision),
        ),
      )
      .orderBy(desc(review.createdAt));

    return {
      success: true,
      data: reviews.map((r) => ({
        review_id: r.review.id,
        session_id: r.review.sessionId,
        reviewer_id: r.review.reviewerId,
        decision: r.review.decision,
        assigned_at: r.review.assignedAt?.toISOString() ?? null,
        created_at: r.review.createdAt.toISOString(),
      })),
    };
  })
  .get("/:reviewId", async ({ clientId, params }) => {
    const [found] = await db
      .select()
      .from(review)
      .innerJoin(
        verificationSession,
        eq(review.sessionId, verificationSession.id),
      )
      .where(
        and(
          eq(review.id, params.reviewId),
          eq(verificationSession.organizationId, clientId),
        ),
      )
      .limit(1);

    if (!found) {
      return { success: false, error: { code: "NOT_FOUND", message: "Review not found" } };
    }

    const notes = await db
      .select()
      .from(reviewNote)
      .where(eq(reviewNote.reviewId, params.reviewId));

    return {
      success: true,
      data: {
        review_id: found.review.id,
        session_id: found.review.sessionId,
        session_status: found.verification_session.status,
        session_result: found.verification_session.resultData,
        decision: found.review.decision,
        decision_reason: found.review.decisionReason,
        notes: notes.map((n) => ({
          id: n.id,
          content: n.content,
          author_id: n.authorId,
          is_client_visible: n.isClientVisible,
          created_at: n.createdAt.toISOString(),
        })),
        created_at: found.review.createdAt.toISOString(),
      },
    };
  })
  .post(
    "/:reviewId/decision",
    async ({ clientId, params, body }) => {
      const [found] = await db
        .select()
        .from(review)
        .innerJoin(
          verificationSession,
          eq(review.sessionId, verificationSession.id),
        )
        .where(
          and(
            eq(review.id, params.reviewId),
            eq(verificationSession.organizationId, clientId),
          ),
        )
        .limit(1);

      if (!found) {
        return { success: false, error: { code: "NOT_FOUND", message: "Review not found" } };
      }

      if (found.review.decision) {
        return { success: false, error: { code: "ALREADY_DECIDED", message: "Review already has a decision" } };
      }

      await db
        .update(review)
        .set({
          decision: body.decision,
          decisionReason: body.reason,
          decidedAt: new Date(),
        })
        .where(eq(review.id, params.reviewId));

      // Update session status based on decision
      const newStatus = body.decision === "approved" ? "approved"
        : body.decision === "rejected" ? "rejected"
        : "needs_resubmission";

      await db
        .update(verificationSession)
        .set({ status: newStatus as any, completedAt: new Date() })
        .where(eq(verificationSession.id, found.review.sessionId));

      await db.insert(sessionStatusHistory).values({
        sessionId: found.review.sessionId,
        fromStatus: "in_review",
        toStatus: newStatus as any,
        reason: `Manual review: ${body.decision}${body.reason ? ` — ${body.reason}` : ""}`,
      });

      return {
        success: true,
        data: {
          review_id: params.reviewId,
          decision: body.decision,
          session_status: newStatus,
        },
      };
    },
    {
      body: t.Object({
        decision: t.Union([
          t.Literal("approved"),
          t.Literal("rejected"),
          t.Literal("needs_resubmission"),
        ]),
        reason: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/:reviewId/notes",
    async ({ clientId, params, body }) => {
      const [found] = await db
        .select()
        .from(review)
        .innerJoin(
          verificationSession,
          eq(review.sessionId, verificationSession.id),
        )
        .where(
          and(
            eq(review.id, params.reviewId),
            eq(verificationSession.organizationId, clientId),
          ),
        )
        .limit(1);

      if (!found) {
        return { success: false, error: { code: "NOT_FOUND", message: "Review not found" } };
      }

      const [note] = await db
        .insert(reviewNote)
        .values({
          reviewId: params.reviewId,
          content: body.content,
          authorId: body.author_id,
          isClientVisible: body.is_client_visible ?? false,
        })
        .returning();

      return {
        success: true,
        data: {
          note_id: note.id,
          created_at: note.createdAt.toISOString(),
        },
      };
    },
    {
      body: t.Object({
        content: t.String(),
        author_id: t.Optional(t.String()),
        is_client_visible: t.Optional(t.Boolean()),
      }),
    },
  );
```

**Step 2: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/routes/v1/reviews.ts
git commit -m "feat: add review endpoints (list, get, decision, notes)"
```

---

### Task 16: Wire up routes to main app

**Files:**
- Modify: `apps/api/src/index.ts`

**Step 1: Update index.ts**

```typescript
// apps/api/src/index.ts
import { Elysia } from "elysia";
import { db } from "./database";
import { sessionsRouter } from "./routes/v1/sessions";
import { verificationRouter } from "./routes/v1/verification";
import { reviewsRouter } from "./routes/v1/reviews";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 3000;

const app = new Elysia()
  .decorate("db", db)
  .get("/", () => "verichan")
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(sessionsRouter)
  .use(verificationRouter)
  .use(reviewsRouter)
  .listen(port);

console.log(`Server running at ${app.server?.url}`);
```

**Step 2: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat: wire up v1 session, verification, and review routes"
```

---

### Task 17: Webhook delivery service

**Files:**
- Create: `apps/api/src/services/webhooks.ts`
- Test: `apps/api/src/services/__tests__/webhooks.test.ts`

**Step 1: Write failing test**

```typescript
// apps/api/src/services/__tests__/webhooks.test.ts
import { test, expect } from "bun:test";
import { signWebhookPayload } from "../webhooks";

test("signWebhookPayload produces consistent HMAC", async () => {
  const payload = JSON.stringify({ event: "session.approved" });
  const secret = "test-secret";
  const sig1 = await signWebhookPayload(payload, secret);
  const sig2 = await signWebhookPayload(payload, secret);
  expect(sig1).toBe(sig2);
});

test("signWebhookPayload produces different signature for different payloads", async () => {
  const secret = "test-secret";
  const sig1 = await signWebhookPayload('{"a":1}', secret);
  const sig2 = await signWebhookPayload('{"a":2}', secret);
  expect(sig1).not.toBe(sig2);
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && bun test src/services/__tests__/webhooks.test.ts
```

Expected: FAIL

**Step 3: Write implementation**

```typescript
// apps/api/src/services/webhooks.ts
import { eq, and } from "drizzle-orm";
import { db } from "../database";
import { webhookEndpoint } from "../database/schema/client";
import { webhookDelivery } from "../database/schema/audit";
import { verificationSession } from "../database/schema/verification";

export async function signWebhookPayload(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function deliverWebhook(
  sessionId: string,
  eventType: string,
): Promise<void> {
  const [session] = await db
    .select()
    .from(verificationSession)
    .where(eq(verificationSession.id, sessionId))
    .limit(1);

  if (!session) return;

  // Check session-level webhook URL first, then org-level endpoints
  const urls: { url: string; secret: string; endpointId?: string }[] = [];

  if (session.webhookUrl) {
    urls.push({ url: session.webhookUrl, secret: "" });
  }

  const endpoints = await db
    .select()
    .from(webhookEndpoint)
    .where(
      and(
        eq(webhookEndpoint.clientId, session.organizationId),
        eq(webhookEndpoint.isActive, true),
      ),
    );

  for (const ep of endpoints) {
    const events = ep.events ?? [];
    if (events.length === 0 || events.includes(eventType)) {
      urls.push({ url: ep.url, secret: ep.secretHash, endpointId: ep.id });
    }
  }

  const payload = JSON.stringify({
    event: eventType,
    session_id: session.id,
    status: session.status,
    result_data: session.resultData,
    timestamp: new Date().toISOString(),
  });

  for (const target of urls) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (target.secret) {
      const signature = await signWebhookPayload(payload, target.secret);
      headers["X-Verichan-Signature"] = signature;
    }

    // Create delivery record
    const [delivery] = await db
      .insert(webhookDelivery)
      .values({
        webhookEndpointId: target.endpointId ?? "session-level",
        sessionId,
        eventType,
        payload: JSON.parse(payload),
      })
      .returning();

    try {
      const response = await fetch(target.url, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(10000),
      });

      await db
        .update(webhookDelivery)
        .set({
          status: response.ok ? "delivered" : "failed",
          responseStatusCode: response.status,
          responseBody: await response.text().catch(() => null),
          attemptCount: 1,
          lastAttemptAt: new Date(),
          ...(response.ok ? { deliveredAt: new Date() } : {}),
        })
        .where(eq(webhookDelivery.id, delivery.id));
    } catch (err) {
      await db
        .update(webhookDelivery)
        .set({
          status: "failed",
          attemptCount: 1,
          lastAttemptAt: new Date(),
          responseBody: err instanceof Error ? err.message : "Unknown error",
        })
        .where(eq(webhookDelivery.id, delivery.id));
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/api && bun test src/services/__tests__/webhooks.test.ts
```

Expected: PASS

**Step 5: Update pipeline to call webhook after completion**

In `apps/api/src/services/verification/pipeline.ts`, add after the `purgeImages` call at the end of `runPipeline`:

```typescript
// After purgeImages(ctx);
const finalStatus = flagForReview ? "in_review" : "approved";
const eventType = flagForReview ? "session.needs_resubmission" : "session.approved";
// Dynamic import to avoid circular
const { deliverWebhook } = await import("../webhooks");
deliverWebhook(sessionId, eventType).catch((err) => {
  console.error(`Webhook delivery failed for session ${sessionId}:`, err);
});
```

And in the rejection branch:

```typescript
// After purgeImages(ctx); in the failure branch
const { deliverWebhook } = await import("../webhooks");
deliverWebhook(sessionId, "session.rejected").catch((err) => {
  console.error(`Webhook delivery failed for session ${sessionId}:`, err);
});
```

**Step 6: Run all tests**

```bash
cd apps/api && bun test
```

Expected: all PASS

**Step 7: Commit**

```bash
git add apps/api/src/services/
git commit -m "feat: add webhook delivery service with HMAC signing"
```

---

### Task 18: Client management endpoints

**Files:**
- Create: `apps/api/src/routes/v1/clients.ts`

**Step 1: Write implementation**

```typescript
// apps/api/src/routes/v1/clients.ts
import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../database";
import { client, apiKey } from "../../database/schema/client";
import { hashApiKey } from "../../middleware/api-key-auth";

function generateApiKey(environment: string): string {
  const prefix = environment === "live" ? "vk_live_" : "vk_test_";
  const random = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}${random}`;
}

export const clientsRouter = new Elysia({ prefix: "/v1/clients" })
  // TODO: Add admin auth middleware for production
  .post(
    "",
    async ({ body }) => {
      const [newClient] = await db
        .insert(client)
        .values({ name: body.name, webhookUrl: body.webhook_url })
        .returning();

      return {
        success: true,
        data: {
          client_id: newClient.id,
          name: newClient.name,
          created_at: newClient.createdAt.toISOString(),
        },
      };
    },
    {
      body: t.Object({
        name: t.String(),
        webhook_url: t.Optional(t.String()),
      }),
    },
  )
  .get("/:clientId", async ({ params }) => {
    const [found] = await db
      .select()
      .from(client)
      .where(eq(client.id, params.clientId))
      .limit(1);

    if (!found) {
      return { success: false, error: { code: "NOT_FOUND", message: "Client not found" } };
    }

    return {
      success: true,
      data: {
        client_id: found.id,
        name: found.name,
        webhook_url: found.webhookUrl,
        is_active: found.isActive,
        created_at: found.createdAt.toISOString(),
      },
    };
  })
  .post(
    "/:clientId/api-keys",
    async ({ params, body }) => {
      const rawKey = generateApiKey(body.environment ?? "live");
      const hash = await hashApiKey(rawKey);
      const prefix = rawKey.substring(0, 12);

      const [key] = await db
        .insert(apiKey)
        .values({
          clientId: params.clientId,
          keyPrefix: prefix,
          keyHash: hash,
          label: body.label,
          environment: body.environment ?? "live",
        })
        .returning();

      return {
        success: true,
        data: {
          api_key_id: key.id,
          key: rawKey, // Only returned once at creation
          prefix: prefix,
          environment: key.environment,
          label: key.label,
        },
      };
    },
    {
      body: t.Object({
        label: t.Optional(t.String()),
        environment: t.Optional(t.Union([t.Literal("live"), t.Literal("test")])),
      }),
    },
  )
  .delete("/:clientId/api-keys/:keyId", async ({ params }) => {
    await db
      .update(apiKey)
      .set({ isActive: false })
      .where(
        eq(apiKey.id, params.keyId),
      );

    return { success: true };
  });
```

**Step 2: Wire into index.ts** — add `import { clientsRouter } from "./routes/v1/clients"` and `.use(clientsRouter)`.

**Step 3: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/routes/v1/clients.ts apps/api/src/index.ts
git commit -m "feat: add client management endpoints"
```

---

### Task 19: Hosted flow endpoint

**Files:**
- Create: `apps/api/src/routes/v1/verify.ts`

**Step 1: Write implementation**

```typescript
// apps/api/src/routes/v1/verify.ts
import { Elysia } from "elysia";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../../database";
import { verificationSession } from "../../database/schema/verification";

export const verifyRouter = new Elysia({ prefix: "/v1/verify" }).get(
  "/:token",
  async ({ params, set }) => {
    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.token, params.token),
          gt(verificationSession.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      set.status = 404;
      return { error: "Verification session not found or expired" };
    }

    if (session.status === "approved" || session.status === "rejected") {
      return {
        status: session.status,
        message: `Verification has already been ${session.status}`,
      };
    }

    // For MVP, return session info for the hosted UI to consume
    // The full hosted UI (HTML/React) will be built in a future task
    return {
      session_id: session.id,
      service: session.service,
      tier: session.tier,
      status: session.status,
      token: session.token,
      expires_at: session.expiresAt.toISOString(),
    };
  },
);
```

**Step 2: Wire into index.ts** — add import and `.use(verifyRouter)`.

**Step 3: Run typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/routes/v1/verify.ts apps/api/src/index.ts
git commit -m "feat: add hosted verification flow endpoint"
```

---

### Task 20: Generate migration and run full typecheck

**Step 1: Run full typecheck**

```bash
cd apps/api && bun run typecheck
```

Expected: PASS

**Step 2: Generate drizzle migration**

```bash
cd apps/api && bun run db:generate
```

**Step 3: Run all tests**

```bash
cd apps/api && bun test
```

Expected: all PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: generate database migration for verichan schema"
```

---

### Task 21: Final integration — verify server starts

**Step 1: Start the dev server**

```bash
cd apps/api && bun run dev
```

Expected: Server starts without errors on port 3000.

**Step 2: Test health endpoint**

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Step 3: Test root endpoint**

```bash
curl http://localhost:3000/
```

Expected: `verichan`

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any integration issues"
```

---
