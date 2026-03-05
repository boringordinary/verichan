#!/bin/sh
set -e
cd /app
exec bun run start:prod
