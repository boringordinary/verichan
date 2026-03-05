import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "./clients";
import { config } from "../lib/config";

export function generateTempKey(sessionId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const uniqueId = crypto.randomUUID();
  return `sessions/${sessionId}/${uniqueId}.${ext}`;
}

export function buildS3Ref(key: string) {
  return {
    Bucket: config.aws.s3TempBucket,
    Name: key,
  };
}

export async function uploadTemp(
  sessionId: string,
  fileName: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; bucket: string }> {
  const key = generateTempKey(sessionId, fileName);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.aws.s3TempBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, bucket: config.aws.s3TempBucket };
}

export async function deleteTemp(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.aws.s3TempBucket,
      Key: key,
    }),
  );
}

export async function deleteTempBatch(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: config.aws.s3TempBucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    }),
  );
}
