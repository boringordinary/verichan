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
