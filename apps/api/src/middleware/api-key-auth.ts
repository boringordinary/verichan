import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { apiKey } from "../database/schema/client";

export function extractApiKey(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const apiKeyAuth = new Elysia({ name: "api-key-auth" }).derive(
  async ({ headers, set }) => {
    const rawKey = extractApiKey(headers.authorization);
    if (!rawKey) {
      set.status = 401;
      throw new Error("Missing API key");
    }

    const hash = await hashApiKey(rawKey);
    const [found] = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.keyHash, hash))
      .limit(1);

    if (!found || !found.isActive) {
      set.status = 401;
      throw new Error("Invalid API key");
    }

    if (found.expiresAt && found.expiresAt < new Date()) {
      set.status = 401;
      throw new Error("API key expired");
    }

    // Update last used (fire and forget)
    db.update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, found.id))
      .execute();

    return {
      clientId: found.clientId,
      apiKeyId: found.id,
      apiKeyEnvironment: found.environment,
    };
  },
);
