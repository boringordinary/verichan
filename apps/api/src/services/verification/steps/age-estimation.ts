import { DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export async function estimateAge(
  ctx: PipelineContext,
): Promise<StepResult> {
  if (!ctx.selfieS3Key || !ctx.selfieS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No selfie for age estimation",
    };
  }

  const result = await rekognitionClient.send(
    new DetectFacesCommand({
      Image: {
        S3Object: { Bucket: ctx.selfieS3Bucket, Name: ctx.selfieS3Key },
      },
      Attributes: ["ALL"],
    }),
  );

  const faces = result.FaceDetails ?? [];
  if (faces.length === 0) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No face detected",
    };
  }

  const face = faces[0];
  const ageRange = face.AgeRange;

  if (
    !ageRange ||
    ageRange.Low === undefined ||
    ageRange.High === undefined
  ) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Could not estimate age",
    };
  }

  const estimatedAge = Math.floor((ageRange.Low + ageRange.High) / 2);
  const confidence = face.Confidence ?? 0;

  if (ageRange.High < config.minAge) {
    return {
      success: false,
      errorCode: "UNDERAGE",
      errorMessage: `Estimated age range ${ageRange.Low}-${ageRange.High} below minimum ${config.minAge}`,
    };
  }

  const borderline = ageRange.Low < config.minAge;

  return {
    success: true,
    flagForReview: borderline,
    data: { estimatedAge, estimatedAgeConfidence: confidence },
  };
}
