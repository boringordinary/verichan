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
