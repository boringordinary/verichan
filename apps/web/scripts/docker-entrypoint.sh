#!/bin/sh
set -e
cd /app
exec bun server.ts
