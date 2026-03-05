import { test, expect } from "bun:test";
import { extractApiKey, hashApiKey } from "../api-key-auth";

test("extractApiKey extracts Bearer token", () => {
  expect(extractApiKey("Bearer vk_live_abc123")).toBe("vk_live_abc123");
});

test("extractApiKey returns null for missing header", () => {
  expect(extractApiKey(undefined)).toBeNull();
  expect(extractApiKey("")).toBeNull();
  expect(extractApiKey(null)).toBeNull();
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
