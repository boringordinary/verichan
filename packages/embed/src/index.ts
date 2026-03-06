import { css } from "./styles";
import { renderStep, type Step } from "./render";

export interface VerichanConfig {
  /** Session token from the API. Required. */
  sessionToken: string;
  /** Base URL for the Verichan API. Defaults to relative path. */
  apiBaseUrl?: string;
  /** Callback when verification completes successfully */
  onVerified?: () => void;
  /** Callback when the user dismisses the modal */
  onDismiss?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Check if an email is already verified. Return true if verified. */
  onCheckEmail?: (email: string) => Promise<boolean> | boolean;
}

class VerichanVerify {
  private shadow: ShadowRoot | null = null;
  private host: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private config: VerichanConfig = {} as VerichanConfig;
  private step: Step = "email";
  private method: "selfie" | "upload" | null = null;
  private email: string = "";
  private verified: boolean = false;
  private errorMessage: string = "";
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private capturedFile: File | null = null;
  private mediaStream: MediaStream | null = null;

  open(config: VerichanConfig) {
    if (!config?.sessionToken) {
      throw new Error(
        "Verichan: sessionToken is required. Create a session via the API first.",
      );
    }

    this.config = config;
    this.step = "email";
    this.method = null;
    this.email = "";
    this.verified = false;
    this.errorMessage = "";
    this.capturedFile = null;

    if (!this.host) {
      this.host = document.createElement("div");
      this.host.id = "verichan-root";
      this.shadow = this.host.attachShadow({ mode: "closed" });

      const style = document.createElement("style");
      style.textContent = css;
      this.shadow.appendChild(style);

      this.overlay = document.createElement("div");
      this.overlay.className = "vc-overlay";
      this.overlay.setAttribute("role", "dialog");
      this.overlay.setAttribute("aria-modal", "true");
      this.overlay.setAttribute("aria-label", "Identity verification");
      this.shadow.appendChild(this.overlay);

      // Close on backdrop click
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) this.close();
      });

      // Handle modal actions via event delegation.
      this.overlay.addEventListener(
        "click",
        (e) => {
          const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
          if (!target) return;

          const action = target.dataset.action;
          switch (action) {
            case "close":
              this.close();
              break;
            case "back":
              if (this.step === "method") {
                this.step = "email";
              } else if (this.step === "capture") {
                this.step = "method";
                this.method = null;
              }
              this.render();
              break;
            case "check-email":
              this.handleCheckEmail();
              break;
            case "method":
              this.step = "method";
              this.render();
              break;
            case "selfie":
              this.method = "selfie";
              this.step = "capture";
              this.render();
              break;
            case "upload":
              this.method = "upload";
              this.step = "capture";
              this.render();
              break;
            case "pick-file":
              this.openFilePicker();
              break;
            case "capture-frame":
              this.captureFrame();
              break;
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
            case "retry":
              this.step = "capture";
              this.errorMessage = "";
              this.render();
              break;
            case "done":
              this.close();
              break;
          }
        },
        { capture: true },
      );

      // Submit email on Enter key
      this.overlay.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && this.step === "email") {
          e.preventDefault();
          this.handleCheckEmail();
        }
      });

      document.body.appendChild(this.host);
    }

    // Register escape handler (re-register on each open since close() removes it)
    if (!this.escapeHandler) {
      this.escapeHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape" && this.step !== "processing") this.close();
      };
      document.addEventListener("keydown", this.escapeHandler);
    }

    this.render();
    this.overlay!.setAttribute("aria-hidden", "false");

    // Focus the email input after render
    requestAnimationFrame(() => {
      const input = this.overlay?.querySelector<HTMLInputElement>('[data-input="email"]');
      input?.focus();
    });
  }

  close() {
    this.stopCamera();
    if (this.overlay) {
      this.overlay.setAttribute("aria-hidden", "true");
    }
    if (this.escapeHandler) {
      document.removeEventListener("keydown", this.escapeHandler);
      this.escapeHandler = null;
    }
    if (!this.verified) {
      this.config.onDismiss?.();
    }
  }

  destroy() {
    this.stopCamera();
    if (this.escapeHandler) {
      document.removeEventListener("keydown", this.escapeHandler);
      this.escapeHandler = null;
    }
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.overlay = null;
  }

  private async handleCheckEmail() {
    const input = this.overlay?.querySelector<HTMLInputElement>('[data-input="email"]');
    if (!input) return;

    const value = input.value.trim();
    if (!value || !value.includes("@")) return;

    this.email = value;

    if (this.config.onCheckEmail) {
      try {
        const alreadyVerified = await this.config.onCheckEmail(value);
        if (alreadyVerified) {
          this.step = "already-verified";
          this.render();
          return;
        }
      } catch {
        // If check fails, proceed to verification flow
      }
    }

    this.step = "method";
    this.render();
  }

  private showError(message: string) {
    this.step = "error";
    this.errorMessage = message;
    this.render();
    this.config.onError?.(message);
  }

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
    const submitBtn = this.overlay?.querySelector<HTMLButtonElement>("[data-action='submit']");
    if (preview && dropZone && img && submitBtn) {
      const url = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(url);
      img.src = url;
      dropZone.style.display = "none";
      preview.style.display = "block";
      submitBtn.removeAttribute("disabled");
    }
  }

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
      for (const track of this.mediaStream.getTracks()) track.stop();
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
        video.style.display = "none";
        canvas.style.display = "block";
        // Change capture button to submit
        const captureBtn = this.overlay?.querySelector<HTMLButtonElement>("[data-action='capture-frame']");
        if (captureBtn) {
          captureBtn.textContent = "Submit";
          captureBtn.dataset.action = "submit";
        }
      }
    }, "image/jpeg", 0.92);
  }

  private render() {
    if (!this.overlay) return;
    this.stopCamera();

    this.overlay.innerHTML = renderStep(this.step, this.method, this.email, this.errorMessage);

    if (this.step === "capture" && this.method === "selfie") {
      this.startCamera();
    }
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
}

// Singleton
const verichan = new VerichanVerify();

// Expose as global
declare global {
  interface Window {
    Verichan: typeof verichan;
  }
}

window.Verichan = verichan;

export default verichan;
