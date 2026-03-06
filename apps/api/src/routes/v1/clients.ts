import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../database";
import { organization } from "../../database/schema/auth";
import { apiKey } from "../../database/schema/client";
import { hashApiKey } from "../../middleware/api-key-auth";

// TODO: Add admin auth middleware when available

const clientIdParams = t.Object({
  clientId: t.String(),
});

const clientApiKeyParams = t.Object({
  clientId: t.String(),
  keyId: t.String(),
});

export const clientsRouter = new Elysia({ prefix: "/v1/clients" })
  // POST /v1/clients — Create client (organization)
  .post(
    "/",
    async ({ body }) => {
      const [newOrg] = await db
        .insert(organization)
        .values({
          id: crypto.randomUUID(),
          name: body.name,
        })
        .returning();

      return {
        success: true,
        data: newOrg,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        webhook_url: t.Optional(t.String()),
      }),
      detail: {
        summary: "Create client",
        description: "Creates a client organization used to own verification sessions and API keys.",
        tags: ["Clients"],
      },
    },
  )
  // GET /v1/clients/:clientId — Get client by ID
  .get(
    "/:clientId",
    async ({ params, set }) => {
      const [found] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, params.clientId))
        .limit(1);

      if (!found) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Client not found" },
        };
      }

      return {
        success: true,
        data: found,
      };
    },
    {
      params: clientIdParams,
      detail: {
        summary: "Get client",
        description: "Returns a single client organization by its identifier.",
        tags: ["Clients"],
      },
    },
  )
  // POST /v1/clients/:clientId/api-keys — Generate API key pair
  .post(
    "/:clientId/api-keys",
    async ({ params, body, set }) => {
      // Verify organization exists
      const [found] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, params.clientId))
        .limit(1);

      if (!found) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Client not found" },
        };
      }

      const environment = body?.environment ?? "live";
      const prefix = environment === "test" ? "vk_test_" : "vk_live_";
      const rawKey =
        prefix + crypto.randomUUID().replace(/-/g, "");

      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      const [newKey] = await db
        .insert(apiKey)
        .values({
          organizationId: params.clientId,
          keyPrefix,
          keyHash,
          label: body?.label,
          environment,
        })
        .returning();

      return {
        success: true,
        data: {
          id: newKey.id,
          key: rawKey, // Only returned once
          key_prefix: newKey.keyPrefix,
          label: newKey.label,
          environment: newKey.environment,
          created_at: newKey.createdAt.toISOString(),
        },
      };
    },
    {
      params: clientIdParams,
      body: t.Optional(
        t.Object({
          label: t.Optional(t.String()),
          environment: t.Optional(
            t.Union([t.Literal("live"), t.Literal("test")]),
          ),
        }),
      ),
      detail: {
        summary: "Create API key",
        description: "Generates a new API key for the client and returns the raw key once.",
        tags: ["Clients"],
      },
    },
  )
  // DELETE /v1/clients/:clientId/api-keys/:keyId — Soft revoke
  .delete(
    "/:clientId/api-keys/:keyId",
    async ({ params, set }) => {
      // Verify key belongs to organization
      const [found] = await db
        .select()
        .from(apiKey)
        .where(eq(apiKey.id, params.keyId))
        .limit(1);

      if (!found || found.organizationId !== params.clientId) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "API key not found" },
        };
      }

      await db
        .update(apiKey)
        .set({ isActive: false })
        .where(eq(apiKey.id, params.keyId));

      return {
        success: true,
        data: { id: params.keyId, revoked: true },
      };
    },
    {
      params: clientApiKeyParams,
      detail: {
        summary: "Revoke API key",
        description: "Soft-revokes an API key that belongs to the client.",
        tags: ["Clients"],
      },
    },
  );
