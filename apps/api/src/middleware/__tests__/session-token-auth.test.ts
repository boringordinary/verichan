import { test, expect } from "bun:test";
import { extractSessionToken } from "../session-token-auth";

test("extractSessionToken extracts Bearer token", () => {
  expect(extractSessionToken("Bearer session-token-123")).toBe("session-token-123");
});

test("extractSessionToken returns null for missing header", () => {
  expect(extractSessionToken(undefined)).toBeNull();
  expect(extractSessionToken(null)).toBeNull();
  expect(extractSessionToken("")).toBeNull();
});

test("extractSessionToken returns null for non-Bearer auth", () => {
  expect(extractSessionToken("Basic abc")).toBeNull();
});
