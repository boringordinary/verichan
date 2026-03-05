# Turborepo Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the verichan project from a flat structure into a Turborepo monorepo with `apps/api` (Elysia backend) and `apps/web` (Vite + React frontend), including Dockerfiles for deployment.

**Architecture:** Bun-based Turborepo monorepo modeled after the audiochan repo. The root orchestrates builds/dev via turbo. Each app has its own package.json, tsconfig.json, and Dockerfile. The API compiles to a standalone binary for production. The web app builds with Vite and serves static files via a Bun server.

**Tech Stack:** Bun, Turborepo, Elysia, Drizzle ORM, PostgreSQL, Vite, React 19, TanStack Router, Tailwind CSS v4, Docker, Doppler

---

### Task 1: Create monorepo directory structure

**Files:**
- Create: `apps/api/` (directory)
- Create: `apps/web/` (directory)

**Step 1: Create directories**

```bash
mkdir -p apps/api/src/database apps/api/docker apps/web/src apps/web/public apps/web/scripts
```

**Step 2: Move existing backend code to apps/api**

```bash
mv src/index.ts apps/api/src/index.ts
mv src/database/index.ts apps/api/src/database/index.ts
mv src/database/schema.ts apps/api/src/database/schema.ts
mv drizzle.config.ts apps/api/drizzle.config.ts
```

If a `drizzle/` migrations directory exists, move it too:
```bash
[ -d drizzle ] && mv drizzle apps/api/drizzle
```

**Step 3: Clean up old src directory**

```bash
rmdir src/database src 2>/dev/null || true
```

**Step 4: Verify structure**

```bash
ls -la apps/api/src/
ls -la apps/api/src/database/
ls -la apps/web/src/
```

Expected: `index.ts` in api/src, `index.ts` and `schema.ts` in api/src/database, empty web/src.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: create monorepo directory structure and move api code"
```

---

### Task 2: Create root monorepo configuration

**Files:**
- Create: `package.json` (overwrite root)
- Create: `turbo.json`
- Create: `tsconfig.json` (overwrite root)
- Create: `bunfig.toml`

**Step 1: Write root package.json**

```json
{
  "name": "verichan",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.2.23",
  "engines": {
    "node": ">=20.0.0"
  },
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "bunx --bun turbo run dev --filter=@verichan/api --filter=@verichan/web",
    "dev:api": "bunx --bun turbo run dev --filter=@verichan/api",
    "dev:web": "bunx --bun turbo run dev --filter=@verichan/web",
    "build": "bunx --bun turbo run build",
    "test": "bunx --bun turbo run test",
    "typecheck": "bunx --bun turbo run typecheck",
    "lint": "bunx --bun turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.8.11",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Write turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["DATABASE_URL"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "cache": false
    },
    "test": {
      "cache": false,
      "dependsOn": ["^build"]
    }
  }
}
```

**Step 3: Write root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "noEmit": true
  },
  "include": ["apps"],
  "exclude": [
    "node_modules",
    "**/node_modules",
    "**/dist",
    "**/.turbo"
  ]
}
```

**Step 4: Write bunfig.toml**

```toml
[install]
optional = true
saveTextLockfile = true
frozenLockfile = false

[test]
root = "apps/api"
timeout = 5000
coverage = false
```

**Step 5: Run bun install to verify workspace resolution**

```bash
bun install
```

Expected: installs without errors (will show workspace packages once app package.jsons exist).

**Step 6: Commit**

```bash
git add turbo.json bunfig.toml package.json tsconfig.json
git commit -m "chore: add root monorepo configuration (turbo, bun, typescript)"
```

---

### Task 3: Create apps/api package configuration

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Modify: `apps/api/drizzle.config.ts` (update schema path)

**Step 1: Write apps/api/package.json**

```json
{
  "name": "@verichan/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "dev": "doppler run --no-fallback -- bun --watch src/index.ts",
    "build": "doppler run --no-fallback -- bun build src/index.ts --outdir=dist --target=bun",
    "start": "doppler run --no-fallback -- bun dist/index.js",
    "test": "doppler run --no-fallback -- bun test",
    "typecheck": "tsc --noEmit",
    "db:generate": "doppler run --no-fallback -- drizzle-kit generate",
    "db:migrate": "doppler run --no-fallback -- drizzle-kit migrate",
    "db:push": "doppler run --no-fallback -- drizzle-kit push",
    "db:studio": "doppler run --no-fallback -- drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "drizzle-typebox": "^0.3.3",
    "elysia": "^1.4.27"
  },
  "devDependencies": {
    "@types/bun": "^1.3.10",
    "bun-types": "^1.3.10",
    "drizzle-kit": "^0.31.9",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Write apps/api/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["bun-types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Update apps/api/drizzle.config.ts**

The schema path needs updating since the file is now at `apps/api/drizzle.config.ts` but schema is at `apps/api/src/database/schema.ts`. The relative path stays the same since both moved together:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: Bun.env.DATABASE_URL!,
  },
});
```

No change needed — verify the file is correct as-is.

**Step 4: Update apps/api/src/index.ts to add health endpoint and configurable port**

```typescript
import { Elysia } from "elysia";
import { db } from "./database";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 3000;

const app = new Elysia()
  .decorate("db", db)
  .get("/", () => "verichan")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(port);

console.log(`Server running at ${app.server?.url}`);
```

**Step 5: Run typecheck**

```bash
cd apps/api && bunx tsc --noEmit
```

Expected: no errors.

**Step 6: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json apps/api/drizzle.config.ts apps/api/src/index.ts
git commit -m "chore: add api package configuration"
```

---

### Task 4: Create apps/web package with Vite + React scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/app.css`
- Create: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/routeTree.gen.ts` (auto-generated by TanStack Router plugin)
- Create: `apps/web/server.ts`
- Create: `apps/web/scripts/docker-entrypoint.sh`

**Step 1: Write apps/web/package.json**

```json
{
  "name": "@verichan/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "doppler run --no-fallback -- vite --port 5173",
    "build": "doppler run --no-fallback -- vite build",
    "start:prod": "doppler run --no-fallback -- bun server.ts",
    "preview": "doppler run --no-fallback -- vite preview",
    "test": "doppler run --no-fallback -- vitest run",
    "test:watch": "doppler run --no-fallback -- vitest --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.139.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.17",
    "@tanstack/router-plugin": "^1.139.1",
    "@types/react": "^19.2.6",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "typescript": "^5.9.3",
    "vite": "^7.2.4",
    "vitest": "^4.0.13"
  }
}
```

**Step 2: Write apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 3: Write apps/web/vite.config.ts**

```typescript
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  const isTest = mode === "test";

  const plugins = [viteReact()];

  if (!isTest) {
    plugins.unshift(
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      })
    );
    plugins.push(tailwindcss());
  }

  return {
    plugins,
    define: {
      "process.env": {},
    },
    test: {
      globals: true,
      environment: "happy-dom",
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      open: false,
    },
    build: {
      minify: isProduction ? "terser" : undefined,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
    },
  };
});
```

**Step 4: Write apps/web/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>verichan</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Write apps/web/src/app.css**

```css
@import "tailwindcss";
```

**Step 6: Write apps/web/src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./app.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

**Step 7: Write apps/web/src/routes/__root.tsx**

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
});
```

**Step 8: Write apps/web/src/routes/index.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div>
      <h1>verichan</h1>
    </div>
  );
}
```

**Step 9: Write apps/web/server.ts** (production static file server, modeled after audiochan)

```typescript
import { serve } from "bun";

const port = process.env.PORT ? parseInt(process.env.PORT) : 5173;
const publicDir = "./dist";

serve({
  port,
  async fetch(req: Request) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Health check
    if (path === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          service: "verichan-web",
          uptime: process.uptime(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Security: prevent directory traversal
    if (path.includes("..")) {
      return new Response("Not Found", { status: 404 });
    }

    // Try to serve the exact file
    const file = Bun.file(`${publicDir}${path}`);
    if (await file.exists()) {
      return new Response(file, {
        headers: {
          ...(shouldCache(path) && {
            "Cache-Control": "public, max-age=31536000, immutable",
          }),
        },
      });
    }

    // SPA fallback for navigation requests
    const accepts = req.headers.get("accept") ?? "";
    const secFetchDest = req.headers.get("sec-fetch-dest") ?? "";
    const secFetchMode = req.headers.get("sec-fetch-mode") ?? "";

    const isDocumentRequest =
      req.method === "GET" &&
      (secFetchDest === "document" ||
        secFetchMode === "navigate" ||
        (!path.includes(".") && accepts.includes("text/html")));

    if (isDocumentRequest) {
      const rootIndex = Bun.file(`${publicDir}/index.html`);
      if (await rootIndex.exists()) {
        return new Response(rootIndex, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store, must-revalidate",
          },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

function shouldCache(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  const cacheableExtensions = [
    "js", "css", "png", "jpg", "jpeg", "gif", "svg", "ico",
    "woff", "woff2", "ttf", "otf",
  ];
  return cacheableExtensions.includes(ext || "");
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
```

**Step 10: Write apps/web/scripts/docker-entrypoint.sh**

```bash
#!/bin/sh
set -e
cd /app
exec bun run start:prod
```

**Step 11: Install dependencies and generate route tree**

```bash
bun install
cd apps/web && bunx vite build --mode development 2>/dev/null || true
```

The TanStack Router plugin auto-generates `routeTree.gen.ts` when vite runs. Alternatively:

```bash
cd apps/web && bunx tsr generate
```

**Step 12: Verify web dev server starts**

```bash
cd apps/web && doppler run --no-fallback -- bunx vite --port 5173
```

Expected: Vite dev server starts on port 5173.

**Step 13: Commit**

```bash
git add apps/web/
git commit -m "feat: add web package with Vite + React + TanStack Router scaffold"
```

---

### Task 5: Create API Dockerfile

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/docker/entrypoint.sh`

**Step 1: Write apps/api/Dockerfile**

```dockerfile
# Dockerfile for Elysia API with Bun + Doppler
# Build: docker build --build-arg DOPPLER_TOKEN=$DOPPLER_TOKEN -f apps/api/Dockerfile -t verichan-api .

FROM oven/bun:1.3.9-alpine AS base

# Install Doppler CLI and bash (needed for entrypoint)
RUN apk add --no-cache wget bash && \
    wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache doppler && \
    rm -rf /var/cache/apk/*

# ============================================================================
# Builder: Install all deps + compile binary
# ============================================================================
FROM base AS builder
WORKDIR /app

# Copy workspace config
COPY package.json bunfig.toml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN bun install --ignore-scripts

# Copy API source
COPY apps/api ./apps/api

# Run tests
ARG DOPPLER_TOKEN
ARG CACHE_BUST=1
RUN echo "Cache bust: ${CACHE_BUST}"

ENV SKIP_ENV_VALIDATION=1 \
    NODE_ENV=test
RUN doppler run --no-fallback -- bun test

# Reset for production build
ENV NODE_ENV=production

# Compile to standalone binary
WORKDIR /app/apps/api
RUN doppler run --no-fallback -- bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --production \
    --outfile server \
    ./src/index.ts

# ============================================================================
# Deps: Production dependencies only (for drizzle-kit migrations)
# ============================================================================
FROM base AS deps
WORKDIR /app

COPY package.json bunfig.toml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN bun install --production --ignore-scripts

# ============================================================================
# Runner: Minimal production image
# ============================================================================
FROM base AS runner
WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy compiled binary
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/server ./server

# Copy drizzle migration files
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src/database ./src/database
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/drizzle.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/tsconfig.json ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./

# Copy production node_modules (for drizzle-kit)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy entrypoint
COPY apps/api/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Runtime config
ARG DOPPLER_TOKEN
ENV DOPPLER_TOKEN=${DOPPLER_TOKEN} \
    NODE_ENV=production \
    PORT=3000

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
```

**Step 2: Write apps/api/docker/entrypoint.sh**

```bash
#!/usr/bin/env bash
set -e
set -o pipefail

trap "echo Container shutting down due to error; exit 1" ERR

echo "Container starting..."
echo "  NODE_ENV=$NODE_ENV"
echo "  DOPPLER_TOKEN=${DOPPLER_TOKEN:+[SET]}"

# Verify Doppler CLI is available
if ! command -v doppler >/dev/null 2>&1; then
    echo "ERROR: Doppler CLI not found in container!"
    exit 1
fi

# Run migrations
echo "Running database migrations..."
if ! doppler run --no-fallback -- bunx drizzle-kit migrate 2>&1; then
    echo "CRITICAL: Migration failed! Deployment must be rolled back."
    exit 1
fi
echo "Migrations completed successfully"

sleep 2

echo "Starting Elysia API server..."
exec doppler run --no-fallback -- /app/server
```

**Step 3: Commit**

```bash
git add apps/api/Dockerfile apps/api/docker/entrypoint.sh
git commit -m "feat: add API Dockerfile with multi-stage build"
```

---

### Task 6: Create Web Dockerfile

**Files:**
- Create: `apps/web/Dockerfile`

**Step 1: Write apps/web/Dockerfile**

```dockerfile
# Dockerfile for Web (Vite SPA + Bun static server)
# Build: docker build --build-arg DOPPLER_TOKEN=$DOPPLER_TOKEN -f apps/web/Dockerfile -t verichan-web .

FROM oven/bun:1.3.4-alpine AS base

# Install Doppler CLI
RUN apk add --no-cache wget && \
    wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache doppler && \
    rm -rf /var/cache/apk/*

# ============================================================================
# Builder: Install deps + build Vite app
# ============================================================================
FROM base AS builder
WORKDIR /app

# Copy workspace config
COPY package.json bunfig.toml tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN bun install --ignore-scripts

# Copy web app source
COPY apps/web ./apps/web

# Run tests
ARG DOPPLER_TOKEN
WORKDIR /app/apps/web
RUN doppler run --no-fallback -- bunx vitest run

# Build with Vite
RUN doppler run --no-fallback -- bunx --bun vite build

# ============================================================================
# Runner: Minimal static server
# ============================================================================
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built static files
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/dist ./dist

# Copy server and scripts
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/server.ts ./server.ts
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/scripts ./scripts
RUN chmod +x ./scripts/docker-entrypoint.sh

# Runtime config
ARG DOPPLER_TOKEN
ENV DOPPLER_TOKEN=${DOPPLER_TOKEN} \
    NODE_ENV=production \
    PORT=5173

USER nodejs
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["doppler", "run", "--no-fallback", "--", "/app/scripts/docker-entrypoint.sh"]
```

**Step 2: Commit**

```bash
git add apps/web/Dockerfile
git commit -m "feat: add Web Dockerfile with multi-stage build"
```

---

### Task 7: Update root .gitignore and clean up stale root files

**Files:**
- Modify: `.gitignore`
- Delete: old root `drizzle.config.ts` (already moved in Task 1)

**Step 1: Update .gitignore** to add turborepo-specific entries

Append to existing `.gitignore`:

```
# turborepo
.turbo
```

**Step 2: Remove stale root-level files** if they still exist

```bash
rm -f drizzle.config.ts
```

(Should already be gone from Task 1, but verify.)

**Step 3: Verify final project structure**

```bash
find . -not -path './node_modules/*' -not -path './.git/*' -not -path './.turbo/*' -type f | sort
```

Expected structure:
```
./CLAUDE.md
./README.md
./.gitignore
./package.json
./turbo.json
./tsconfig.json
./bunfig.toml
./bun.lock
./apps/api/package.json
./apps/api/tsconfig.json
./apps/api/drizzle.config.ts
./apps/api/Dockerfile
./apps/api/docker/entrypoint.sh
./apps/api/src/index.ts
./apps/api/src/database/index.ts
./apps/api/src/database/schema.ts
./apps/web/package.json
./apps/web/tsconfig.json
./apps/web/vite.config.ts
./apps/web/index.html
./apps/web/server.ts
./apps/web/Dockerfile
./apps/web/scripts/docker-entrypoint.sh
./apps/web/src/main.tsx
./apps/web/src/App.tsx
./apps/web/src/app.css
./apps/web/src/routes/__root.tsx
./apps/web/src/routes/index.tsx
./apps/web/src/routeTree.gen.ts
./docs/plans/2026-03-04-turborepo-conversion.md
```

**Step 4: Run bun install at root to verify workspace resolution**

```bash
bun install
```

Expected: resolves `@verichan/api` and `@verichan/web` workspaces.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: update gitignore and clean up stale root files"
```

---

### Task 8: Verify everything works end-to-end

**Step 1: Verify turbo dev starts both apps**

```bash
bun dev
```

Expected: Both API (port 3000) and Web (port 5173) start.

**Step 2: Verify turbo build succeeds**

```bash
bun build
```

Expected: API builds to `apps/api/dist/`, Web builds to `apps/web/dist/`.

**Step 3: Verify typecheck passes**

```bash
bun typecheck
```

Expected: No TypeScript errors.

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix any issues from end-to-end verification"
```
