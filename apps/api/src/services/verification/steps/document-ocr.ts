import { AnalyzeIDCommand } from "@aws-sdk/client-textract";
import { textractClient } from "../../../aws/clients";
import type { PipelineContext, StepResult } from "../pipeline";

export async function extractIdData(
  ctx: PipelineContext,
): Promise<StepResult> {
  if (!ctx.documentS3Key || !ctx.documentS3Bucket) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: "No document uploaded",
    };
  }

  const documentPages = [
    {
      S3Object: {
        Bucket: ctx.documentS3Bucket,
        Name: ctx.documentS3Key,
      },
    },
  ];

  if (ctx.documentBackS3Key) {
    documentPages.push({
      S3Object: {
        Bucket: ctx.documentS3Bucket,
        Name: ctx.documentBackS3Key,
      },
    });
  }

  const result = await textractClient.send(
    new AnalyzeIDCommand({ DocumentPages: documentPages }),
  );

  const identityDocuments = result.IdentityDocuments ?? [];
  if (identityDocuments.length === 0) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: "Could not parse identity document",
    };
  }

  const fields = identityDocuments[0].IdentityDocumentFields ?? [];
  const fieldMap = new Map<string, { value: string; confidence: number }>();

  for (const field of fields) {
    const key = field.Type?.Text;
    const value = field.ValueDetection?.Text;
    const confidence = field.ValueDetection?.Confidence ?? 0;
    if (key && value) {
      fieldMap.set(key, { value, confidence });
    }
  }

  const dob = fieldMap.get("DATE_OF_BIRTH");
  const expiry = fieldMap.get("EXPIRATION_DATE");
  const country = fieldMap.get("COUNTRY");

  if (!dob) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: "Could not extract date of birth from document",
    };
  }

  if (expiry) {
    const expiryDate = new Date(expiry.value);
    if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
      return {
        success: false,
        errorCode: "ID_EXPIRED",
        errorMessage: "Identity document has expired",
      };
    }
  }

  const lowConfidence = dob.confidence < 80;

  return {
    success: true,
    flagForReview: lowConfidence,
    data: {
      extractedDob: dob.value,
      extractedCountry: country?.value,
    },
  };
}
