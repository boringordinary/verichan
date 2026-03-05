import { eq, inArray } from "drizzle-orm";
import { db } from "../../database";
import {
  verificationSession,
  verificationStep,
} from "../../database/schema/verification";
import { document, selfie } from "../../database/schema/document";
import { sessionStatusHistory } from "../../database/schema/audit";
import { deleteTempBatch } from "../../aws/s3";
import { checkLiveness } from "./steps/liveness";
import { detectFaces } from "./steps/face-detection";
import { extractIdData } from "./steps/document-ocr";
import { compareFaces } from "./steps/face-comparison";
import { calculateAge } from "./steps/age-calculation";
import { estimateAge } from "./steps/age-estimation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineContext {
  sessionId: string;
  service: string;
  tier: string;
  selfieS3Key?: string;
  selfieS3Bucket?: string;
  documentS3Key?: string;
  documentS3Bucket?: string;
  documentBackS3Key?: string;
  livenessSessionId?: string;
  extractedDob?: string;
  extractedCountry?: string;
  similarityScore?: number;
  livenessScore?: number;
  estimatedAge?: number;
  estimatedAgeConfidence?: number;
}

export interface StepResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  data?: Record<string, unknown>;
  flagForReview?: boolean;
}

// ---------------------------------------------------------------------------
// Step registry
// ---------------------------------------------------------------------------

type StepName =
  | "liveness"
  | "face_detection"
  | "document_ocr"
  | "face_comparison"
  | "age_calculation"
  | "age_estimation";

const STEP_FN: Record<
  StepName,
  (ctx: PipelineContext) => Promise<StepResult>
> = {
  liveness: checkLiveness,
  face_detection: detectFaces,
  document_ocr: extractIdData,
  face_comparison: compareFaces,
  age_calculation: calculateAge,
  age_estimation: estimateAge,
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function getStepsForService(
  _service: string,
  tier: string,
): StepName[] {
  if (tier === "estimation") {
    return ["face_detection", "age_estimation"];
  }
  // document tier (default for both identity_verification and age_verification)
  return [
    "liveness",
    "face_detection",
    "document_ocr",
    "face_comparison",
    "age_calculation",
  ];
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------

export async function runPipeline(sessionId: string): Promise<void> {
  // 1. Load session
  const session = await db
    .select()
    .from(verificationSession)
    .where(eq(verificationSession.id, sessionId))
    .then((rows) => rows[0]);

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // 2. Update status to "processing"
  const previousStatus = session.status;
  await db
    .update(verificationSession)
    .set({ status: "processing" })
    .where(eq(verificationSession.id, sessionId));

  await db.insert(sessionStatusHistory).values({
    sessionId,
    fromStatus: previousStatus,
    toStatus: "processing",
    changedBy: "system",
    reason: "Pipeline started",
  });

  // 3. Load associated records
  const steps = await db
    .select()
    .from(verificationStep)
    .where(eq(verificationStep.sessionId, sessionId));

  const stepIds = steps.map((s) => s.id);

  const allSelfies =
    stepIds.length > 0
      ? await db
          .select()
          .from(selfie)
          .where(inArray(selfie.stepId, stepIds))
      : [];

  const allDocuments =
    stepIds.length > 0
      ? await db
          .select()
          .from(document)
          .where(inArray(document.stepId, stepIds))
      : [];

  // 4. Build context
  const selfieRecord = allSelfies[0];
  const frontDocument = allDocuments.find((d) => d.side !== "back");
  const backDocument = allDocuments.find((d) => d.side === "back");

  const ctx: PipelineContext = {
    sessionId,
    service: session.service,
    tier: session.tier,
    selfieS3Key: selfieRecord?.fileKey,
    selfieS3Bucket: selfieRecord?.fileBucket,
    documentS3Key: frontDocument?.fileKey,
    documentS3Bucket: frontDocument?.fileBucket ?? selfieRecord?.fileBucket,
    documentBackS3Key: backDocument?.fileKey,
    livenessSessionId: selfieRecord?.livenessSessionId ?? undefined,
  };

  // 5. Determine and run steps
  const stepNames = getStepsForService(session.service, session.tier);
  let flagForReview = false;

  for (const stepName of stepNames) {
    const stepFn = STEP_FN[stepName];
    let result: StepResult;

    try {
      result = await stepFn(ctx);
    } catch (err) {
      result = {
        success: false,
        errorCode: "INTERNAL_ERROR",
        errorMessage:
          err instanceof Error ? err.message : "Unknown error in step",
      };
    }

    // Merge step output into context
    if (result.data) {
      if (result.data.extractedDob !== undefined) {
        ctx.extractedDob = result.data.extractedDob as string;
      }
      if (result.data.extractedCountry !== undefined) {
        ctx.extractedCountry = result.data.extractedCountry as string;
      }
      if (result.data.similarityScore !== undefined) {
        ctx.similarityScore = result.data.similarityScore as number;
      }
      if (result.data.livenessScore !== undefined) {
        ctx.livenessScore = result.data.livenessScore as number;
      }
      if (result.data.estimatedAge !== undefined) {
        ctx.estimatedAge = result.data.estimatedAge as number;
      }
      if (result.data.estimatedAgeConfidence !== undefined) {
        ctx.estimatedAgeConfidence =
          result.data.estimatedAgeConfidence as number;
      }
    }

    if (result.flagForReview) {
      flagForReview = true;
    }

    // Fail-fast on step failure
    if (!result.success) {
      await db
        .update(verificationSession)
        .set({
          status: "rejected",
          resultData: {
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
            failedStep: stepName,
          },
          completedAt: new Date(),
        })
        .where(eq(verificationSession.id, sessionId));

      await db.insert(sessionStatusHistory).values({
        sessionId,
        fromStatus: "processing",
        toStatus: "rejected",
        changedBy: "system",
        reason: `Step ${stepName} failed: ${result.errorMessage}`,
      });

      await purgeImages(ctx, allSelfies, allDocuments);

      // Deliver webhook notification (fire and forget)
      const { deliverWebhook } = await import("../webhooks");
      deliverWebhook(sessionId, "session.rejected").catch((err: unknown) => {
        console.error(`Webhook delivery error for session ${sessionId}:`, err);
      });
      return;
    }
  }

  // 6. All steps passed — determine final status
  const finalStatus = flagForReview ? "in_review" : "approved";

  const resultData: Record<string, unknown> = {};
  if (ctx.similarityScore !== undefined)
    resultData.similarityScore = ctx.similarityScore;
  if (ctx.livenessScore !== undefined)
    resultData.livenessScore = ctx.livenessScore;
  if (ctx.extractedDob !== undefined) resultData.extractedDob = ctx.extractedDob;
  if (ctx.extractedCountry !== undefined)
    resultData.extractedCountry = ctx.extractedCountry;
  if (ctx.estimatedAge !== undefined)
    resultData.estimatedAge = ctx.estimatedAge;
  if (ctx.estimatedAgeConfidence !== undefined)
    resultData.estimatedAgeConfidence = ctx.estimatedAgeConfidence;

  await db
    .update(verificationSession)
    .set({
      status: finalStatus,
      resultData,
      completedAt: new Date(),
    })
    .where(eq(verificationSession.id, sessionId));

  await db.insert(sessionStatusHistory).values({
    sessionId,
    fromStatus: "processing",
    toStatus: finalStatus,
    changedBy: "system",
    reason: flagForReview
      ? "Pipeline completed — flagged for manual review"
      : "Pipeline completed — all checks passed",
  });

  // Update selfie record with scores
  if (selfieRecord) {
    const selfieUpdate: Record<string, unknown> = {};
    if (ctx.similarityScore !== undefined) {
      selfieUpdate.similarityScore = String(ctx.similarityScore);
    }
    if (ctx.livenessScore !== undefined) {
      selfieUpdate.livenessScore = String(ctx.livenessScore);
    }
    if (Object.keys(selfieUpdate).length > 0) {
      await db
        .update(selfie)
        .set(selfieUpdate)
        .where(eq(selfie.id, selfieRecord.id));
    }
  }

  // Update document extractedData with DOB + country
  if (frontDocument && (ctx.extractedDob || ctx.extractedCountry)) {
    const extractedData: Record<string, unknown> = {
      ...((frontDocument.extractedData as Record<string, unknown>) ?? {}),
    };
    if (ctx.extractedDob) extractedData.dateOfBirth = ctx.extractedDob;
    if (ctx.extractedCountry) extractedData.country = ctx.extractedCountry;

    await db
      .update(document)
      .set({ extractedData })
      .where(eq(document.id, frontDocument.id));
  }

  // Purge images from S3
  await purgeImages(ctx, allSelfies, allDocuments);

  // Deliver webhook notification (fire and forget)
  const webhookEvent =
    finalStatus === "approved"
      ? "session.approved"
      : "session.needs_resubmission";
  const { deliverWebhook } = await import("../webhooks");
  deliverWebhook(sessionId, webhookEvent).catch((err: unknown) => {
    console.error(`Webhook delivery error for session ${sessionId}:`, err);
  });
}

// ---------------------------------------------------------------------------
// Image purge helper
// ---------------------------------------------------------------------------

async function purgeImages(
  ctx: PipelineContext,
  selfieRecords: (typeof selfie.$inferSelect)[],
  documentRecords: (typeof document.$inferSelect)[],
): Promise<void> {
  const keys: string[] = [];

  if (ctx.selfieS3Key) keys.push(ctx.selfieS3Key);
  if (ctx.documentS3Key) keys.push(ctx.documentS3Key);
  if (ctx.documentBackS3Key) keys.push(ctx.documentBackS3Key);

  if (keys.length > 0) {
    await deleteTempBatch(keys);
  }

  const now = new Date();

  // Mark selfie records as purged
  for (const rec of selfieRecords) {
    await db
      .update(selfie)
      .set({ purgedAt: now })
      .where(eq(selfie.id, rec.id));
  }

  // Mark document records as purged
  for (const rec of documentRecords) {
    await db
      .update(document)
      .set({ purgedAt: now })
      .where(eq(document.id, rec.id));
  }
}
