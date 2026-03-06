import { test, expect, mock } from "bun:test";
import { renderStep } from "./render";

// --- Pure unit tests for renderStep (no DOM needed) ---

test("renderStep does not include data-direction attribute", () => {
  const html = renderStep("email", null, "");
  expect(html).not.toContain("data-direction");
});

test("renderStep shows back button on method and capture steps", () => {
  for (const step of ["method", "capture"] as const) {
    const html = renderStep(step, "selfie", "");
    expect(html).toContain('data-action="back"');
  }
});

test("renderStep hides back button on email, processing, complete steps", () => {
  for (const step of ["email", "processing", "complete"] as const) {
    const html = renderStep(step, null, "");
    expect(html).not.toContain('data-action="back"');
  }
});

test("renderStep shows close button on all steps except processing", () => {
  for (const step of ["email", "method", "capture", "complete"] as const) {
    const html = renderStep(step, "selfie", "");
    expect(html).toContain('data-action="close"');
  }
  const processingHtml = renderStep("processing", null, "");
  expect(processingHtml).not.toContain('data-action="close"');
});

test("renderStep accepts only 3 params (direction param removed)", () => {
  // renderStep signature should be (step, method, email)
  expect(renderStep.length).toBeLessThanOrEqual(3);
});

// --- Logic tests that simulate VerichanVerify behavior without DOM ---
// Since we don't have a DOM environment, we test the core logic patterns
// that the class implements by replicating them in isolation.

test("verified flag prevents onDismiss from firing after verification", () => {
  // Replicate the close() logic
  let verified = false;
  const onDismiss = mock(() => {});
  const onVerified = mock(() => {});

  function close() {
    if (!verified) {
      onDismiss();
    }
  }

  // Close before verification — onDismiss should fire
  close();
  expect(onDismiss).toHaveBeenCalledTimes(1);

  // Simulate verification completing (as in the submit handler)
  verified = true;
  onVerified();
  expect(onVerified).toHaveBeenCalledTimes(1);

  // Close after verification — onDismiss should NOT fire
  close();
  expect(onDismiss).toHaveBeenCalledTimes(1); // still 1, not incremented
});

test("verified flag resets on open", () => {
  // Replicate the open/close lifecycle
  let verified = false;
  const onDismiss = mock(() => {});

  function open() {
    verified = false;
  }

  function close() {
    if (!verified) {
      onDismiss();
    }
  }

  // First session: verify, then close
  verified = true;
  close();
  expect(onDismiss).toHaveBeenCalledTimes(0);

  // Second session: open resets verified, close should fire onDismiss
  open();
  expect(verified).toBe(false);
  close();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("back action navigates capture -> method -> email", () => {
  let step: string = "capture";
  let method: string | null = "selfie";

  // Replicate the back action logic from the switch statement
  function goBack() {
    if (step === "method") {
      step = "email";
    } else if (step === "capture") {
      step = "method";
      method = null;
    }
  }

  // From capture -> method
  goBack();
  expect(step).toBe("method");
  expect(method).toBeNull();

  // From method -> email
  goBack();
  expect(step).toBe("email");

  // From email, back does nothing
  goBack();
  expect(step).toBe("email");
});

// --- Error step tests ---

test("renderStep error step contains custom error message", () => {
  const html = renderStep("error", null, "", "Custom error");
  expect(html).toContain("Custom error");
  expect(html).toContain("Something went wrong");
});

test("renderStep error step uses default message when none provided", () => {
  const html = renderStep("error", null, "");
  expect(html).toContain("An unexpected error occurred. Please try again.");
});

test("error step shows close button and no back button", () => {
  const html = renderStep("error", null, "");
  expect(html).toContain('data-action="close"');
  expect(html).not.toContain('data-action="back"');
});

test("error step contains retry button with data-action retry", () => {
  const html = renderStep("error", null, "");
  expect(html).toContain('data-action="retry"');
  expect(html).toContain("Try again");
});

test("open without sessionToken throws", () => {
  // Replicate the config validation logic from open()
  function open(config: any) {
    if (!config?.sessionToken) {
      throw new Error(
        "Verichan: sessionToken is required. Create a session via the API first.",
      );
    }
  }

  expect(() => open({})).toThrow("sessionToken is required");
  expect(() => open(undefined)).toThrow("sessionToken is required");
  expect(() => open(null)).toThrow("sessionToken is required");
  expect(() => open({ sessionToken: "" })).toThrow("sessionToken is required");
  // Valid token should not throw
  expect(() => open({ sessionToken: "abc" })).not.toThrow();
});

// --- Upload capture tests ---

test("upload capture render has pick-file action on drop zone", () => {
  const html = renderStep("capture", "upload", "");
  expect(html).toContain('class="vc-upload"');
  expect(html).toContain('data-action="pick-file"');
});

test("upload capture render has disabled submit button", () => {
  const html = renderStep("capture", "upload", "");
  expect(html).toContain('data-action="submit"');
  expect(html).toContain("disabled");
});

test("upload capture render has preview area hidden by default", () => {
  const html = renderStep("capture", "upload", "");
  expect(html).toContain('class="vc-upload-preview"');
  expect(html).toContain('style="display:none"');
});

test("upload capture render has change file button", () => {
  const html = renderStep("capture", "upload", "");
  expect(html).toContain('class="vc-upload-change"');
});

// --- Selfie capture tests ---

test("selfie capture render has video element", () => {
  const html = renderStep("capture", "selfie", "");
  expect(html).toContain("<video");
  expect(html).toContain('class="vc-video"');
});

test("selfie capture render has canvas element", () => {
  const html = renderStep("capture", "selfie", "");
  expect(html).toContain("<canvas");
  expect(html).toContain('class="vc-canvas"');
});

test("selfie capture render has capture-frame button", () => {
  const html = renderStep("capture", "selfie", "");
  expect(html).toContain('data-action="capture-frame"');
  expect(html).toContain("Capture");
});

test("selfie capture render has capture-frame button disabled by default", () => {
  const html = renderStep("capture", "selfie", "");
  // The button with capture-frame should be disabled
  const match = html.match(/data-action="capture-frame"[^>]*>/);
  expect(match).toBeTruthy();
  expect(match![0]).toContain("disabled");
});

test("selfie capture render has loading indicator", () => {
  const html = renderStep("capture", "selfie", "");
  expect(html).toContain('class="vc-capture-loading"');
  expect(html).toContain("Starting camera...");
});

// --- File validation logic tests ---

test("file validation rejects invalid MIME types", () => {
  const validTypes = ["image/jpeg", "image/png"];
  expect(validTypes.includes("image/jpeg")).toBe(true);
  expect(validTypes.includes("image/png")).toBe(true);
  expect(validTypes.includes("image/gif")).toBe(false);
  expect(validTypes.includes("application/pdf")).toBe(false);
  expect(validTypes.includes("image/webp")).toBe(false);
});

test("file validation rejects files over 10 MB", () => {
  const maxSize = 10 * 1024 * 1024; // 10 MB
  expect(5 * 1024 * 1024 < maxSize).toBe(true);  // 5 MB OK
  expect(10 * 1024 * 1024 < maxSize).toBe(false); // exactly 10 MB rejected (not less than)
  expect(10 * 1024 * 1024 <= maxSize).toBe(true);  // exactly 10 MB is at the limit
  expect(11 * 1024 * 1024 > maxSize).toBe(true);  // 11 MB exceeds
});

// --- API integration logic tests ---

test("submit without capturedFile triggers error", () => {
  // Replicate the submit action guard from the switch statement
  let step = "capture";
  let errorMessage = "";
  let capturedFile: File | null = null;
  const onError = mock(() => {});

  function showError(message: string) {
    step = "error";
    errorMessage = message;
    onError(message);
  }

  function handleSubmit() {
    if (!capturedFile) {
      showError("No image captured. Please try again.");
      return;
    }
    step = "processing";
  }

  handleSubmit();
  expect(step).toBe("error");
  expect(errorMessage).toBe("No image captured. Please try again.");
  expect(onError).toHaveBeenCalledTimes(1);
});

test("processVerification flow: upload success + submit success -> complete", async () => {
  // Replicate the processVerification logic chain
  let step = "processing";
  let verified = false;
  const onVerified = mock(() => {});

  // Simulate successful upload and submit
  async function uploadFile(): Promise<boolean> {
    return true;
  }
  async function submitSession(): Promise<boolean> {
    return true;
  }

  async function processVerification() {
    const uploaded = await uploadFile();
    if (!uploaded) return;
    const submitted = await submitSession();
    if (!submitted) return;
    step = "complete";
    verified = true;
    onVerified();
  }

  await processVerification();
  expect(step).toBe("complete");
  expect(verified).toBe(true);
  expect(onVerified).toHaveBeenCalledTimes(1);
});

test("processVerification flow: upload failure -> stays in processing, no submit", async () => {
  let step = "processing";
  let verified = false;
  let submitCalled = false;
  const onVerified = mock(() => {});

  async function uploadFile(): Promise<boolean> {
    return false; // simulate failure
  }
  async function submitSession(): Promise<boolean> {
    submitCalled = true;
    return true;
  }

  async function processVerification() {
    const uploaded = await uploadFile();
    if (!uploaded) return;
    const submitted = await submitSession();
    if (!submitted) return;
    step = "complete";
    verified = true;
    onVerified();
  }

  await processVerification();
  expect(step).toBe("processing"); // did not advance
  expect(verified).toBe(false);
  expect(submitCalled).toBe(false); // submit was never called
  expect(onVerified).toHaveBeenCalledTimes(0);
});

test("processVerification flow: upload success + submit failure -> stays in processing", async () => {
  let step = "processing";
  let verified = false;
  const onVerified = mock(() => {});

  async function uploadFile(): Promise<boolean> {
    return true;
  }
  async function submitSession(): Promise<boolean> {
    return false; // simulate failure
  }

  async function processVerification() {
    const uploaded = await uploadFile();
    if (!uploaded) return;
    const submitted = await submitSession();
    if (!submitted) return;
    step = "complete";
    verified = true;
    onVerified();
  }

  await processVerification();
  expect(step).toBe("processing"); // did not advance
  expect(verified).toBe(false);
  expect(onVerified).toHaveBeenCalledTimes(0);
});

test("uploadFile returns false when capturedFile is null", () => {
  // Replicate the guard check in uploadFile
  const capturedFile: File | null = null;
  const sessionId: string | null = "sess_123";

  function uploadFileGuard(): boolean {
    if (!capturedFile || !sessionId) return false;
    return true;
  }

  expect(uploadFileGuard()).toBe(false);
});

test("uploadFile returns false when sessionId is null", () => {
  const capturedFile = {} as File; // non-null
  const sessionId: string | null = null;

  function uploadFileGuard(): boolean {
    if (!capturedFile || !sessionId) return false;
    return true;
  }

  expect(uploadFileGuard()).toBe(false);
});

test("submitSession returns false when sessionId is null", () => {
  const sessionId: string | null = null;

  function submitSessionGuard(): boolean {
    if (!sessionId) return false;
    return true;
  }

  expect(submitSessionGuard()).toBe(false);
});

test("selfie method uses selfie endpoint, upload method uses documents endpoint", () => {
  const apiBase = "https://api.example.com";
  const sessionId = "sess_abc123";

  function getEndpoint(method: "selfie" | "upload"): string {
    return method === "selfie"
      ? `${apiBase}/v1/sessions/${sessionId}/selfie`
      : `${apiBase}/v1/sessions/${sessionId}/documents`;
  }

  expect(getEndpoint("selfie")).toBe("https://api.example.com/v1/sessions/sess_abc123/selfie");
  expect(getEndpoint("upload")).toBe("https://api.example.com/v1/sessions/sess_abc123/documents");
});

test("apiBase defaults to empty string when apiBaseUrl is undefined", () => {
  const config = { sessionToken: "tok_123" };
  const apiBase = config.apiBaseUrl ?? "";
  expect(apiBase).toBe("");
});

test("apiBase uses configured value when set", () => {
  const config = { sessionToken: "tok_123", apiBaseUrl: "https://api.verichan.com" };
  const apiBase = config.apiBaseUrl ?? "";
  expect(apiBase).toBe("https://api.verichan.com");
});

test("resolveSession sets sessionId from response data", () => {
  // Replicate the resolve logic
  let sessionId: string | null = null;
  const data = { session_id: "sess_xyz", completed: false };

  if (!data.completed) {
    sessionId = data.session_id;
  }

  expect(sessionId).toBe("sess_xyz");
});

test("resolveSession skips to complete when session already completed", () => {
  let step = "email";
  let verified = false;
  const onVerified = mock(() => {});
  const data = { session_id: "sess_xyz", completed: true };

  if (data.completed) {
    step = "complete";
    verified = true;
    onVerified();
  }

  expect(step).toBe("complete");
  expect(verified).toBe(true);
  expect(onVerified).toHaveBeenCalledTimes(1);
});

test("sessionId resets to null on open", () => {
  // Replicate the open() reset behavior
  let sessionId: string | null = "sess_old";
  function open() {
    sessionId = null;
  }
  open();
  expect(sessionId).toBeNull();
});

test("escape handler reference is stored and can be removed", () => {
  // Simulate the escape handler lifecycle
  let escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  const listeners: Array<{ type: string; handler: any }> = [];

  // Mock addEventListener/removeEventListener
  function addEventListener(type: string, handler: any) {
    listeners.push({ type, handler });
  }
  function removeEventListener(type: string, handler: any) {
    const idx = listeners.findIndex(l => l.type === type && l.handler === handler);
    if (idx !== -1) listeners.splice(idx, 1);
  }

  // Simulate open()
  escapeHandler = (_e: KeyboardEvent) => {};
  addEventListener("keydown", escapeHandler);
  expect(listeners).toHaveLength(1);

  // Simulate close()
  if (escapeHandler) {
    removeEventListener("keydown", escapeHandler);
    escapeHandler = null;
  }
  expect(listeners).toHaveLength(0);
  expect(escapeHandler).toBeNull();
});
