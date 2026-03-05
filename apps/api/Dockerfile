# Dockerfile for Elysia API with Bun + Doppler
# Build: docker build --build-arg DOPPLER_TOKEN=$DOPPLER_TOKEN -f apps/api/Dockerfile -t chanid-api .

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
