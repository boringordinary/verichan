function envInt(key: string, fallback: number): number {
  const val = Bun.env[key];
  return val ? parseInt(val, 10) : fallback;
}

function envStr(key: string, fallback: string): string {
  return Bun.env[key] ?? fallback;
}

export const config = {
  minSimilarityScore: envInt("MIN_SIMILARITY_SCORE", 90),
  minLivenessScore: envInt("MIN_LIVENESS_SCORE", 90),
  minAge: envInt("MIN_AGE", 18),
  maxVerificationAttempts: envInt("MAX_VERIFICATION_ATTEMPTS", 5),
  verificationExpiryDays: envInt("VERIFICATION_EXPIRY_DAYS", 365),
  sessionExpiryMinutes: envInt("SESSION_EXPIRY_MINUTES", 30),
  maxFileSizeBytes: envInt("MAX_FILE_SIZE_BYTES", 5 * 1024 * 1024),
  aws: {
    region: envStr("AWS_REGION", "us-east-1"),
    s3TempBucket: envStr("AWS_S3_TEMP_BUCKET", "verichan-temp"),
    accessKeyId: Bun.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: Bun.env.AWS_SECRET_ACCESS_KEY,
  },
} as const;
