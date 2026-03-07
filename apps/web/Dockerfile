# Dockerfile for Web (Vite SPA + Bun static server)
# Build: docker build --secret id=DOPPLER_TOKEN,env=DOPPLER_TOKEN -f apps/web/Dockerfile -t verichan-web .

FROM oven/bun:1.2.23-alpine AS base

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
COPY packages/embed/package.json ./packages/embed/

# Install all dependencies
RUN bun install --ignore-scripts

# Copy web app source + embed package (aliased in vite.config.ts)
COPY apps/web ./apps/web
COPY packages/embed ./packages/embed

# Run tests
WORKDIR /app/apps/web
RUN --mount=type=secret,id=DOPPLER_TOKEN \
    DOPPLER_TOKEN=$(cat /run/secrets/DOPPLER_TOKEN) \
    doppler run --no-fallback -- bunx vitest run

# Build with Vite
RUN --mount=type=secret,id=DOPPLER_TOKEN \
    DOPPLER_TOKEN=$(cat /run/secrets/DOPPLER_TOKEN) \
    doppler run --no-fallback -- bunx --bun vite build

# Compile static server to binary
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./server.ts

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

# Copy compiled server binary
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/server ./server

# Runtime config (DOPPLER_TOKEN must be passed via container env at deploy time)
ENV NODE_ENV=production \
    PORT=1069

USER nodejs
EXPOSE 1069

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:1069/api/health || exit 1

CMD ["doppler", "run", "--no-fallback", "--", "./server"]
