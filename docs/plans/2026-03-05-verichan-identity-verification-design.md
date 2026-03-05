# Verichan Identity & Age Verification Service Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build two verification services — Identity Verification and Age Verification — exposed through a versioned REST API with both server-to-server and hosted verification flow support.

**Architecture:** Elysia API with async processing pipeline. AWS Textract for document OCR, AWS Rekognition for face detection/comparison/liveness. Temporary S3 storage for images (auto-deleted within 1 hour). Provider-agnostic adapter layer for future provider swaps.

**Tech Stack:** Bun, Elysia, Drizzle ORM, PostgreSQL, AWS S3 (temporary image storage), AWS Textract (AnalyzeID), AWS Rekognition (DetectFaces, CompareFaces, FaceLiveness), Doppler (secrets)

**Cost:** ~$0.027 per identity verification (5 AWS API calls)

---

## Services

### Identity Verification

Confirms a person is who they claim to be.

1. User submits ID document photos (front, and back if applicable) + a selfie
2. System extracts document data via Textract AnalyzeID (name, DOB, document number, expiry, nationality)
3. Face comparison between document photo and selfie via Rekognition CompareFaces
4. Liveness detection confirms the selfie is a real person via Rekognition FaceLiveness
5. Low-confidence results get flagged for manual review
6. Result: `approved`, `rejected`, or `needs_resubmission`

### Age Verification — Two Tiers

- **Document-based (high assurance):** Extracts DOB from submitted ID, calculates age. Subset of identity verification flow.
- **Estimation-based (low assurance):** Selfie only, AI age estimation via Rekognition face attributes. No document required. Suitable for age-gating scenarios (e-commerce, social platforms).

---

## Session Flow

1. Client creates a session (server-to-server) specifying `service` and `tier`
2. Client receives a session token (for API integration) or a redirect URL (for hosted flow)
3. End user submits documents via client's frontend or verichan's hosted UI
4. verichan processes asynchronously: liveness check -> face detection -> OCR -> face comparison -> age calculation -> decision
5. Client receives results via webhook and/or polling

---

## API Endpoints

### Client Management (admin auth)

- `POST /v1/clients` — Create client
- `GET /v1/clients/:clientId` — Get client
- `POST /v1/clients/:clientId/api-keys` — Create API key pair
- `DELETE /v1/clients/:clientId/api-keys/:keyId` — Revoke API key

### Sessions (API key auth)

- `POST /v1/sessions` — Create session
  - Body: `{ service: "identity_verification" | "age_verification", tier: "document" | "estimation", redirect_url?, webhook_url?, metadata? }`
  - Returns: `{ session_id, token, hosted_url?, status: "created", expires_at }`
- `GET /v1/sessions` — List sessions (paginated, filterable)
- `GET /v1/sessions/:sessionId` — Get session
- `GET /v1/sessions/:sessionId/result` — Get verification result

### Verification Flow (session token auth)

- `POST /v1/sessions/:sessionId/liveness-session` — Initialize AWS liveness session, returns `{ liveness_session_id }`
- `POST /v1/sessions/:sessionId/documents` — Upload ID document (multipart, 5MB max, JPEG/PNG)
  - Body: `{ document_type, side: "front" | "back", file }`
- `POST /v1/sessions/:sessionId/selfie` — Upload selfie (multipart, 5MB max, JPEG/PNG)
- `POST /v1/sessions/:sessionId/submit` — Submit session for processing

### Hosted Flow (no auth, token in URL)

- `GET /v1/verify/:token` — Hosted verification UI

### Webhooks (delivered to client's configured URL)

- Events: `session.approved`, `session.rejected`, `session.needs_resubmission`, `session.expired`
- Signed with HMAC-SHA256 for payload authenticity

### Review (admin/reviewer auth)

- `GET /v1/reviews` — List pending reviews
- `GET /v1/reviews/:reviewId` — Get review details
- `POST /v1/reviews/:reviewId/decision` — Submit decision `{ decision, reason? }`
- `POST /v1/reviews/:reviewId/notes` — Add review note

---

## Data Model

### Enums

```
session_status: created, in_progress, submitted, processing, approved, rejected, needs_resubmission, expired, cancelled
step_status: pending, submitted, processing, approved, rejected, skipped
step_type: document, selfie, liveness
document_type: passport, drivers_license, national_id, residence_permit, other
service_type: identity_verification, age_verification
verification_tier: document, estimation
review_decision: approved, rejected, needs_resubmission
webhook_delivery_status: pending, delivered, failed, retrying
```

### Tables

**clients**
- `id`, `name`, `webhook_url?`, `created_at`, `updated_at`

**api_keys**
- `id`, `client_id` -> clients, `key_hash` (never store plaintext), `prefix` (first 8 chars for identification), `environment` (live/test), `is_active`, `last_used_at`, `created_at`, `revoked_at?`

**webhook_endpoints**
- `id`, `client_id` -> clients, `url`, `secret_hash`, `is_active`, `created_at`

**verification_sessions**
- `id`, `client_id` -> clients, `external_user_id?` (client's user reference), `service` (service_type enum), `tier` (verification_tier enum), `status`, `token` (unique, for hosted flow + upload auth), `redirect_url?`, `result_data` (JSONB — scores, decision metadata), `expires_at`, `submitted_at?`, `completed_at?`, `created_at`, `updated_at`

**verification_steps**
- `id`, `session_id` -> sessions, `step_type`, `status`, `order`, `provider_response` (JSONB — raw AWS response minus images), `error_code?`, `error_message?`, `created_at`, `updated_at`

**documents** (metadata only — no image storage)
- `id`, `step_id` -> steps, `document_type`, `side`, `file_key` (temporary S3 ref), `file_bucket`, `file_mime_type`, `file_size_bytes`, `extracted_data` (JSONB — DOB, document country, expiry only; no name/address/doc number), `purged_at`, `created_at`

**selfies** (metadata only)
- `id`, `step_id` -> steps, `file_key` (temporary S3 ref), `file_bucket`, `file_mime_type`, `file_size_bytes`, `capture_method`, `similarity_score` (decimal), `liveness_score` (decimal), `liveness_session_id` (AWS reference), `purged_at`, `created_at`

**reviews**
- `id`, `session_id` -> sessions, `reviewer_id?`, `decision`, `decision_reason?`, `assigned_at?`, `decided_at?`, `created_at`, `updated_at`

**review_notes**
- `id`, `review_id` -> reviews, `step_id?` -> steps, `author_id?`, `content`, `is_client_visible`, `created_at`

**session_status_history**
- `id`, `session_id` -> sessions, `from_status?`, `to_status`, `changed_by?`, `reason?`, `metadata` (JSONB), `created_at`

**webhook_deliveries**
- `id`, `webhook_endpoint_id` -> webhook_endpoints, `session_id` -> sessions, `event_type`, `status`, `payload` (JSONB), `response_status_code?`, `response_body?`, `attempt_count`, `max_attempts`, `next_retry_at?`, `last_attempt_at?`, `delivered_at?`, `created_at`

### Key Data Principles

- **No images stored permanently** — uploaded to temporary S3 bucket, deleted after processing. 1-hour lifecycle policy as safety net.
- **Minimal PII** — only DOB and document country stored in `extracted_data`. No names, addresses, or document numbers.
- **Scores on selfie record** — similarity and liveness scores stored for audit trail.
- **Provider responses stored sans images** — for debugging, stripped of binary data.
- **`purged_at` timestamp** on documents/selfies tracks when images were deleted from S3.

---

## Processing Pipeline

### File Structure

```
apps/api/src/
  services/
    verification/
      pipeline.ts          — Orchestrator, runs steps sequentially
      steps/
        liveness.ts        — AWS Rekognition liveness check
        face-detection.ts  — AWS Rekognition DetectFaces
        document-ocr.ts    — AWS Textract AnalyzeID
        face-comparison.ts — AWS Rekognition CompareFaces
        age-calculation.ts — Calculate age from DOB
        age-estimation.ts  — AI age estimation from selfie (estimation tier)
  aws/
    clients.ts             — Shared Textract + Rekognition clients (initialized once)
    s3.ts                  — Temp upload, delete, presigned URL generation
  lib/
    config.ts              — Env var thresholds
```

### Identity Verification Pipeline (document tier)

```
Step 1: getLivenessResults(livenessSessionId)
  -> confidence < 90 -> FAIL (LIVENESS_FAILED)

Step 2: detectFaces(selfie S3 ref)
  -> not exactly 1 face, or sunglasses, or eyes closed -> FAIL (FACE_NOT_DETECTED)

Step 3: analyzeId(document S3 ref, back S3 ref?)
  -> can't parse -> FAIL (ID_PARSE_FAILED)
  -> document expired -> FAIL (ID_EXPIRED)
  -> low confidence -> FLAG for manual review

Step 4: compareFaces(selfie S3 ref, document S3 ref)
  -> similarity < 90 -> FAIL (FACE_MISMATCH)

Step 5: calculateAge(extracted DOB)
  -> age < minimum -> FAIL (UNDERAGE)

Step 6: Write result to DB (scores, extracted DOB + country only)
Step 7: Delete images from S3, set purged_at
Step 8: Fire webhook
```

### Age Verification Pipeline (document tier)

Same as identity verification — identity verification is a superset. Session result focuses on the age assertion.

### Age Verification Pipeline (estimation tier)

```
Step 1: detectFaces(selfie S3 ref)
  -> validate single face

Step 2: estimateAge(selfie S3 ref)
  -> Rekognition face attributes age range + confidence
  -> estimated age >= threshold with high confidence -> APPROVE
  -> borderline -> FLAG for review
  -> clearly under -> REJECT

Step 3: Write result, delete image, fire webhook
```

### Pipeline Behavior

- **Fail-fast:** Each step checks previous result. First failure stops pipeline, records error code and step number, returns immediately. No wasted AWS API calls.
- **Concurrency control:** Semaphore or queue to limit concurrent pipeline executions. Prevents memory spikes from too many S3 uploads at once.
- **Rate limiting:** 5 attempts per `external_user_id` per 24 hours. Checked at `POST /v1/sessions` before processing begins. Already-verified users rejected with `ALREADY_VERIFIED`.

---

## Error Handling

Structured error responses:

```typescript
{
  success: false,
  error: {
    code: "LIVENESS_FAILED" | "FACE_NOT_DETECTED" | "FACE_MISMATCH"
        | "UNDERAGE" | "ID_PARSE_FAILED" | "ID_EXPIRED"
        | "RATE_LIMITED" | "ALREADY_VERIFIED" | "SESSION_EXPIRED"
        | "INVALID_FILE_TYPE" | "FILE_TOO_LARGE",
    message: string,
    step?: number
  }
}
```

---

## Security

- **API key auth** for client-to-server calls (hashed in DB, never stored plaintext)
- **Session token auth** for end-user upload endpoints (short-lived, scoped to one session)
- **File validation:** JPEG/PNG only, 5MB max, validate MIME type from bytes (not just extension)
- **No PII in logs** — log verification attempts, scores, step failures, but never image data, names, or document numbers
- **S3 bucket:** private, encrypted at rest (SSE-S3), no public access, CORS locked to your domain
- **Webhook signatures:** HMAC-SHA256 so clients can verify payload authenticity

---

## Configuration (Doppler-managed env vars)

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_TEMP_BUCKET=
MIN_SIMILARITY_SCORE=90
MIN_LIVENESS_SCORE=90
MIN_AGE=18
MAX_VERIFICATION_ATTEMPTS=5
VERIFICATION_EXPIRY_DAYS=365
SESSION_EXPIRY_MINUTES=30
```

---

## Out of Scope (MVP)

- Frontend client dashboard/portal (API + webhooks only for now)
- AML/sanctions screening (separate feature)
- Document tamper/authenticity detection (not available via these AWS APIs)
- Image CDN or permanent storage (images are temporary)
- Multi-language support (English-only MVP)
- Mobile SDKs (API-first, SDKs later)
