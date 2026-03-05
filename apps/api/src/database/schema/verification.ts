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
