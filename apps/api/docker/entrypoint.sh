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
