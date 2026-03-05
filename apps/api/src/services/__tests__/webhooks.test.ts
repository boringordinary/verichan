import { test, expect } from "bun:test";
import { signWebhookPayload } from "../webhooks";

test("signWebhookPayload produces consistent HMAC", async () => {
  const sig1 = await signWebhookPayload('{"a":1}', "secret");
  const sig2 = await signWebhookPayload('{"a":1}', "secret");
  expect(sig1).toBe(sig2);
});

test("signWebhookPayload different payloads produce different sigs", async () => {
  const sig1 = await signWebhookPayload('{"a":1}', "secret");
  const sig2 = await signWebhookPayload('{"a":2}', "secret");
  expect(sig1).not.toBe(sig2);
});
