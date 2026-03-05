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

test("sessionStatus includes processing and needs_resubmission", () => {
  expect(sessionStatus.enumValues).toContain("processing");
  expect(sessionStatus.enumValues).toContain("needs_resubmission");
});

test("stepStatus includes processing", () => {
  expect(stepStatus.enumValues).toContain("processing");
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
