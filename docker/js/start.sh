#!/usr/bin/env sh
set -eu

cd /app

LOCK_HASH="$(sha1sum package-lock.json | awk '{print $1}')"
INSTALLED_HASH="$(cat node_modules/.package-lock.hash 2>/dev/null || true)"

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ] || [ "$LOCK_HASH" != "$INSTALLED_HASH" ]; then
    npm install
    mkdir -p node_modules
    printf '%s' "$LOCK_HASH" > node_modules/.package-lock.hash
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
