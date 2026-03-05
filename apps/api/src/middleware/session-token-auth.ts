import { Elysia } from "elysia";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../database";
import { verificationSession } from "../database/schema/verification";

export function extractSessionToken(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export const sessionTokenAuth = new Elysia({ name: "session-token-auth" }).derive(
  async ({ headers, params, set }) => {
    const token = extractSessionToken(headers.authorization);
    if (!token) {
      set.status = 401;
      throw new Error("Missing session token");
    }

    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.token, token),
          gt(verificationSession.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      set.status = 401;
      throw new Error("Invalid or expired session token");
    }

    const sessionId = (params as Record<string, string>).sessionId;
    if (sessionId && session.id !== sessionId) {
      set.status = 403;
      throw new Error("Token does not match session");
    }

    return { session };
  },
);
