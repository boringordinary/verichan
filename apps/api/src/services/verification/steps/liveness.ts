import { GetFaceLivenessSessionResultsCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export async function checkLiveness(ctx: PipelineContext): Promise<StepResult> {
  if (!ctx.livenessSessionId) {
    return {
      success: false,
      errorCode: "LIVENESS_FAILED",
      errorMessage: "No liveness session ID provided",
    };
  }

  const result = await rekognitionClient.send(
    new GetFaceLivenessSessionResultsCommand({
      SessionId: ctx.livenessSessionId,
    }),
  );

  const confidence = result.Confidence ?? 0;

  if (confidence < config.minLivenessScore) {
    return {
      success: false,
      errorCode: "LIVENESS_FAILED",
      errorMessage: `Liveness confidence ${confidence.toFixed(1)} below threshold ${config.minLivenessScore}`,
    };
  }

  return { success: true, data: { livenessScore: confidence } };
}
