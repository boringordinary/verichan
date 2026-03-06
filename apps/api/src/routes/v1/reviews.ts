import { Elysia, t } from "elysia";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "../../database";
import { review, reviewNote } from "../../database/schema/review";
import { verificationSession } from "../../database/schema/verification";
import { sessionStatusHistory } from "../../database/schema/audit";
import { apiKeyAuth } from "../../middleware/api-key-auth";

const reviewIdParams = t.Object({
  reviewId: t.String(),
});

export const reviewsRouter = new Elysia({ prefix: "/v1/reviews" })
  .use(apiKeyAuth)
  // GET /v1/reviews — List pending reviews for this client
  .get(
    "/",
    async (ctx) => {
      const clientId = (ctx as unknown as { clientId: string }).clientId;

      const pendingReviews = await db
        .select({
          review: review,
          session: verificationSession,
        })
        .from(review)
        .innerJoin(
          verificationSession,
          eq(review.sessionId, verificationSession.id),
        )
        .where(
          and(
            eq(verificationSession.organizationId, clientId),
            isNull(review.decision),
          ),
        )
        .orderBy(desc(review.createdAt));

      return {
        success: true,
        data: pendingReviews,
      };
    },
    {
      detail: {
        summary: "List pending reviews",
        description: "Returns open manual reviews for the authenticated client.",
        tags: ["Reviews"],
      },
    },
  )
  // GET /v1/reviews/:reviewId — Get review detail with notes
  .get(
    "/:reviewId",
    async (ctx) => {
      const { params, set } = ctx;
      const clientId = (ctx as unknown as { clientId: string }).clientId;

      const results = await db
        .select({
          review: review,
          session: verificationSession,
        })
        .from(review)
        .innerJoin(
          verificationSession,
          eq(review.sessionId, verificationSession.id),
        )
        .where(
          and(
            eq(review.id, params.reviewId),
            eq(verificationSession.organizationId, clientId),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Review not found" },
        };
      }

      const notes = await db
        .select()
        .from(reviewNote)
        .where(eq(reviewNote.reviewId, params.reviewId))
        .orderBy(desc(reviewNote.createdAt));

      return {
        success: true,
        data: {
          ...results[0],
          notes,
        },
      };
    },
    {
      params: reviewIdParams,
      detail: {
        summary: "Get review",
        description: "Returns a single review and its attached notes.",
        tags: ["Reviews"],
      },
    },
  )
  // POST /v1/reviews/:reviewId/decision — Submit decision
  .post(
    "/:reviewId/decision",
    async (ctx) => {
      const { params, body, set } = ctx;
      const clientId = (ctx as unknown as { clientId: string }).clientId;

      const results = await db
        .select({
          review: review,
          session: verificationSession,
        })
        .from(review)
        .innerJoin(
          verificationSession,
          eq(review.sessionId, verificationSession.id),
        )
        .where(
          and(
            eq(review.id, params.reviewId),
            eq(verificationSession.organizationId, clientId),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Review not found" },
        };
      }

      const existingReview = results[0].review;
      const session = results[0].session;

      if (existingReview.decision !== null) {
        set.status = 422;
        return {
          success: false,
          error: {
            code: "ALREADY_DECIDED",
            message: "A decision has already been made for this review",
          },
        };
      }

      // Update review with decision
      const [updatedReview] = await db
        .update(review)
        .set({
          decision: body.decision,
          decisionReason: body.reason,
          decidedAt: new Date(),
        })
        .where(eq(review.id, params.reviewId))
        .returning();

      // Map review decision to session status
      const newStatus = body.decision as
        | "approved"
        | "rejected"
        | "needs_resubmission";

      // Update session status
      await db
        .update(verificationSession)
        .set({
          status: newStatus,
          completedAt: new Date(),
        })
        .where(eq(verificationSession.id, session.id));

      // Create status history record
      await db.insert(sessionStatusHistory).values({
        sessionId: session.id,
        fromStatus: session.status,
        toStatus: newStatus,
        changedBy: "reviewer",
        reason: body.reason ?? `Review decision: ${body.decision}`,
      });

      return {
        success: true,
        data: updatedReview,
      };
    },
    {
      params: reviewIdParams,
      body: t.Object({
        decision: t.Union([
          t.Literal("approved"),
          t.Literal("rejected"),
          t.Literal("needs_resubmission"),
        ]),
        reason: t.Optional(t.String()),
      }),
      detail: {
        summary: "Submit review decision",
        description: "Applies a manual review decision and updates the underlying verification session status.",
        tags: ["Reviews"],
      },
    },
  )
  // POST /v1/reviews/:reviewId/notes — Add note
  .post(
    "/:reviewId/notes",
    async (ctx) => {
      const { params, body, set } = ctx;
      const clientId = (ctx as unknown as { clientId: string }).clientId;

      // Verify org ownership
      const results = await db
        .select({
          review: review,
          session: verificationSession,
        })
        .from(review)
        .innerJoin(
          verificationSession,
          eq(review.sessionId, verificationSession.id),
        )
        .where(
          and(
            eq(review.id, params.reviewId),
            eq(verificationSession.organizationId, clientId),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Review not found" },
        };
      }

      const [note] = await db
        .insert(reviewNote)
        .values({
          reviewId: params.reviewId,
          content: body.content,
          authorId: body.author_id,
          isClientVisible: body.is_client_visible ?? false,
        })
        .returning();

      return {
        success: true,
        data: note,
      };
    },
    {
      params: reviewIdParams,
      body: t.Object({
        content: t.String(),
        author_id: t.Optional(t.String()),
        is_client_visible: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Add review note",
        description: "Appends a note to an existing review.",
        tags: ["Reviews"],
      },
    },
  );
