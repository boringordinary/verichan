import { DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "../../../aws/clients";
import type { PipelineContext, StepResult } from "../pipeline";

export async function detectFaces(
  ctx: PipelineContext,
): Promise<StepResult> {
  if (!ctx.selfieS3Key || !ctx.selfieS3Bucket) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "No selfie uploaded",
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
      errorMessage: "No face detected in selfie",
    };
  }

  if (faces.length > 1) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Multiple faces detected — exactly one required",
    };
  }

  const face = faces[0];

  if (
    face.Sunglasses?.Value === true &&
    (face.Sunglasses.Confidence ?? 0) > 80
  ) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Sunglasses detected — please remove",
    };
  }

  if (
    face.EyesOpen?.Value === false &&
    (face.EyesOpen.Confidence ?? 0) > 80
  ) {
    return {
      success: false,
      errorCode: "FACE_NOT_DETECTED",
      errorMessage: "Eyes appear closed",
    };
  }

  return { success: true };
}
