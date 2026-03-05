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
