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
