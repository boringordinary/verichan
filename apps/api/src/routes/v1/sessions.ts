import { Elysia, t } from "elysia";
import { eq, and, sql, gt } from "drizzle-orm";
import { db } from "../../database";
import {
  verificationSession,
  verificationStep,
} from "../../database/schema/verification";
import { apiKeyAuth } from "../../middleware/api-key-auth";
import { config } from "../../lib/config";

export const CreateSessionSchema = t.Object({
  service: t.Union([
    t.Literal("identity_verification"),
    t.Literal("age_verification"),
  ]),
  tier: t.Union([t.Literal("document"), t.Literal("estimation")]),
  external_user_id: t.Optional(t.String()),
  redirect_url: t.Optional(t.String()),
  webhook_url: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
});

type StepDefinition = {
  type: "liveness" | "selfie" | "document";
  sortOrder: number;
};

function getStepsForServiceTier(
  _service: string,
  tier: string,
): StepDefinition[] {
  if (tier === "document") {
    return [
      { type: "liveness", sortOrder: 0 },
      { type: "selfie", sortOrder: 1 },
      { type: "document", sortOrder: 2 },
    ];
  }
  // estimation tier
  return [{ type: "selfie", sortOrder: 0 }];
}

export const sessionsRouter = new Elysia({ prefix: "/v1/sessions" })
  .use(apiKeyAuth)
  // POST /v1/sessions — Create session
  .post(
    "/",
    async (ctx) => {
      const { body, set } = ctx;
      const clientId = (ctx as unknown as { clientId: string }).clientId;

      // Rate limit check
      if (body.external_user_id) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [countResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(verificationSession)
          .where(
            and(
              eq(verificationSession.organizationId, clientId),
              eq(verificationSession.externalUserId, body.external_user_id),
              gt(verificationSession.createdAt, twentyFourHoursAgo),
            ),
          );

        if (countResult && countResult.count >= config.maxVerificationAttempts) {
          set.status = 429;
          return {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: `Maximum ${config.maxVerificationAttempts} verification attempts per 24 hours exceeded`,
            },
          };
        }
      }

      const expiresAt = new Date(
        Date.now() + config.sessionExpiryMinutes * 60 * 1000,
      );

      const [session] = await db
        .insert(verificationSession)
        .values({
          organizationId: clientId,
          service: body.service,
          tier: body.tier,
          externalUserId: body.external_user_id,
          redirectUrl: body.redirect_url,
          webhookUrl: body.webhook_url,
          metadata: body.metadata,
          expiresAt,
        })
        .returning();

      // Create verification steps
      const steps = getStepsForServiceTier(body.service, body.tier);
      await db.insert(verificationStep).values(
        steps.map((step) => ({
          sessionId: session.id,
          type: step.type,
          sortOrder: step.sortOrder,
        })),
      );

      return {
        success: true,
        data: {
          session_id: session.id,
          token: session.token,
          status: session.status,
          hosted_url: `/v1/verify/${session.token}`,
          expires_at: session.expiresAt.toISOString(),
        },
      };
    },
    { body: CreateSessionSchema },
  )
  // GET /v1/sessions — List sessions (paginated)
  .get(
    "/",
    async (ctx) => {
      const { query } = ctx;
      const clientId = (ctx as unknown as { clientId: string }).clientId;

      const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
      const offset = Math.max(query.offset ?? 0, 0);

      const sessions = await db
        .select()
        .from(verificationSession)
        .where(eq(verificationSession.organizationId, clientId))
        .limit(limit)
        .offset(offset)
        .orderBy(verificationSession.createdAt);

      return {
        success: true,
        data: sessions,
        pagination: { limit, offset },
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric()),
        offset: t.Optional(t.Numeric()),
      }),
    },
  )
  // GET /v1/sessions/:sessionId — Get session detail
  .get("/:sessionId", async (ctx) => {
    const { params, set } = ctx;
    const clientId = (ctx as unknown as { clientId: string }).clientId;

    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.id, params.sessionId),
          eq(verificationSession.organizationId, clientId),
        ),
      )
      .limit(1);

    if (!session) {
      set.status = 404;
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Session not found" },
      };
    }

    return { success: true, data: session };
  })
  // GET /v1/sessions/:sessionId/result — Get result
  .get("/:sessionId/result", async (ctx) => {
    const { params, set } = ctx;
    const clientId = (ctx as unknown as { clientId: string }).clientId;

    const [session] = await db
      .select()
      .from(verificationSession)
      .where(
        and(
          eq(verificationSession.id, params.sessionId),
          eq(verificationSession.organizationId, clientId),
        ),
      )
      .limit(1);

    if (!session) {
      set.status = 404;
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Session not found" },
      };
    }

    const terminalStatuses = ["approved", "rejected", "needs_resubmission"];
    if (!terminalStatuses.includes(session.status)) {
      set.status = 422;
      return {
        success: false,
        error: {
          code: "NOT_COMPLETE",
          message: "Session has not been completed yet",
        },
      };
    }

    return {
      success: true,
      data: {
        session_id: session.id,
        status: session.status,
        result_data: session.resultData,
        completed_at: session.completedAt?.toISOString() ?? null,
      },
    };
  });
