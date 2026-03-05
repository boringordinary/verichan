import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../database";
import { client, apiKey } from "../../database/schema/client";
import { hashApiKey } from "../../middleware/api-key-auth";

// TODO: Add admin auth middleware when available

export const clientsRouter = new Elysia({ prefix: "/v1/clients" })
  // POST /v1/clients — Create client
  .post(
    "/",
    async ({ body }) => {
      const [newClient] = await db
        .insert(client)
        .values({
          name: body.name,
          webhookUrl: body.webhook_url,
        })
        .returning();

      return {
        success: true,
        data: newClient,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        webhook_url: t.Optional(t.String()),
      }),
    },
  )
  // GET /v1/clients/:clientId — Get client by ID
  .get("/:clientId", async ({ params, set }) => {
    const [found] = await db
      .select()
      .from(client)
      .where(eq(client.id, params.clientId))
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
  })
  // POST /v1/clients/:clientId/api-keys — Generate API key pair
  .post(
    "/:clientId/api-keys",
    async ({ params, body, set }) => {
      // Verify client exists
      const [found] = await db
        .select()
        .from(client)
        .where(eq(client.id, params.clientId))
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
          clientId: params.clientId,
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
      body: t.Optional(
        t.Object({
          label: t.Optional(t.String()),
          environment: t.Optional(
            t.Union([t.Literal("live"), t.Literal("test")]),
          ),
        }),
      ),
    },
  )
  // DELETE /v1/clients/:clientId/api-keys/:keyId — Soft revoke
  .delete("/:clientId/api-keys/:keyId", async ({ params, set }) => {
    // Verify key belongs to client
    const [found] = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.id, params.keyId))
      .limit(1);

    if (!found || found.clientId !== params.clientId) {
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
  });
