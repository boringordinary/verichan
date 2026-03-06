# Embed SDK Implementation Review

## Architecture Overview

The `@verichan/embed` package is a zero-dependency, vanilla JS widget that renders an identity verification flow inside a closed Shadow DOM. It exposes a singleton `window.Verichan` with `open()` / `close()` methods. The API layer (`apps/api`) already has session creation, token lookup, and webhook plumbing.

---

## What Works Well

### Shadow DOM isolation
Closed shadow DOM is the right call for an embeddable widget. Host-site CSS can't leak in, and the widget's styles can't leak out. This is the industry-standard approach (Stripe, Plaid, etc.).

### Zero dependencies
The entire SDK is ~17.5KB minified. No framework, no runtime. This is critical for an embed — every KB matters, and framework overhead would be unjustifiable for a five-step modal.

### Event delegation
Single `click` listener on the overlay with `[data-action]` delegation is clean and avoids listener cleanup issues. Registering it once during host creation (not on every render) is correct.

### String-based rendering
For a widget this simple, `innerHTML` with template literals is pragmatic. A virtual DOM or reactive system would be over-engineering. The entire UI is a single modal with five states — re-rendering the whole thing on step change is fine.

### API session model
The existing `sessions.ts` endpoint already supports `organizationId`, token generation, webhook URLs, and metadata. This maps cleanly to the multi-tenant model the SDK needs.

---

## Issues and Recommendations

### 1. No actual API integration (Critical)

The SDK currently fakes verification — `submit` just shows a spinner for 2.4s then calls `onVerified()`. There's no network call to the API.

**What's needed:**
- `open()` should accept a `sessionToken` (created server-side via the API)
- On submit, the SDK should POST the captured image to the API using that token
- The API should return a verification result, and the SDK should transition based on it
- The `onVerified` / `onError` callbacks should fire based on actual API responses

```ts
// Target integration
Verichan.open({
  sessionToken: "vcs_abc123...",
  onVerified: () => { /* unlock content */ },
  onError: (err) => { /* handle failure */ },
});
```

### 2. No actual image capture

The selfie flow renders a placeholder viewport but doesn't access `getUserMedia()`. The upload flow renders a drop zone but has no file input or drag-and-drop handler.

**What's needed:**
- Selfie: request camera via `navigator.mediaDevices.getUserMedia()`, render `<video>` in the viewport, capture frame to canvas on "Capture" click
- Upload: hidden `<input type="file">` triggered on click, `dragover`/`drop` handlers on the drop zone, file size/type validation
- Both paths should produce a `Blob` or `File` to send to the API

### 3. Memory leak on Escape handler

```ts
// index.ts:93-95
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && this.step !== "processing") this.close();
});
```

This listener is added to `document` but never removed. If the host is destroyed and recreated (SPA navigation), listeners accumulate. Store the reference and remove it in a `destroy()` method, or use `{ once: true }` with re-registration on each open.

### 4. No `destroy()` method

The SDK creates a DOM element and appends it to `document.body`, but there's no way to tear it down. SPAs that mount/unmount need this. Add:

```ts
destroy() {
  this.host?.remove();
  this.host = null;
  this.shadow = null;
  this.overlay = null;
}
```

### 5. Close behavior fires `onDismiss` even after completion

`close()` always calls `config.onDismiss?.()`. If the user clicks "Done" after successful verification, it fires both `onVerified` and `onDismiss`. These should be mutually exclusive — track whether verification completed and skip `onDismiss` if so.

### 6. No error state in the UI

There are five steps: consent, method, capture, processing, complete. There's no `error` step. Network failures, rejected verifications, and camera permission denials all need a visible error state with a retry option.

### 7. `clientId` config is accepted but unused

`VerichanConfig` declares `clientId` but nothing reads it. Either remove it (if using session tokens) or wire it up. Dead config options confuse integrators.

### 8. SDK doesn't validate required config

`open()` accepts `config = {}` with no validation. If `sessionToken` (or whatever auth mechanism) is required, fail fast with a clear error message rather than silently proceeding.

### 9. Build target should be ES2020+

The `bun build` command doesn't specify a target. For an embeddable SDK, explicitly set `--target=browser` and consider whether you need to support older browsers. Document the browser support matrix.

### 10. No CSP considerations documented

Sites with strict Content Security Policy headers will block inline styles injected via Shadow DOM. Document that integrators may need to add `style-src 'unsafe-inline'` or provide a nonce-based alternative.

---

## Is This the Best Approach?

**Yes, with caveats.** The core architecture — shadow DOM, vanilla JS, string templates, singleton pattern — is the right foundation for an embeddable verification widget. This is how Stripe Elements, Plaid Link, and similar products work.

The main gap is that it's currently a UI shell with no backend integration. The five-step flow, the rendering approach, and the isolation strategy are all sound. What's missing is the functional layer: camera access, file handling, API calls, error states, and session management.

### Alternative approaches considered:

| Approach | Verdict |
|----------|---------|
| **iframe-based** (like Stripe Checkout) | More secure (full origin isolation), but harder to style and communicate with. Worth considering if handling PII — the current shadow DOM approach means the host page's JS can technically access the shadow root via the `host` reference. For identity verification, an iframe pointing to a verichan-hosted page may be more appropriate from a compliance perspective. |
| **React/Preact embed** | Unnecessary overhead for five static screens. Current approach is better. |
| **Web Component (Custom Element)** | Could wrap the current class as `<verichan-verify>`. Nice API surface (`el.setAttribute("token", "...")`) but adds complexity for marginal benefit. Consider for v2. |
| **Redirect-based** (like OAuth) | Simpler security model — user goes to verichan.com, verifies, redirects back. Loses the embedded UX but gains compliance simplicity. Worth offering as an alternative flow. |

### Recommendation

For a compliance-sensitive product like identity verification, strongly consider the **iframe approach** for the production version. The current shadow DOM implementation is excellent for demos and low-risk use cases, but a hosted iframe gives you:
- Full origin isolation (host JS cannot access verification data)
- Easier PCI/SOC2 scoping (verification happens entirely on your domain)
- Simpler CSP story for integrators
- Control over the entire execution environment

The SDK would then become a thin wrapper that creates an iframe, posts messages to it, and relays events back to the host page — similar to how Stripe.js works.

---

## Summary

| Area | Status |
|------|--------|
| Architecture | Sound — shadow DOM + vanilla JS is correct |
| UI/UX | Complete and polished |
| API integration | Not implemented |
| Image capture | Not implemented |
| Error handling | Missing error state |
| Memory management | Escape listener leaks, no destroy() |
| Security model | Shadow DOM is good for demos; iframe recommended for production |
| Build/packaging | Works, needs explicit browser target |
| Documentation | Needs CSP and browser support docs |

**Bottom line:** The foundation is solid. The next priority should be wiring up actual image capture and API integration, adding an error state, and evaluating whether to move to an iframe model before handling real user data.
