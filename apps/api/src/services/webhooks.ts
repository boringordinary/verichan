import { eq, and } from "drizzle-orm";
import { db } from "../database";
import { verificationSession } from "../database/schema/verification";
import { webhookEndpoint } from "../database/schema/client";
import { webhookDelivery } from "../database/schema/audit";

export async function signWebhookPayload(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function deliverWebhook(
  sessionId: string,
  eventType: string,
): Promise<void> {
  // Load session
  const [session] = await db
    .select()
    .from(verificationSession)
    .where(eq(verificationSession.id, sessionId))
    .limit(1);

  if (!session) {
    console.error(`deliverWebhook: session ${sessionId} not found`);
    return;
  }

  // Find webhook targets: session.webhookUrl + active webhookEndpoints for this org
  const endpoints = await db
    .select()
    .from(webhookEndpoint)
    .innerJoin(
      // Find endpoints belonging to the same organization.
      verificationSession,
      eq(verificationSession.organizationId, webhookEndpoint.organizationId),
    )
    .where(
      and(
        eq(verificationSession.id, sessionId),
        eq(webhookEndpoint.isActive, true),
      ),
    );

  // Gather all target URLs
  const targets: Array<{ url: string; secret?: string; endpointId?: string }> =
    [];

  // Add session-level webhook URL
  if (session.webhookUrl) {
    targets.push({ url: session.webhookUrl });
  }

  // Add registered webhook endpoints
  for (const ep of endpoints) {
    targets.push({
      url: ep.webhook_endpoint.url,
      secret: ep.webhook_endpoint.secretHash,
      endpointId: ep.webhook_endpoint.id,
    });
  }

  if (targets.length === 0) {
    return;
  }

  // Build payload
  const payload = JSON.stringify({
    event: eventType,
    session_id: session.id,
    status: session.status,
    result_data: session.resultData,
    timestamp: new Date().toISOString(),
  });

  // Deliver to each target
  for (const target of targets) {
    let deliveryId: string | undefined;

    try {
      // For session-level webhooks without an endpoint record, we still need
      // a webhookEndpointId. We create a delivery record only for registered
      // endpoints, or skip recording for ad-hoc session webhooks.
      if (target.endpointId) {
        const [delivery] = await db
          .insert(webhookDelivery)
          .values({
            webhookEndpointId: target.endpointId,
            sessionId,
            eventType,
            payload: JSON.parse(payload),
            status: "pending",
          })
          .returning();
        deliveryId = delivery.id;
      }

      // Sign payload if secret is available
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (target.secret) {
        const signature = await signWebhookPayload(payload, target.secret);
        headers["X-Webhook-Signature"] = signature;
      }

      // POST with 10s timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(target.url, {
        method: "POST",
        headers,
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseBody = await response.text().catch(() => "");

      // Update delivery record with response
      if (deliveryId) {
        await db
          .update(webhookDelivery)
          .set({
            status: response.ok ? "delivered" : "failed",
            responseStatusCode: response.status,
            responseBody,
            attemptCount: 1,
            lastAttemptAt: new Date(),
            deliveredAt: response.ok ? new Date() : undefined,
          })
          .where(eq(webhookDelivery.id, deliveryId));
      }
    } catch (err) {
      console.error(
        `Webhook delivery failed for ${target.url}:`,
        err instanceof Error ? err.message : err,
      );

      // Update delivery record with failure
      if (deliveryId) {
        await db
          .update(webhookDelivery)
          .set({
            status: "failed",
            responseBody:
              err instanceof Error ? err.message : "Unknown error",
            attemptCount: 1,
            lastAttemptAt: new Date(),
          })
          .where(eq(webhookDelivery.id, deliveryId));
      }
    }
  }
}
