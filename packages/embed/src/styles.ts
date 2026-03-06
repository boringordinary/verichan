export const css = /* css */ `
  :host {
    all: initial;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color-scheme: dark;
    --vc-bg: #110e19;
    --vc-surface: #1a1625;
    --vc-surface-hover: #231e30;
    --vc-border: #272238;
    --vc-border-strong: #342d47;
    --vc-text: #ddd8e8;
    --vc-text-2: #9890a8;
    --vc-text-3: #6b6380;
    --vc-accent: #b991ff;
    --vc-accent-hover: #c9a8ff;
    --vc-accent-soft: rgba(185, 145, 255, 0.08);
    --vc-accent-border: rgba(185, 145, 255, 0.20);
    --vc-success: #9cd11f;
    --vc-success-soft: rgba(156, 209, 31, 0.10);
    --vc-success-border: rgba(156, 209, 31, 0.22);
    --vc-ease: cubic-bezier(0.4, 0, 0.2, 1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  button, input { font: inherit; }

  /* ── Overlay ── */

  .vc-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: vc-fade 0.2s var(--vc-ease) both;
  }

  .vc-overlay[aria-hidden="true"] { display: none; }

  @keyframes vc-fade { from { opacity: 0; } }

  /* ── Modal ── */

  .vc-modal {
    position: relative;
    width: min(100%, 560px);
    height: min(90vh, 820px);
    display: flex;
    flex-direction: column;
    border-radius: 24px;
    background: var(--vc-bg);
    box-shadow:
      0 25px 60px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px var(--vc-border);
    animation: vc-lift 0.3s var(--vc-ease) both;
    overflow: hidden;
  }

  @keyframes vc-lift {
    from {
      opacity: 0;
      transform: scale(0.97) translateY(10px);
    }
  }

  /* ── Top bar ── */

  .vc-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    flex-shrink: 0;
  }

  /* ── Footer (brand) ── */

  .vc-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px 22px;
    flex-shrink: 0;
    border-top: 1px solid var(--vc-border);
  }

  .vc-brand {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--vc-text-3);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .vc-brand svg {
    width: 15px;
    height: 15px;
    color: var(--vc-accent);
    opacity: 0.7;
  }

  /* ── Back ── */

  .vc-back {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--vc-border);
    border-radius: 10px;
    background: transparent;
    color: var(--vc-text-3);
    cursor: pointer;
    transition: all 0.15s var(--vc-ease);
    animation: vc-back-in 0.2s var(--vc-ease) both;
  }

  .vc-back:hover {
    color: var(--vc-text-2);
    border-color: var(--vc-border-strong);
    background: var(--vc-surface);
  }

  .vc-back:active { transform: scale(0.95); }

  .vc-back svg {
    width: 16px;
    height: 16px;
    transition: transform 0.15s var(--vc-ease);
  }

  .vc-back:hover svg {
    transform: translateX(-2px);
  }

  @keyframes vc-back-in {
    from { opacity: 0; transform: translateX(-4px); }
  }

  /* ── Close ── */

  .vc-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--vc-border);
    border-radius: 10px;
    background: transparent;
    color: var(--vc-text-3);
    cursor: pointer;
    transition: all 0.15s var(--vc-ease);
  }

  .vc-close:hover {
    color: var(--vc-text-2);
    border-color: var(--vc-border-strong);
    background: var(--vc-surface);
  }

  .vc-close svg { width: 14px; height: 14px; }

  /* ── Scrollable content area ── */

  .vc-scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── Body (centered content column) ── */

  .vc-body {
    width: 100%;
    max-width: 400px;
    margin: auto;
    padding: 0 28px 36px;
    text-align: center;
    animation: vc-content-in 0.25s var(--vc-ease) both;
  }

  @keyframes vc-content-in {
    from { opacity: 0; transform: translateX(12px); }
  }

  /* ── Step dots ── */

  .vc-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 32px;
  }

  .vc-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--vc-border-strong);
    transition: all 0.3s var(--vc-ease);
  }

  .vc-dot.is-active {
    background: var(--vc-accent);
    box-shadow: 0 0 0 3px var(--vc-accent-soft);
  }

  .vc-dot.is-done {
    background: var(--vc-accent);
    opacity: 0.4;
  }

  /* ── Titles ── */

  .vc-title {
    color: var(--vc-text);
    font-size: 22px;
    font-weight: 650;
    letter-spacing: -0.025em;
    line-height: 1.2;
  }

  .vc-subtitle {
    margin-top: 8px;
    color: var(--vc-text-2);
    font-size: 15px;
    line-height: 1.55;
  }

  /* ── Email step ── */

  .vc-email-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  .vc-email-icon svg {
    width: 40px;
    height: 40px;
    color: var(--vc-accent);
    opacity: 0.6;
  }

  .vc-email-field {
    margin-top: 28px;
  }

  .vc-email-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid var(--vc-border);
    border-radius: 12px;
    background: var(--vc-surface);
    color: var(--vc-text);
    font-size: 15px;
    outline: none;
    transition: all 0.15s var(--vc-ease);
  }

  .vc-email-input::placeholder {
    color: var(--vc-text-3);
  }

  .vc-email-input:focus {
    border-color: var(--vc-accent);
    box-shadow: 0 0 0 3px var(--vc-accent-soft);
  }

  /* ── Feature list (consent step) ── */

  .vc-features {
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 28px;
    text-align: left;
  }

  .vc-feature {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 10px;
    background: var(--vc-surface);
  }

  .vc-feature svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--vc-accent);
  }

  .vc-feature span {
    color: var(--vc-text-2);
    font-size: 14px;
    line-height: 1.4;
  }

  /* ── Buttons ── */

  .vc-btn-primary {
    display: block;
    width: 100%;
    margin-top: 32px;
    padding: 14px 20px;
    border: none;
    border-radius: 14px;
    background: var(--vc-accent);
    color: var(--vc-bg);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s var(--vc-ease);
  }

  .vc-btn-primary:hover {
    background: var(--vc-accent-hover);
  }

  .vc-btn-primary:active { transform: scale(0.98); }

  .vc-btn-ghost {
    display: block;
    width: 100%;
    margin-top: 12px;
    padding: 14px 20px;
    border: 1px solid var(--vc-border);
    border-radius: 14px;
    background: transparent;
    color: var(--vc-text-2);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s var(--vc-ease);
  }

  .vc-btn-ghost:hover {
    border-color: var(--vc-border-strong);
    background: var(--vc-surface);
    color: var(--vc-text);
  }

  .vc-btn-ghost:active { transform: scale(0.98); }

  .vc-footnote {
    margin-top: 16px;
    color: var(--vc-text-3);
    font-size: 12px;
    line-height: 1.5;
  }

  .vc-footnote a {
    color: var(--vc-text-2);
    text-decoration: underline;
    text-decoration-color: var(--vc-border);
    text-underline-offset: 2px;
  }

  /* ── Method cards ── */

  .vc-methods {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 28px;
    text-align: left;
  }

  .vc-method {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 18px;
    border-radius: 16px;
    border: 1px solid var(--vc-border);
    background: var(--vc-surface);
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s var(--vc-ease);
  }

  .vc-method:hover {
    border-color: var(--vc-border-strong);
    background: var(--vc-surface-hover);
  }

  .vc-method:active { transform: scale(0.99); }

  .vc-method-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 14px;
    background: var(--vc-bg);
  }

  .vc-method-icon svg {
    width: 22px;
    height: 22px;
    color: var(--vc-text-2);
  }

  .vc-method-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--vc-accent);
    margin-bottom: 2px;
    letter-spacing: 0.02em;
  }

  .vc-method-title {
    color: var(--vc-text);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
  }

  .vc-method-desc {
    margin-top: 2px;
    color: var(--vc-text-3);
    font-size: 13px;
    line-height: 1.4;
  }

  /* ── Capture (selfie) ── */

  .vc-capture {
    margin-top: 24px;
    border-radius: 18px;
    border: 1px solid var(--vc-border);
    background: var(--vc-surface);
    overflow: hidden;
  }

  .vc-capture-viewport {
    position: relative;
    aspect-ratio: 4 / 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--vc-bg);
  }

  .vc-capture-viewport::before {
    content: "";
    position: absolute;
    inset: 20px;
    border-radius: 16px;
    border: 1px dashed var(--vc-border);
  }

  .vc-face-guide {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 2px dashed var(--vc-border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vc-face-guide svg {
    width: 38px;
    height: 38px;
    color: var(--vc-text-3);
    opacity: 0.5;
  }

  .vc-capture-hint {
    margin-top: 14px;
    color: var(--vc-text-3);
    font-size: 13px;
  }

  .vc-capture-footer {
    padding: 12px 18px;
    border-top: 1px solid var(--vc-border);
    color: var(--vc-text-3);
    font-size: 13px;
    text-align: center;
  }

  /* ── Upload ── */

  .vc-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 24px;
    padding: 36px 24px;
    border: 1px dashed var(--vc-border-strong);
    border-radius: 18px;
    background: var(--vc-surface);
    text-align: center;
    cursor: pointer;
    transition: all 0.15s var(--vc-ease);
  }

  .vc-upload:hover {
    border-color: var(--vc-accent-border);
    background: var(--vc-accent-soft);
  }

  .vc-upload svg {
    width: 36px;
    height: 36px;
    color: var(--vc-text-3);
  }

  .vc-upload-title {
    margin-top: 14px;
    color: var(--vc-text);
    font-size: 15px;
    font-weight: 600;
  }

  .vc-upload-hint {
    margin-top: 4px;
    color: var(--vc-text-3);
    font-size: 13px;
  }

  /* ── Processing ── */

  .vc-processing {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
  }

  .vc-spinner {
    width: 36px;
    height: 36px;
    border: 2.5px solid var(--vc-border);
    border-top-color: var(--vc-accent);
    border-radius: 50%;
    animation: vc-spin 0.7s linear infinite;
  }

  @keyframes vc-spin { to { transform: rotate(360deg); } }

  .vc-processing-title {
    margin-top: 20px;
    color: var(--vc-text);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .vc-processing-hint {
    margin-top: 6px;
    color: var(--vc-text-3);
    font-size: 14px;
  }

  /* ── Complete ── */

  .vc-complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
  }

  .vc-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--vc-success-soft);
    border: 1px solid var(--vc-success-border);
    animation: vc-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes vc-pop {
    from { transform: scale(0.5); opacity: 0; }
    70% { transform: scale(1.06); }
    to { transform: scale(1); opacity: 1; }
  }

  .vc-check svg {
    width: 28px;
    height: 28px;
    color: var(--vc-success);
  }

  .vc-complete-title {
    margin-top: 20px;
    color: var(--vc-text);
    font-size: 22px;
    font-weight: 650;
    letter-spacing: -0.025em;
  }

  .vc-complete-text {
    margin-top: 6px;
    color: var(--vc-text-2);
    font-size: 15px;
    line-height: 1.5;
  }

  .vc-complete-note {
    margin-top: 8px;
    color: var(--vc-text-3);
    font-size: 13px;
  }

  .vc-complete .vc-btn-ghost {
    max-width: 200px;
    margin-top: 28px;
  }

  /* ── Mobile: true full-screen ── */

  @media (max-width: 640px) {
    .vc-overlay {
      padding: 0;
    }

    .vc-modal {
      width: 100%;
      height: 100%;
      max-height: none;
      border-radius: 0;
    }

    .vc-body {
      padding: 0 24px 28px;
    }

    .vc-topbar {
      padding: 14px 18px;
    }
  }
`;
