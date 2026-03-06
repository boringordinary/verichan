import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { CreateFaceLivenessSessionCommand } from "@aws-sdk/client-rekognition";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../../database";
import {
  verificationSession,
  verificationStep,
} from "../../database/schema/verification";
import { document, selfie } from "../../database/schema/document";
import { sessionTokenAuth } from "../../middleware/session-token-auth";
import { rekognitionClient } from "../../aws/clients";
import { uploadTemp } from "../../aws/s3";
import { config } from "../../lib/config";

type Session = InferSelectModel<typeof verificationSession>;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG and PNG files are accepted" };
  }
  if (file.size > config.maxFileSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${config.maxFileSizeBytes / (1024 * 1024)}MB limit`,
    };
  }
  return { valid: true };
}

const sessionIdParams = t.Object({
  sessionId: t.String(),
});

export const verificationRouter = new Elysia({ prefix: "/v1/sessions" })
  .use(sessionTokenAuth)
  // POST /v1/sessions/:sessionId/liveness-session — Create AWS liveness session
  .post(
    "/:sessionId/liveness-session",
    async (ctx) => {
      const { set } = ctx;
      const session = (ctx as unknown as { session: Session }).session;

      if (session.status !== "created" && session.status !== "in_progress") {
        set.status = 422;
        return {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Session is not in a valid state for liveness check",
          },
        };
      }

      const result = await rekognitionClient.send(
        new CreateFaceLivenessSessionCommand({}),
      );

      // Update session status to in_progress if it was created
      if (session.status === "created") {
        await db
          .update(verificationSession)
          .set({ status: "in_progress" })
          .where(eq(verificationSession.id, session.id));
      }

      return {
        success: true,
        data: { liveness_session_id: result.SessionId },
      };
    },
    {
      params: sessionIdParams,
      detail: {
        summary: "Create liveness session",
        description: "Starts an AWS Rekognition liveness session for the verification flow.",
        tags: ["Verification"],
      },
    },
  )
  // POST /v1/sessions/:sessionId/documents — Upload document
  .post(
    "/:sessionId/documents",
    async (ctx) => {
      const { body, set } = ctx;
      const session = (ctx as unknown as { session: Session }).session;

      const fileValidation = validateFile(body.file);
      if (!fileValidation.valid) {
        set.status = 400;
        return {
          success: false,
          error: { code: "INVALID_FILE", message: fileValidation.error },
        };
      }

      // Find document step for this session
      const steps = await db
        .select()
        .from(verificationStep)
        .where(eq(verificationStep.sessionId, session.id));
      const docStep = steps.find((s) => s.type === "document");

      if (!docStep) {
        set.status = 422;
        return {
          success: false,
          error: {
            code: "NO_DOCUMENT_STEP",
            message: "This session does not require document upload",
          },
        };
      }

      // Upload to S3
      const fileBuffer = Buffer.from(await body.file.arrayBuffer());
      const { key, bucket } = await uploadTemp(
        session.id,
        body.file.name ||
          `document-${body.side}.${body.file.type === "image/png" ? "png" : "jpg"}`,
        fileBuffer,
        body.file.type,
      );

      // Create document record
      const [doc] = await db
        .insert(document)
        .values({
          stepId: docStep.id,
          documentType: body.document_type,
          side: body.side,
          fileKey: key,
          fileBucket: bucket,
          fileMimeType: body.file.type,
          fileSizeBytes: body.file.size,
        })
        .returning();

      // Update session to in_progress and step to submitted
      if (session.status === "created") {
        await db
          .update(verificationSession)
          .set({ status: "in_progress" })
          .where(eq(verificationSession.id, session.id));
      }

      await db
        .update(verificationStep)
        .set({ status: "submitted" })
        .where(eq(verificationStep.id, docStep.id));

      return {
        success: true,
        data: {
          document_id: doc.id,
          document_type: doc.documentType,
          side: doc.side,
        },
      };
    },
    {
      params: sessionIdParams,
      body: t.Object({
        document_type: t.Union([
          t.Literal("passport"),
          t.Literal("drivers_license"),
          t.Literal("national_id"),
          t.Literal("residence_permit"),
          t.Literal("other"),
        ]),
        side: t.Union([t.Literal("front"), t.Literal("back")]),
        file: t.File(),
      }),
      detail: {
        summary: "Upload document",
        description: "Uploads a verification document image for the current session.",
        tags: ["Verification"],
      },
    },
  )
  // POST /v1/sessions/:sessionId/selfie — Upload selfie
  .post(
    "/:sessionId/selfie",
    async (ctx) => {
      const { body, set } = ctx;
      const session = (ctx as unknown as { session: Session }).session;

      const fileValidation = validateFile(body.file);
      if (!fileValidation.valid) {
        set.status = 400;
        return {
          success: false,
          error: { code: "INVALID_FILE", message: fileValidation.error },
        };
      }

      // Find selfie step for this session
      const steps = await db
        .select()
        .from(verificationStep)
        .where(eq(verificationStep.sessionId, session.id));
      const selfieStep = steps.find((s) => s.type === "selfie");

      if (!selfieStep) {
        set.status = 422;
        return {
          success: false,
          error: {
            code: "NO_SELFIE_STEP",
            message: "This session does not require selfie upload",
          },
        };
      }

      // Upload to S3
      const fileBuffer = Buffer.from(await body.file.arrayBuffer());
      const { key, bucket } = await uploadTemp(
        session.id,
        body.file.name ||
          `selfie.${body.file.type === "image/png" ? "png" : "jpg"}`,
        fileBuffer,
        body.file.type,
      );

      // Create selfie record
      const [selfieRecord] = await db
        .insert(selfie)
        .values({
          stepId: selfieStep.id,
          fileKey: key,
          fileBucket: bucket,
          fileMimeType: body.file.type,
          fileSizeBytes: body.file.size,
        })
        .returning();

      // Update session to in_progress and step to submitted
      if (session.status === "created") {
        await db
          .update(verificationSession)
          .set({ status: "in_progress" })
          .where(eq(verificationSession.id, session.id));
      }

      await db
        .update(verificationStep)
        .set({ status: "submitted" })
        .where(eq(verificationStep.id, selfieStep.id));

      return {
        success: true,
        data: { selfie_id: selfieRecord.id },
      };
    },
    {
      params: sessionIdParams,
      body: t.Object({
        file: t.File(),
      }),
      detail: {
        summary: "Upload selfie",
        description: "Uploads the selfie image required for the current verification session.",
        tags: ["Verification"],
      },
    },
  )
  // POST /v1/sessions/:sessionId/submit — Submit for processing
  .post(
    "/:sessionId/submit",
    async (ctx) => {
      const { set } = ctx;
      const session = (ctx as unknown as { session: Session }).session;

      if (session.status !== "in_progress") {
        set.status = 422;
        return {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Session must be in progress to submit",
          },
        };
      }

      // Update to submitted
      await db
        .update(verificationSession)
        .set({ status: "submitted", submittedAt: new Date() })
        .where(eq(verificationSession.id, session.id));

      // Trigger pipeline async
      const { runPipeline } = await import(
        "../../services/verification/pipeline"
      );
      runPipeline(session.id).catch((err: unknown) => {
        console.error(`Pipeline error for session ${session.id}:`, err);
      });

      return {
        success: true,
        data: { session_id: session.id, status: "submitted" as const },
      };
    },
    {
      params: sessionIdParams,
      detail: {
        summary: "Submit session",
        description: "Marks the verification session as submitted and starts asynchronous processing.",
        tags: ["Verification"],
      },
    },
  );
