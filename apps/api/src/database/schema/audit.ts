import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sessionStatus, webhookDeliveryStatus } from "./enums";
import { verificationSession } from "./verification";
import { webhookEndpoint } from "./client";

export const sessionStatusHistory = pgTable(
  "session_status_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => verificationSession.id),
    fromStatus: sessionStatus("from_status"),
    toStatus: sessionStatus("to_status").notNull(),
    changedBy: text("changed_by"),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("session_status_history_session_id_idx").on(table.sessionId),
    index("session_status_history_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
  ],
);

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    webhookEndpointId: text("webhook_endpoint_id")
      .notNull()
      .references(() => webhookEndpoint.id),
    sessionId: text("session_id")
      .notNull()
      .references(() => verificationSession.id),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    status: webhookDeliveryStatus("status").default("pending").notNull(),
    payload: jsonb("payload"),
    responseStatusCode: integer("response_status_code"),
    responseBody: text("response_body"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    nextRetryAt: timestamp("next_retry_at"),
    lastAttemptAt: timestamp("last_attempt_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("webhook_delivery_endpoint_id_idx").on(table.webhookEndpointId),
    index("webhook_delivery_session_id_idx").on(table.sessionId),
    index("webhook_delivery_status_retry_idx").on(
      table.status,
      table.nextRetryAt,
    ),
  ],
);
