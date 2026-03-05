import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { reviewDecision } from "./enums";
import { verificationSession, verificationStep } from "./verification";
import { user } from "./auth";

export const review = pgTable(
  "review",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => verificationSession.id),
    reviewerId: text("reviewer_id").references(() => user.id),
    decision: reviewDecision("decision"),
    decisionReason: text("decision_reason"),
    assignedAt: timestamp("assigned_at"),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("review_session_id_idx").on(table.sessionId),
    index("review_reviewer_id_idx").on(table.reviewerId),
    index("review_decision_assigned_at_idx").on(
      table.decision,
      table.assignedAt,
    ),
  ],
);

export const reviewNote = pgTable(
  "review_note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reviewId: text("review_id")
      .notNull()
      .references(() => review.id),
    stepId: text("step_id").references(() => verificationStep.id),
    authorId: text("author_id").references(() => user.id),
    content: text("content").notNull(),
    isClientVisible: boolean("is_client_visible").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("review_note_review_id_idx").on(table.reviewId)],
);
