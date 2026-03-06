import {
  shieldIcon,
  closeIcon,
  backIcon,
  cameraIcon,
  uploadIcon,
  personIcon,
  imageIcon,
  checkIcon,
  mailIcon,
  globeIcon,
} from "./icons";

export type Step = "email" | "already-verified" | "consent" | "method" | "capture" | "processing" | "complete";

const smallCheck = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

function stepDots(current: number): string {
  return `<div class="vc-steps">${
    [0, 1, 2].map(i => {
      const cls = i < current ? "is-done" : i === current ? "is-active" : "";
      return `<div class="vc-dot ${cls}"></div>`;
    }).join("")
  }</div>`;
}

function topbar(showBack: boolean, showClose: boolean): string {
  return `
    <div class="vc-topbar">
      ${showBack ? `<button class="vc-back" data-action="back">${backIcon}</button>` : `<div></div>`}
      ${showClose ? `<button class="vc-close" data-action="close">${closeIcon}</button>` : `<div></div>`}
    </div>`;
}

function footer(): string {
  return `
    <div class="vc-footer">
      <div class="vc-brand">
        ${shieldIcon}
        <span>verichan</span>
      </div>
    </div>`;
}

function emailBody(email: string): string {
  const escaped = email.replace(/"/g, "&quot;");
  return `
    <div class="vc-body">
      <div class="vc-email-icon">${mailIcon}</div>
      <div class="vc-title">Enter your email</div>
      <div class="vc-subtitle">Your email links your verification across Verichan sites — verify once, access everywhere.</div>
      <div class="vc-email-field">
        <input type="email" class="vc-email-input" placeholder="you@example.com" data-input="email" value="${escaped}" autocomplete="email" />
      </div>
      <button class="vc-btn-primary" data-action="check-email">Continue</button>
      <div class="vc-footnote">We'll never send you marketing emails.</div>
    </div>`;
}

function alreadyVerifiedBody(): string {
  return `
    <div class="vc-body">
      <div class="vc-complete">
        <div class="vc-check">${checkIcon}</div>
        <div class="vc-complete-title">Already verified</div>
        <div class="vc-complete-text">This email has already been verified.</div>
        <div class="vc-complete-note">No further action needed — you're all set.</div>
        <button class="vc-btn-ghost" data-action="done">Done</button>
      </div>
    </div>`;
}

function consentBody(): string {
  return `
    <div class="vc-body">
      ${stepDots(0)}
      <div class="vc-title">Verify your identity</div>
      <div class="vc-subtitle">A quick one-time check with your photo ID.</div>
      <div class="vc-features">
        <div class="vc-feature">
          ${smallCheck}
          <span>Takes about 30 seconds</span>
        </div>
        <div class="vc-feature">
          ${smallCheck}
          <span>Images are never stored</span>
        </div>
        <div class="vc-feature">
          ${smallCheck}
          <span>Only your age is confirmed</span>
        </div>
        <div class="vc-feature">
          ${globeIcon}
          <span>Works across all Verichan sites</span>
        </div>
      </div>
      <button class="vc-btn-primary" data-action="method">Continue</button>
      <div class="vc-footnote">Your data is processed securely and discarded immediately.</div>
    </div>`;
}

function methodBody(): string {
  return `
    <div class="vc-body">
      ${stepDots(1)}
      <div class="vc-title">How would you like to verify?</div>
      <div class="vc-subtitle">Choose the option that works best for you.</div>
      <div class="vc-methods">
        <button class="vc-method" data-action="selfie">
          <div class="vc-method-icon">${cameraIcon}</div>
          <div>
            <div class="vc-method-label">Recommended</div>
            <div class="vc-method-title">Selfie with your ID</div>
            <div class="vc-method-desc">Use your camera to capture your face and ID together</div>
          </div>
        </button>
        <button class="vc-method" data-action="upload">
          <div class="vc-method-icon">${uploadIcon}</div>
          <div>
            <div class="vc-method-title">Upload a photo</div>
            <div class="vc-method-desc">Upload an existing photo of your ID from your device</div>
          </div>
        </button>
      </div>
    </div>`;
}

function captureBody(method: "selfie" | "upload"): string {
  if (method === "selfie") {
    return `
      <div class="vc-body">
        ${stepDots(2)}
        <div class="vc-title">Hold your ID next to your face</div>
        <div class="vc-subtitle">Make sure both are clearly visible.</div>
        <div class="vc-capture">
          <div class="vc-capture-viewport">
            <div class="vc-face-guide">${personIcon}</div>
            <div class="vc-capture-hint">Position yourself in the frame</div>
          </div>
          <div class="vc-capture-footer">Good lighting helps verify faster</div>
        </div>
        <button class="vc-btn-primary" data-action="submit">Capture</button>
      </div>`;
  }
  return `
    <div class="vc-body">
      ${stepDots(2)}
      <div class="vc-title">Upload your ID</div>
      <div class="vc-subtitle">Make sure all details are clearly visible.</div>
      <div class="vc-upload" data-action="submit">
        ${imageIcon}
        <div class="vc-upload-title">Drag and drop or click to upload</div>
        <div class="vc-upload-hint">JPG or PNG, max 10 MB</div>
      </div>
      <button class="vc-btn-primary" data-action="submit">Submit</button>
    </div>`;
}

function processingBody(): string {
  return `
    <div class="vc-body">
      <div class="vc-processing">
        <div class="vc-spinner"></div>
        <div class="vc-processing-title">Verifying your identity</div>
        <div class="vc-processing-hint">This usually takes a few seconds</div>
      </div>
    </div>`;
}

function completeBody(): string {
  return `
    <div class="vc-body">
      <div class="vc-complete">
        <div class="vc-check">${checkIcon}</div>
        <div class="vc-complete-title">Verified</div>
        <div class="vc-complete-text">You won't need to verify again on any Verichan site.</div>
        <div class="vc-complete-note">All uploaded data has been permanently discarded.</div>
        <button class="vc-btn-ghost" data-action="done">Done</button>
      </div>
    </div>`;
}

export function renderStep(step: Step, method: "selfie" | "upload" | null, email: string = ""): string {
  let body: string;
  switch (step) {
    case "email": body = emailBody(email); break;
    case "already-verified": body = alreadyVerifiedBody(); break;
    case "consent": body = consentBody(); break;
    case "method": body = methodBody(); break;
    case "capture": body = captureBody(method ?? "upload"); break;
    case "processing": body = processingBody(); break;
    case "complete": body = completeBody(); break;
  }

  const showClose = step !== "processing";
  const showBack = step === "consent" || step === "method" || step === "capture";

  return `
    <div class="vc-modal">
      ${topbar(showBack, showClose)}
      <div class="vc-scroll">
        ${body}
      </div>
      ${footer()}
    </div>`;
}
