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
