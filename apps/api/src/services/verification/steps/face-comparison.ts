import { CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export async function compareFaces(
  ctx: PipelineContext,
): Promise<StepResult> {
  if (!ctx.selfieS3Key || !ctx.selfieS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: "No selfie available",
    };
  }

  if (!ctx.documentS3Key || !ctx.documentS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: "No document available",
    };
  }

  const result = await rekognitionClient.send(
    new CompareFacesCommand({
      SourceImage: {
        S3Object: {
          Bucket: ctx.selfieS3Bucket,
          Name: ctx.selfieS3Key,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: ctx.documentS3Bucket,
          Name: ctx.documentS3Key,
        },
      },
      SimilarityThreshold: 0,
    }),
  );

  const matches = result.FaceMatches ?? [];
  if (matches.length === 0) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: "No matching face found",
    };
  }

  const similarity = matches[0].Similarity ?? 0;

  if (similarity < config.minSimilarityScore) {
    return {
      success: false,
      errorCode: "FACE_MISMATCH",
      errorMessage: `Similarity ${similarity.toFixed(1)} below threshold ${config.minSimilarityScore}`,
    };
  }

  return { success: true, data: { similarityScore: similarity } };
}
