import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../../database";
import { verificationSession } from "../../database/schema/verification";

export const verifyRouter = new Elysia({ prefix: "/v1/verify" })
  // GET /v1/verify/:token — Look up session by token for hosted UI
  .get("/:token", async ({ params, set }) => {
    const [session] = await db
      .select()
      .from(verificationSession)
      .where(eq(verificationSession.token, params.token))
      .limit(1);

    if (!session) {
      set.status = 404;
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Verification session not found" },
      };
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      set.status = 410;
      return {
        success: false,
        error: {
          code: "EXPIRED",
          message: "This verification session has expired",
        },
      };
    }

    // Check if already completed
    const terminalStatuses = [
      "approved",
      "rejected",
      "needs_resubmission",
      "cancelled",
    ];
    if (terminalStatuses.includes(session.status)) {
      return {
        success: true,
        data: {
          session_id: session.id,
          status: session.status,
          completed: true,
          message: `This verification session has been ${session.status}`,
        },
      };
    }

    // Return session info for the hosted UI to consume
    return {
      success: true,
      data: {
        session_id: session.id,
        status: session.status,
        service: session.service,
        tier: session.tier,
        completed: false,
        expires_at: session.expiresAt.toISOString(),
      },
    };
  });
