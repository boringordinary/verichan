# Dockerfile for Web (Vite SPA + Bun static server)
# Build: docker build --build-arg DOPPLER_TOKEN=$DOPPLER_TOKEN -f apps/web/Dockerfile -t chanid-web .

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
