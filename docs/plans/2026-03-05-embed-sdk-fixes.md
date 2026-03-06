# Embed SDK Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all issues identified in REVIEW.md — wire up real API integration, implement image capture, add error handling, fix memory leaks, and clean up dead code.

**Architecture:** The embed SDK (`packages/embed`) is a zero-dependency vanilla JS widget using closed Shadow DOM. It communicates with the API at `/v1/sessions/:sessionId/*` endpoints using session tokens (Bearer auth). The SDK receives a `sessionToken` from the host page (created server-side), uses it to upload images, submit for processing, then poll for results.

**Tech Stack:** TypeScript, Bun (build + test), Shadow DOM, getUserMedia API, Fetch API

---

## Overview of Tasks

| # | Task | Priority |
|---|------|----------|
| 1 | Fix quick bugs: escape leak, onDismiss/onVerified, back action, dead code | High |
| 2 | Add error step to render pipeline | High |
| 3 | Add config validation and sessionToken support | High |
| 4 | Add destroy() method | Medium |
| 5 | Implement file upload capture (input + drag/drop) | High |
| 6 | Implement selfie camera capture (getUserMedia) | High |
| 7 | Wire up API integration (upload → submit → poll) | Critical |
| 8 | Add explicit build target | Low |

---

### Task 1: Fix Quick Bugs — Escape Leak, onDismiss/onVerified, Back Action, Dead Code

**Files:**
- Modify: `packages/embed/src/index.ts`
- Modify: `packages/embed/src/render.ts`
- Test: `packages/embed/src/index.test.ts`

**Step 1: Write tests for the bugs**

Create `packages/embed/src/index.test.ts`:

```ts
import { test, expect, beforeEach, afterEach, mock } from "bun:test";

// We need to set up a minimal DOM environment since this runs in Bun
// Bun has built-in DOM support via happy-dom when running tests

beforeEach(() => {
  // Clean up any existing verichan root
  document.getElementById("verichan-root")?.remove();
});

afterEach(() => {
  document.getElementById("verichan-root")?.remove();
});

test("close() does not fire onDismiss after verification completes", async () => {
  // Fresh import to get clean singleton
  const { default: verichan } = await import("./index");

  const onDismiss = mock(() => {});
  const onVerified = mock(() => {});

  verichan.open({
    sessionToken: "test-token",
    onVerified,
    onDismiss,
  });

  // Simulate verification completed
  // @ts-expect-error - accessing private for test
  verichan.step = "complete";
  // @ts-expect-error - accessing private for test
  verichan.verified = true;

  verichan.close();

  expect(onDismiss).not.toHaveBeenCalled();
});

test("back action navigates to previous step", async () => {
  const { default: verichan } = await import("./index");

  verichan.open({ sessionToken: "test-token" });

  // Move to method step
  // @ts-expect-error - accessing private for test
  verichan.step = "method";
  // @ts-expect-error - accessing private for test
  verichan.render();

  // Simulate back action — should go to consent
  // @ts-expect-error - accessing private for test
  verichan.step = "consent";

  // @ts-expect-error - accessing private for test
  expect(verichan.step).toBe("consent");
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/embed && bun test src/index.test.ts`
Expected: FAIL — `verified` property doesn't exist, tests will error

**Step 3: Fix the bugs in index.ts**

Apply these changes to `packages/embed/src/index.ts`:

1. Add `verified` flag and escape listener reference:
```ts
private verified = false;
private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
```

2. Store and manage escape listener:
```ts
// In open(), replace lines 93-95:
this.escapeHandler = (e: KeyboardEvent) => {
  if (e.key === "Escape" && this.step !== "processing") this.close();
};
document.addEventListener("keydown", this.escapeHandler);
```

3. Reset `verified` in `open()`:
```ts
this.verified = false;
```

4. Set `verified = true` in the submit action handler (where `onVerified` fires):
```ts
case "submit":
  this.step = "processing";
  this.render();
  setTimeout(() => {
    this.step = "complete";
    this.verified = true;
    this.render();
    this.config.onVerified?.();
  }, 2400);
  break;
```

5. Guard `onDismiss` in `close()`:
```ts
close() {
  if (this.overlay) {
    this.overlay.setAttribute("aria-hidden", "true");
  }
  if (!this.verified) {
    this.config.onDismiss?.();
  }
}
```

6. Add `back` case to the action switch:
```ts
case "back":
  if (this.step === "capture") {
    this.step = "method";
  } else if (this.step === "method") {
    this.step = "consent";
  }
  this.render();
  break;
```

7. Remove unused `direction` param from `renderStep` in `render.ts:154`:
```ts
export function renderStep(step: Step, method: "selfie" | "upload" | null): string {
```
Also remove the `Direction` type export and `data-direction` attribute from the modal div.

8. Remove `clientId` from `VerichanConfig`.

**Step 4: Run tests to verify they pass**

Run: `cd packages/embed && bun test src/index.test.ts`
Expected: PASS

**Step 5: Build to verify no regressions**

Run: `cd packages/embed && bun run build`
Expected: builds successfully

**Step 6: Commit**

```bash
git add packages/embed/src/index.ts packages/embed/src/render.ts packages/embed/src/index.test.ts
git commit -m "fix(embed): escape listener leak, onDismiss guard, back action, dead code cleanup"
```

---

### Task 2: Add Error Step to Render Pipeline

**Files:**
- Modify: `packages/embed/src/render.ts`
- Modify: `packages/embed/src/index.ts`

**Step 1: Add error step type and render function**

In `render.ts`, update the `Step` type:
```ts
export type Step = "consent" | "method" | "capture" | "processing" | "complete" | "error";
```

Add error body render function:
```ts
function errorBody(message: string): string {
  return `
    <div class="vc-body">
      <div class="vc-error">
        <div class="vc-error-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
        </div>
        <div class="vc-error-title">Something went wrong</div>
        <div class="vc-error-text">${message}</div>
        <button class="vc-btn-primary" data-action="retry">Try again</button>
        <button class="vc-btn-ghost" data-action="close">Close</button>
      </div>
    </div>`;
}
```

Update `renderStep` to accept an optional `errorMessage` and handle the error case:
```ts
export function renderStep(step: Step, method: "selfie" | "upload" | null, errorMessage?: string): string {
  let body: string;
  switch (step) {
    case "consent": body = consentBody(); break;
    case "method": body = methodBody(); break;
    case "capture": body = captureBody(method ?? "upload"); break;
    case "processing": body = processingBody(); break;
    case "complete": body = completeBody(); break;
    case "error": body = errorBody(errorMessage ?? "An unexpected error occurred. Please try again."); break;
  }

  const showClose = step !== "processing";
  const showBack = step === "method" || step === "capture";

  return `
    <div class="vc-modal">
      ${topbar(showBack, showClose)}
      <div class="vc-scroll">
        ${body}
      </div>
    </div>`;
}
```

Update `stepIndex` to handle error:
```ts
function stepIndex(step: Step): number {
  switch (step) {
    case "consent": return 0;
    case "method": return 1;
    case "capture":
    case "processing": return 2;
    case "complete": return 3;
    case "error": return -1;
  }
}
```

**Step 2: Add error styles to styles.ts**

Append to the CSS in `styles.ts`:
```css
/* -- Error -- */

.vc-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
}

.vc-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.07);
  border: 1px solid rgba(239, 68, 68, 0.18);
}

.vc-error-icon svg {
  width: 28px;
  height: 28px;
  color: #ef4444;
}

.vc-error-title {
  margin-top: 20px;
  color: var(--vc-text);
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.vc-error-text {
  margin-top: 6px;
  color: var(--vc-text-2);
  font-size: 15px;
  line-height: 1.5;
  max-width: 280px;
}

.vc-error .vc-btn-primary {
  max-width: 200px;
  margin-top: 28px;
}

.vc-error .vc-btn-ghost {
  max-width: 200px;
}
```

**Step 3: Wire error state and retry in index.ts**

Add `errorMessage` property to the class:
```ts
private errorMessage = "";
```

Add `retry` action to the switch:
```ts
case "retry":
  // Go back to the capture step to retry
  this.step = "capture";
  this.errorMessage = "";
  this.render();
  break;
```

Update `showError` helper method:
```ts
private showError(message: string) {
  this.step = "error";
  this.errorMessage = message;
  this.render();
  this.config.onError?.(message);
}
```

Update the `render()` call:
```ts
private render() {
  if (!this.overlay) return;
  this.overlay.innerHTML = renderStep(this.step, this.method, this.errorMessage);
}
```

**Step 4: Build and verify**

Run: `cd packages/embed && bun run build`
Expected: builds successfully

**Step 5: Commit**

```bash
git add packages/embed/src/render.ts packages/embed/src/styles.ts packages/embed/src/index.ts
git commit -m "feat(embed): add error step with retry support"
```

---

### Task 3: Add Config Validation and sessionToken Support

**Files:**
- Modify: `packages/embed/src/index.ts`

**Step 1: Update VerichanConfig interface**

Replace the config interface:
```ts
export interface VerichanConfig {
  /** Session token created server-side via POST /v1/sessions */
  sessionToken: string;
  /** API base URL (defaults to relative path) */
  apiBaseUrl?: string;
  /** Callback when verification completes successfully */
  onVerified?: () => void;
  /** Callback when the user dismisses the modal */
  onDismiss?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}
```

**Step 2: Add validation in open()**

At the top of `open()`, before any DOM work:
```ts
open(config: VerichanConfig) {
  if (!config?.sessionToken) {
    throw new Error("Verichan: sessionToken is required. Create a session via the API first.");
  }

  this.config = config;
  this.step = "consent";
  this.method = null;
  this.verified = false;
  this.errorMessage = "";
  // ... rest of open()
}
```

Remove the default `= {}` parameter since `sessionToken` is now required.

**Step 3: Build and verify**

Run: `cd packages/embed && bun run build`
Expected: builds successfully

**Step 4: Update demo.html**

Update the demo to pass a sessionToken:
```html
<button onclick="Verichan.open({ sessionToken: 'demo-token', onVerified: () => console.log('verified!') })">
  Verify Age
</button>
```

**Step 5: Commit**

```bash
git add packages/embed/src/index.ts packages/embed/demo.html
git commit -m "feat(embed): require sessionToken, add config validation"
```

---

### Task 4: Add destroy() Method

**Files:**
- Modify: `packages/embed/src/index.ts`

**Step 1: Add destroy method**

After the `close()` method:
```ts
destroy() {
  if (this.escapeHandler) {
    document.removeEventListener("keydown", this.escapeHandler);
    this.escapeHandler = null;
  }
  this.host?.remove();
  this.host = null;
  this.shadow = null;
  this.overlay = null;
}
```

**Step 2: Build and verify**

Run: `cd packages/embed && bun run build`
Expected: builds successfully

**Step 3: Commit**

```bash
git add packages/embed/src/index.ts
git commit -m "feat(embed): add destroy() method for SPA cleanup"
```

---

### Task 5: Implement File Upload Capture

**Files:**
- Modify: `packages/embed/src/index.ts`
- Modify: `packages/embed/src/render.ts`

This adds a hidden `<input type="file">` and drag/drop handlers to the upload flow. The captured `File` is stored on the class instance for later API submission.

**Step 1: Add file storage to the class**

In `index.ts`, add to class properties:
```ts
private capturedFile: File | null = null;
```

Reset it in `open()`:
```ts
this.capturedFile = null;
```

**Step 2: Update upload render to include hidden file input**

In `render.ts`, update the upload branch of `captureBody`:
```ts
// Upload branch
return `
  <div class="vc-body">
    ${stepDots(2)}
    <div class="vc-title">Upload your ID</div>
    <div class="vc-subtitle">Make sure all details are clearly visible.</div>
    <div class="vc-upload" data-action="pick-file">
      ${imageIcon}
      <div class="vc-upload-title">Drag and drop or click to upload</div>
      <div class="vc-upload-hint">JPG or PNG, max 10 MB</div>
    </div>
    <div class="vc-upload-preview" style="display:none">
      <img class="vc-upload-img" />
      <button class="vc-upload-change" data-action="pick-file">Change file</button>
    </div>
    <button class="vc-btn-primary" data-action="submit" disabled>Submit</button>
  </div>`;
```

**Step 3: Add upload preview styles to styles.ts**

```css
.vc-upload-preview {
  margin-top: 24px;
  border-radius: 18px;
  border: 1px solid var(--vc-border);
  background: #fff;
  overflow: hidden;
  text-align: center;
}

.vc-upload-img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.vc-upload-change {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  border-top: 1px solid var(--vc-border);
  background: transparent;
  color: var(--vc-text-2);
  font-size: 13px;
  cursor: pointer;
}

.vc-upload-change:hover {
  background: var(--vc-surface);
  color: var(--vc-text);
}
```

**Step 4: Add file handling logic in index.ts**

Add a method to handle file selection:
```ts
private handleFile(file: File) {
  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    this.showError("Only JPEG and PNG files are accepted.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    this.showError("File size exceeds 10 MB limit.");
    return;
  }

  this.capturedFile = file;

  // Show preview
  const preview = this.overlay?.querySelector<HTMLElement>(".vc-upload-preview");
  const dropZone = this.overlay?.querySelector<HTMLElement>(".vc-upload");
  const img = this.overlay?.querySelector<HTMLImageElement>(".vc-upload-img");
  const submitBtn = this.overlay?.querySelector<HTMLButtonElement>(".vc-btn-primary");

  if (preview && dropZone && img && submitBtn) {
    const url = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(url);
    img.src = url;
    dropZone.style.display = "none";
    preview.style.display = "block";
    submitBtn.removeAttribute("disabled");
  }
}
```

Add a method to open file picker:
```ts
private openFilePicker() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png";
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) this.handleFile(file);
  };
  input.click();
}
```

In the event delegation switch, add `pick-file` action and drag/drop setup:
```ts
case "pick-file":
  this.openFilePicker();
  break;
```

After rendering capture step, set up drag/drop if upload method. Add to `render()`:
```ts
private render() {
  if (!this.overlay) return;
  this.overlay.innerHTML = renderStep(this.step, this.method, this.errorMessage);

  // Set up drag/drop for upload
  if (this.step === "capture" && this.method === "upload") {
    const dropZone = this.overlay.querySelector<HTMLElement>(".vc-upload");
    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--vc-accent-border)";
        dropZone.style.background = "var(--vc-accent-soft)";
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "";
        dropZone.style.background = "";
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "";
        dropZone.style.background = "";
        const file = e.dataTransfer?.files[0];
        if (file) this.handleFile(file);
      });
    }
  }
}
```

**Step 5: Add disabled button style to styles.ts**

```css
.vc-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vc-btn-primary:disabled:hover {
  background: var(--vc-accent);
}
```

**Step 6: Build and verify**

Run: `cd packages/embed && bun run build`
Expected: builds successfully

**Step 7: Commit**

```bash
git add packages/embed/src/index.ts packages/embed/src/render.ts packages/embed/src/styles.ts
git commit -m "feat(embed): implement file upload with drag/drop, preview, and validation"
```

---

### Task 6: Implement Selfie Camera Capture

**Files:**
- Modify: `packages/embed/src/index.ts`
- Modify: `packages/embed/src/render.ts`

**Step 1: Update selfie render to include video element**

In `render.ts`, update the selfie branch of `captureBody`:
```ts
if (method === "selfie") {
  return `
    <div class="vc-body">
      ${stepDots(2)}
      <div class="vc-title">Hold your ID next to your face</div>
      <div class="vc-subtitle">Make sure both are clearly visible.</div>
      <div class="vc-capture">
        <div class="vc-capture-viewport">
          <video class="vc-video" autoplay playsinline muted></video>
          <canvas class="vc-canvas" style="display:none"></canvas>
          <div class="vc-capture-loading">
            <div class="vc-spinner"></div>
            <div class="vc-capture-hint">Starting camera...</div>
          </div>
        </div>
        <div class="vc-capture-footer">Good lighting helps verify faster</div>
      </div>
      <button class="vc-btn-primary" data-action="capture-frame" disabled>Capture</button>
    </div>`;
}
```

**Step 2: Add video/canvas styles to styles.ts**

```css
.vc-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vc-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vc-capture-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--vc-surface);
}
```

**Step 3: Add camera methods to index.ts**

Add a stream reference:
```ts
private mediaStream: MediaStream | null = null;
```

Add camera start/stop methods:
```ts
private async startCamera() {
  const video = this.overlay?.querySelector<HTMLVideoElement>(".vc-video");
  const loading = this.overlay?.querySelector<HTMLElement>(".vc-capture-loading");
  const captureBtn = this.overlay?.querySelector<HTMLButtonElement>("[data-action='capture-frame']");

  if (!video) return;

  try {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = this.mediaStream;
    await video.play();
    loading?.remove();
    captureBtn?.removeAttribute("disabled");
  } catch (err) {
    this.showError(
      err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera access was denied. Please allow camera access and try again."
        : "Could not access camera. Please try the upload option instead."
    );
  }
}

private stopCamera() {
  if (this.mediaStream) {
    for (const track of this.mediaStream.getTracks()) {
      track.stop();
    }
    this.mediaStream = null;
  }
}

private captureFrame() {
  const video = this.overlay?.querySelector<HTMLVideoElement>(".vc-video");
  const canvas = this.overlay?.querySelector<HTMLCanvasElement>(".vc-canvas");
  if (!video || !canvas) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0);
  this.stopCamera();

  canvas.toBlob((blob) => {
    if (blob) {
      this.capturedFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      // Show the canvas (frozen frame), hide video
      video.style.display = "none";
      canvas.style.display = "block";
      // Enable submit
      const captureBtn = this.overlay?.querySelector<HTMLButtonElement>("[data-action='capture-frame']");
      if (captureBtn) {
        captureBtn.textContent = "Submit";
        captureBtn.dataset.action = "submit";
      }
    }
  }, "image/jpeg", 0.92);
}
```

**Step 4: Wire up actions in the event delegation switch**

```ts
case "capture-frame":
  this.captureFrame();
  break;
```

**Step 5: Start camera after rendering selfie step**

In the `render()` method, after the drag/drop setup block:
```ts
// Start camera for selfie
if (this.step === "capture" && this.method === "selfie") {
  this.startCamera();
}
```

**Step 6: Stop camera on step change**

At the top of `render()`, before setting innerHTML:
```ts
private render() {
  if (!this.overlay) return;
  this.stopCamera(); // Stop camera if switching away from selfie
  this.overlay.innerHTML = renderStep(this.step, this.method, this.errorMessage);
  // ... post-render setup
}
```

Also stop camera in `close()` and `destroy()`.

**Step 7: Build and test manually with demo.html**

Run: `cd packages/embed && bun run build`
Expected: builds successfully. Open demo.html, select selfie, verify camera starts.

**Step 8: Commit**

```bash
git add packages/embed/src/index.ts packages/embed/src/render.ts packages/embed/src/styles.ts
git commit -m "feat(embed): implement selfie camera capture with getUserMedia"
```

---

### Task 7: Wire Up API Integration

**Files:**
- Modify: `packages/embed/src/index.ts`

This is the critical task. Replace the fake 2400ms timeout with real API calls.

**Step 1: Add API helper methods to the class**

```ts
private get apiBase(): string {
  return this.config.apiBaseUrl ?? "";
}

private get sessionId(): string | null {
  return this._sessionId;
}

// Add to class properties:
private _sessionId: string | null = null;
```

Add a method to resolve the session token to a session ID:
```ts
private async resolveSession(): Promise<boolean> {
  try {
    const res = await fetch(`${this.apiBase}/v1/verify/${this.config.sessionToken}`);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (res.status === 410) {
        this.showError("This verification session has expired.");
      } else {
        this.showError(data?.error?.message ?? "Could not load verification session.");
      }
      return false;
    }
    const { data } = await res.json();
    if (data.completed) {
      this.step = "complete";
      this.verified = true;
      this.render();
      this.config.onVerified?.();
      return false;
    }
    this._sessionId = data.session_id;
    return true;
  } catch {
    this.showError("Network error. Please check your connection and try again.");
    return false;
  }
}
```

Add a method to upload the captured file:
```ts
private async uploadFile(): Promise<boolean> {
  if (!this.capturedFile || !this._sessionId) return false;

  const token = this.config.sessionToken;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    // Upload as selfie (age_verification/estimation tier uses selfie only)
    const formData = new FormData();
    formData.append("file", this.capturedFile);

    const res = await fetch(
      `${this.apiBase}/v1/sessions/${this._sessionId}/selfie`,
      { method: "POST", headers, body: formData },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      this.showError(data?.error?.message ?? "Failed to upload image.");
      return false;
    }
    return true;
  } catch {
    this.showError("Network error during upload. Please try again.");
    return false;
  }
}

private async submitSession(): Promise<boolean> {
  if (!this._sessionId) return false;

  const token = this.config.sessionToken;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const res = await fetch(
      `${this.apiBase}/v1/sessions/${this._sessionId}/submit`,
      { method: "POST", headers },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      this.showError(data?.error?.message ?? "Failed to submit for verification.");
      return false;
    }
    return true;
  } catch {
    this.showError("Network error during submission. Please try again.");
    return false;
  }
}
```

**Step 2: Replace the fake submit handler**

Replace the `case "submit":` block:
```ts
case "submit":
  if (!this.capturedFile) {
    this.showError("No image captured. Please try again.");
    break;
  }
  this.step = "processing";
  this.render();
  this.processVerification();
  break;
```

Add the async processing method:
```ts
private async processVerification() {
  const uploaded = await this.uploadFile();
  if (!uploaded) return; // showError already called

  const submitted = await this.submitSession();
  if (!submitted) return; // showError already called

  this.step = "complete";
  this.verified = true;
  this.render();
  this.config.onVerified?.();
}
```

**Step 3: Resolve session on open**

In `open()`, after DOM setup and initial render, resolve the session:
```ts
// At the end of open():
this.render();
this.overlay!.setAttribute("aria-hidden", "false");

// Resolve session in background
this.resolveSession();
```

**Step 4: Update retry to go back to capture**

The retry action from Task 2 already goes back to `capture`, which is correct — user can re-capture and re-submit.

**Step 5: Build and verify**

Run: `cd packages/embed && bun run build`
Expected: builds successfully

**Step 6: Commit**

```bash
git add packages/embed/src/index.ts
git commit -m "feat(embed): wire up real API integration with session resolution, upload, and submission"
```

---

### Task 8: Add Explicit Build Target

**Files:**
- Modify: `packages/embed/package.json`

**Step 1: Update build script**

```json
{
  "scripts": {
    "build": "bun build src/index.ts --outfile dist/verichan.js --minify --target=browser",
    "dev": "bun build src/index.ts --outfile dist/verichan.js --watch --target=browser"
  }
}
```

**Step 2: Build and verify output**

Run: `cd packages/embed && bun run build`
Expected: builds successfully with browser target

**Step 3: Commit**

```bash
git add packages/embed/package.json
git commit -m "build(embed): set explicit browser target for SDK bundle"
```

---

## Final State

After all tasks, `packages/embed/src/index.ts` will have:

- `sessionToken` required in config (validated on `open()`)
- `resolveSession()` validates token via `/v1/verify/:token`
- `startCamera()` / `captureFrame()` for selfie flow
- `openFilePicker()` / `handleFile()` with drag/drop for upload flow
- `uploadFile()` POSTs captured image to API
- `submitSession()` triggers backend processing pipeline
- `processVerification()` orchestrates upload → submit → complete
- Error step with retry
- `destroy()` for SPA teardown
- Escape listener properly managed
- `onDismiss` / `onVerified` mutually exclusive
- Back navigation working
- No dead code (`clientId`, `direction`)
