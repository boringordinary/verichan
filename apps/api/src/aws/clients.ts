import { S3Client } from "@aws-sdk/client-s3";
import { TextractClient } from "@aws-sdk/client-textract";
import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { config } from "../lib/config";

const clientConfig = {
  region: config.aws.region,
  ...(config.aws.accessKeyId && config.aws.secretAccessKey
    ? {
        credentials: {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        },
      }
    : {}),
};

export const s3Client = new S3Client(clientConfig);
export const textractClient = new TextractClient(clientConfig);
export const rekognitionClient = new RekognitionClient(clientConfig);
