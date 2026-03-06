import { css } from "./styles";
import { renderStep, type Step } from "./render";

export interface VerichanConfig {
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
  private config: VerichanConfig = {};
  private step: Step = "email";
  private method: "selfie" | "upload" | null = null;
  private email: string = "";
  private verified: boolean = false;
  private errorMessage: string = "";
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;

  open(config: VerichanConfig = {}) {
    this.config = config;
    this.step = "email";
    this.method = null;
    this.email = "";
    this.verified = false;

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

  private render() {
    if (!this.overlay) return;

    this.overlay.innerHTML = renderStep(this.step, this.method, this.email, this.errorMessage);
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
