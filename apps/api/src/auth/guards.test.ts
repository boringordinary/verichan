import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { requireRole, requireReviewer } from "./guards";

describe("requireRole guard", () => {
  test("returns 403 when user role is not in allowed roles", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "viewer",
      }))
      .use(requireRole(["admin"]))
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(403);
  });

  test("allows request when user role matches", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "admin",
      }))
      .use(requireRole(["admin", "manager"]))
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
  });
});

describe("requireReviewer guard", () => {
  test("returns 403 when user is not a reviewer", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "viewer",
      }))
      .use(requireReviewer())
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(403);
  });

  test("allows reviewer access", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "reviewer",
      }))
      .use(requireReviewer())
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
  });

  test("allows admin access to review", async () => {
    const app = new Elysia()
      .derive(() => ({
        user: { id: "1", name: "Test", email: "test@test.com" },
        session: { activeOrganizationId: "org-1" },
        memberRole: "admin",
      }))
      .use(requireReviewer())
      .get("/test", () => "ok");

    const res = await app.handle(new Request("http://localhost/test"));
    expect(res.status).toBe(200);
  });
});
