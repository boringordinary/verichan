# Legal Notice Step — Design

## Summary

Add a "legal notice" as the first step in the verification modal. It informs users which law requires verification, with the law name linked to the actual legislation, plus a rich-text body authored via Tiptap.

## Flow

```
legal -> email -> method -> capture -> processing -> complete
```

## Law Data

Static TypeScript file. Devs update on behalf of compliance team.

```ts
// packages/shared/src/laws.ts
export interface Law {
  id: string;          // UUID
  name: string;        // "HB 1181"
  jurisdiction: string; // "Texas"
  url: string;         // link to the law
  body: string;        // HTML string (Tiptap output)
  category: string;    // "adult-content", "gambling", etc.
  effectiveDate: string;
}

export const laws: Record<string, Law> = {
  "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "HB 1181",
    jurisdiction: "Texas",
    url: "https://capitol.texas.gov/...",
    body: "<p>Texas law requires age verification for websites that publish material harmful to minors.</p>",
    category: "adult-content",
    effectiveDate: "2024-09-01",
  },
};
```

## Association Model

- **Per-client default**: Client has a `defaultLawId` field
- **Per-session override**: Session creation accepts optional `lawId`, falls back to client default
- API resolves the law from the static file and includes it in session data

## Embed SDK Changes

### Config

```ts
interface VerichanConfig {
  sessionToken: string;
  law: {
    name: string;
    jurisdiction: string;
    url: string;
    body: string; // HTML from Tiptap
  };
  // ...existing callbacks
}
```

### New Step Type

```ts
type Step = "legal" | "email" | "already-verified" | "method" | "capture" | "processing" | "complete" | "error";
```

### Legal Step UI

- Scale/gavel icon at top
- Title: "Verification Required"
- Subtitle: law name as a link to `law.url`, with jurisdiction
- Tiptap HTML body rendered in a styled container
- "Continue" button proceeds to email step

### Step Dots

Update from 2 dots to 3 dots (legal, method, capture).

### Navigation

- "back" from email step returns to legal step
- Initial open sets step to "legal" instead of "email"

## Files to Change

1. `packages/shared/src/laws.ts` — new file, law data + types
2. `packages/embed/src/render.ts` — add `legalBody()`, update `Step` type, update `stepDots` to 3, update back/close logic
3. `packages/embed/src/index.ts` — add `law` to config, set initial step to "legal", update back navigation, pass law data to render
4. `packages/embed/src/styles.ts` — styles for legal notice content area
5. `packages/embed/src/icons.ts` — add gavel/scale icon
6. `packages/embed/src/index.test.ts` — update tests for new step
