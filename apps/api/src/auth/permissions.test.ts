import { describe, test, expect } from "bun:test";
import { ac, admin, manager, viewer, reviewer } from "./permissions";

describe("access control", () => {
  test("admin has full org permissions", () => {
    expect(ac.hasPermission({ role: "admin", permissions: { organization: ["update"] } })).toBe(true);
    expect(ac.hasPermission({ role: "admin", permissions: { member: ["create", "update", "delete"] } })).toBe(true);
    expect(ac.hasPermission({ role: "admin", permissions: { invitation: ["create", "cancel"] } })).toBe(true);
  });

  test("manager has operational permissions but not member management", () => {
    expect(ac.hasPermission({ role: "manager", permissions: { verificationSession: ["read"] } })).toBe(true);
    expect(ac.hasPermission({ role: "manager", permissions: { webhook: ["create"] } })).toBe(true);
    expect(ac.hasPermission({ role: "manager", permissions: { member: ["create"] } })).toBe(false);
  });

  test("viewer has read-only permissions", () => {
    expect(ac.hasPermission({ role: "viewer", permissions: { verificationSession: ["read"] } })).toBe(true);
    expect(ac.hasPermission({ role: "viewer", permissions: { webhook: ["create"] } })).toBe(false);
  });

  test("reviewer has review permissions", () => {
    expect(ac.hasPermission({ role: "reviewer", permissions: { review: ["read", "decide"] } })).toBe(true);
    expect(ac.hasPermission({ role: "reviewer", permissions: { verificationSession: ["read"] } })).toBe(true);
  });
});
