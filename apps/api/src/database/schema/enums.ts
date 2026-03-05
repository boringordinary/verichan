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
